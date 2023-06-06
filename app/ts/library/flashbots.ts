import { utils } from 'ethers'
import { AppSettings, BlockInfo, Bundle, Signers } from '../types/types.js'
import { createBundleTransactions, getMaxBaseFeeInFutureBlock, signBundle } from './bundleUtils.js'
import { ProviderStore } from './provider.js'

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
	bundleGasPrice: BigInt
	bundleHash: string
	coinbaseDiff: BigInt
	ethSentToCoinbase: BigInt
	gasFees: BigInt
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
	appSettings: AppSettings
) {
	if (appSettings.blocksInFuture <= 0n) throw new Error('Blocks in future is negative or zero')

	const maxBaseFee = getMaxBaseFeeInFutureBlock(blockInfo.baseFee, appSettings.blocksInFuture)
	const txs = await signBundle(
		await createBundleTransactions(bundle, signers, blockInfo, appSettings.blocksInFuture, fundingAmountMin),
		provider.provider,
		blockInfo,
		maxBaseFee,
	)

	const payload = JSON.stringify({ jsonrpc: '2.0', method: 'eth_callBundle', params: [{ txs, blockNumber: `0x${blockInfo.blockNumber.toString(16)}`, stateBlockNumber: 'latest' }] })
	const flashbotsSig = `${await provider.authSigner.getAddress()}:${await provider.authSigner.signMessage(utils.id(payload))}`
	const request = await fetch(appSettings.relayEndpoint,
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

export async function sendBundle(bundle: Bundle, targetBlock: bigint, fundingAmountMin: bigint, provider: ProviderStore, signers: Signers, blockInfo: BlockInfo, appSettings: AppSettings) {
	if (appSettings.blocksInFuture <= 0n) throw new Error('Blocks in future is negative or zero')

	const maxBaseFee = getMaxBaseFeeInFutureBlock(blockInfo.baseFee, appSettings.blocksInFuture)
	const txs = await signBundle(
		await createBundleTransactions(bundle, signers, blockInfo, appSettings.blocksInFuture, fundingAmountMin),
		provider.provider,
		blockInfo,
		maxBaseFee,
	)

	const payload = JSON.stringify({ jsonrpc: '2.0', method: 'eth_sendBundle', params: [{ txs, blockNumber: `0x${targetBlock.toString(16)}`, revertingTxHashes: [] }] })
	const flashbotsSig = `${await provider.authSigner.getAddress()}:${await provider.authSigner.signMessage(utils.id(payload))}`
	const request = await fetch(appSettings.relayEndpoint,
		{ method: 'POST', body: payload, headers: { 'Content-Type': 'application/json', 'X-Flashbots-Signature': flashbotsSig } }
	)
	const response = await request.json()

	if (response.error !== undefined && response.error !== null) {
		throw {
			message: response.error.message,
			code: response.error.code,
		}
	}

	const bundleTransactions = txs.map((signedTransaction) => {
		const transactionDetails = utils.parseTransaction(signedTransaction)
		return {
			signedTransaction,
			hash: utils.keccak256(signedTransaction),
			account: transactionDetails.from || '0x0',
			nonce: BigInt(transactionDetails.nonce),
		}
	})

	return {
		bundleTransactions,
		bundleHash: response.result.bundleHash,
	}
}

export async function checkBundleInclusion(transactions: { hash: string }[], provider: ProviderStore) {
	const receipts = await Promise.all(transactions.map((tx) => provider.provider.getTransactionReceipt(tx.hash)))
	return { transactions, included: receipts.filter(x => x === null).length === 0 }
}
