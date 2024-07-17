import { ethers, id, keccak256, toUtf8Bytes, Transaction } from 'ethers'
import { BlockInfo, Bundle, Signers } from '../types/types.js'
import { createBundleTransactions, getMaxBaseFeeInFutureBlock, getRawTransactions } from './bundleUtils.js'
import { ProviderStore } from './provider.js'
import { BouquetNetwork } from '../types/bouquetTypes.js'

interface TransactionSimulationBase {
	txHash: string
	gasUsed: number
	gasFees: string
	gasPrice: string
	toAddress: string
	fromAddress: string
	coinbaseDiff: string
}

export interface TransactionSimulationSuccess extends TransactionSimulationBase {
	value: string
	ethSentToCoinbase: string
}

export interface TransactionSimulationRevert extends TransactionSimulationBase {
	error: string
	revert: string
}

export type TransactionSimulation = TransactionSimulationSuccess | TransactionSimulationRevert

export interface RelayResponseError {
	error: {
		message: string
		code: number
	}
}

export interface SimulationResponseSuccess {
	bundleGasPrice: bigint
	bundleHash: string
	coinbaseDiff: bigint
	ethSentToCoinbase: bigint
	gasFees: bigint
	results: Array<TransactionSimulation>
	totalGasUsed: number
	stateBlockNumber: number
	firstRevert?: TransactionSimulation
}

export type SimulationResponse = SimulationResponseSuccess | RelayResponseError

export async function simulateBundle(
	bundle: Bundle,
	fundingAmountMin: bigint,
	provider: ProviderStore,
	signers: Signers,
	blockInfo: BlockInfo,
	network: BouquetNetwork
) {
	if (network.blocksInFuture <= 0n) throw new Error('Blocks in future is negative or zero')

	const maxBaseFee = getMaxBaseFeeInFutureBlock(blockInfo.baseFee, network.blocksInFuture)
	const txs = await getRawTransactions(
		await createBundleTransactions(bundle, signers, blockInfo, network.blocksInFuture, fundingAmountMin),
		provider.provider,
		blockInfo,
		maxBaseFee,
	)

	if (network.simulationRelayEndpoint === undefined) throw new Error('simulationRelayEndpoint is not defined')
	const payload = JSON.stringify({ jsonrpc: '2.0', method: 'eth_callBundle', params: [{ txs, blockNumber: `0x${blockInfo.blockNumber.toString(16)}`, stateBlockNumber: 'latest' }] })
	const flashbotsSig = `${await provider.authSigner.getAddress()}:${await provider.authSigner.signMessage(id(payload))}`
	const request = await fetch(network.simulationRelayEndpoint,
		{ method: 'POST', body: payload, headers: { 'Content-Type': 'application/json', 'X-Flashbots-Signature': flashbotsSig } }
	)
	const response = await request.json()

	if (response.error !== undefined && response.error !== null) {
		return {
			error: {
				message: response.error.message,
				code: response.error.code,
			},
		}
	}

	const callResult = response.result
	return {
		bundleGasPrice: BigInt(callResult.bundleGasPrice),
		bundleHash: callResult.bundleHash,
		coinbaseDiff: BigInt(callResult.coinbaseDiff),
		ethSentToCoinbase: BigInt(callResult.ethSentToCoinbase),
		gasFees: BigInt(callResult.gasFees),
		results: callResult.results,
		stateBlockNumber: callResult.stateBlockNumber,
		totalGasUsed: callResult.results.reduce((a: number, b: TransactionSimulation) => a + b.gasUsed, 0),
		firstRevert: callResult.results.find((txSim: TransactionSimulation) => 'revert' in txSim || 'error' in txSim),
	}
}

let bundleId = 1
export async function sendBundle(bundle: Bundle, targetBlock: bigint, fundingAmountMin: bigint, provider: ProviderStore, signers: Signers, blockInfo: BlockInfo, network: BouquetNetwork) {
	if (network.blocksInFuture <= 0n) throw new Error('Blocks in future is negative or zero')
	const maxBaseFee = getMaxBaseFeeInFutureBlock(blockInfo.baseFee, network.blocksInFuture)
	const transactions = await getRawTransactions(
		await createBundleTransactions(bundle, signers, blockInfo, network.blocksInFuture, fundingAmountMin),
		provider.provider,
		blockInfo,
		maxBaseFee,
	)
	
	switch(network.relayMode) {
		case 'mempool': {
			const payloads = transactions.map((transaction, index) => JSON.stringify({
				jsonrpc: '2.0',
				method: 'eth_sendRawTransaction',
				id: index,
				params: [transaction]
			}))
			const requests = await Promise.all(payloads.map(async (payload) => await fetch(network.mempoolSubmitRpcEndpoint,
				{ method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' } }
			)))
			for (const request of requests) {
				const response = await request.json()
				if (response.error !== undefined && response.error !== null) {
					console.log(payloads)
					console.log(response)
					throw new Error(response.error.message)
				}
			}
		
			const bundleTransactions = transactions.map((signedTransaction) => {
				const transactionDetails = Transaction.from(signedTransaction)
				return {
					signedTransaction,
					hash: keccak256(signedTransaction),
					account: transactionDetails.from || '0x0',
					nonce: BigInt(transactionDetails.nonce),
				}
			})
		
			return { bundleTransactions, bundleIdentifier: ethers.keccak256(toUtf8Bytes(payloads.join('|'))) }
		}
		case 'relay': {
			const payload = JSON.stringify({
				jsonrpc: '2.0',
				method: 'eth_sendBundle',
				id: bundleId++,
				params: [{ transactions, blockNumber: `0x${targetBlock.toString(16)}`, revertingTxHashes: [] }]
			})
			const flashbotsSig = `${await provider.authSigner.getAddress()}:${await provider.authSigner.signMessage(id(payload))}`
			
			if (network.submissionRelayEndpoint === undefined) throw new Error('submissionRelayEndpoint is not defined')
			const request = await fetch(network.submissionRelayEndpoint,
				{ method: 'POST', body: payload, headers: { 'Content-Type': 'application/json', 'X-Flashbots-Signature': flashbotsSig } }
			)
			const response = await request.json()
		
			if (response.error !== undefined && response.error !== null) {
				throw {
					message: response.error.message,
					code: response.error.code,
				}
			}
		
			const bundleTransactions = transactions.map((signedTransaction) => {
				const transactionDetails = Transaction.from(signedTransaction)
				return {
					signedTransaction,
					hash: keccak256(signedTransaction),
					account: transactionDetails.from || '0x0',
					nonce: BigInt(transactionDetails.nonce),
				}
			})
		
			return { bundleTransactions, bundleIdentifier: response.result.bundleHash }
		}
	}
}

export async function checkBundleInclusion(transactions: { hash: string }[], provider: ProviderStore) {
	const receipts = await Promise.all(transactions.map((tx) => provider.provider.getTransactionReceipt(tx.hash)))
	const includedInBlocks = Array.from(new Set(receipts.filter((receipt): receipt is ethers.TransactionReceipt => receipt !== null).map((receipt) => BigInt(receipt.blockNumber))))
	return { transactions, included: receipts.filter(x => x === null).length === 0, includedInBlocks }
}
