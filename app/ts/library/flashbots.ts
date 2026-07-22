import { AddressLike, ethers, id, keccak256, toUtf8Bytes, Transaction } from 'ethers'
import { BlockInfo, Bundle, Signers } from '../types/types.js'
import { createBundleTransactions, getMaxBaseFeeInFutureBlock, getRawTransactionsAndCalculateFeesAndNonces, withPriorityFee } from './bundleUtils.js'
import { ProviderStore } from './provider.js'
import { BouquetNetwork } from '../types/bouquetTypes.js'
import { EthSimulateV1CallResult, EthSimulateV1CallResults, EthSimulateV1Params, EthSimulateV1Result, JsonRpcResponse, TransactionType } from '../types/ethSimulateTypes.js'
import { serialize } from '../types/ethereumTypes.js'
import { addressString, min, hexStringToUint8Array } from './utils.js'

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

export type SimulationResponseSuccess = {
	bundleGasPrice: bigint
	bundleHash: string
	coinbaseDiff: bigint
	ethSentToCoinbase: bigint
	gasFees: bigint
	results: Array<TransactionSimulation>
	totalGasUsed: bigint
	stateBlockNumber: number
	firstRevert: TransactionSimulation | undefined
} | {
	totalGasUsed: bigint
	firstRevert: EthSimulateV1CallResult & {
		toAddress: string
		fromAddress: string | undefined
	} | undefined
	results: EthSimulateV1CallResults
	gasFees: bigint
}

export type SimulationResponse = SimulationResponseSuccess | RelayResponseError

export type BundleStats = {
	isSimulated: boolean
	consideredByBuilders: number
	sealedByBuilders: number
}

export type BundleStatsResult =
	| { status: 'available', stats: BundleStats }
	| { status: 'unavailable' }

type RelayTargetSubmission =
	| { status: 'accepted', targetBlock: bigint, bundleIdentifier: string }
	| { status: 'rejected', error: unknown }

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const getArrayLength = (value: unknown) => Array.isArray(value) ? value.length : 0

export const createRelaySimulationPayload = (transactions: readonly string[], targetBlock: bigint) => JSON.stringify({
	jsonrpc: '2.0',
	id: 0,
	method: 'eth_callBundle',
	params: [{ txs: transactions, blockNumber: `0x${targetBlock.toString(16)}`, stateBlockNumber: 'latest' }],
})

export const describeBundleStats = (result: BundleStatsResult): string => {
	if (result.status === 'unavailable') return 'The relay accepted it, but does not provide detailed bundle statistics.'
	if (result.stats.sealedByBuilders > 0) return `The relay accepted and simulated it, and ${result.stats.sealedByBuilders.toString()} builder${result.stats.sealedByBuilders === 1 ? '' : 's'} sealed a block containing it, but the proposer selected a different block.`
	if (result.stats.consideredByBuilders > 0) return `The relay accepted and simulated it, and ${result.stats.consideredByBuilders.toString()} builder${result.stats.consideredByBuilders === 1 ? '' : 's'} considered it, but none sealed a block containing it.`
	if (result.stats.isSimulated) return 'The relay accepted and simulated it, but no builder reported considering it.'
	return 'The relay accepted it, but did not report a successful simulation.'
}

export async function simulateBundle(
	bundle: Bundle,
	fundingAmountMin: bigint,
	provider: ProviderStore,
	signers: Signers,
	blockInfo: BlockInfo,
	targetBlock: bigint,
	network: BouquetNetwork
): Promise<SimulationResponse> {
	const blocksInFuture = targetBlock - blockInfo.blockNumber
	if (blocksInFuture <= 0n) throw new Error('Simulation target block must be in the future')
	const signingBlockInfo = withPriorityFee(blockInfo, network.priorityFee)
	const maxBaseFee = getMaxBaseFeeInFutureBlock(blockInfo.baseFee, blocksInFuture)
	if (bundle.rescueMode && network.relayMode !== 'relay') throw new Error('EIP-7702 rescue bundles require a private relay')
	const bundleTransactions = await createBundleTransactions(bundle, signers, signingBlockInfo, blocksInFuture, fundingAmountMin, provider.provider)
	const txs = await getRawTransactionsAndCalculateFeesAndNonces(bundleTransactions, provider.provider, signingBlockInfo, maxBaseFee)

	const bigIntify = (ethersValue: ethers.BigNumberish | null | undefined | AddressLike) => ethersValue ? BigInt(ethersValue.toString()) : undefined

	switch(network.relayMode) {
		case 'mempool': {
			if (network.mempoolSimulationRpcEndpoint === undefined) throw new Error('mempoolSimulationRpcEndpoint is not defined')
			const data: EthSimulateV1Params = {
				method: 'eth_simulateV1',
				params: [ { 'blockStateCalls': [ { calls: txs.map((tx) => ({
					type: TransactionType.parse(tx.transaction.type),
					to: bigIntify(tx.transaction.to),
					from: bigIntify(tx.transaction.from),
					nonce: bigIntify(tx.transaction.nonce),
					gas: bigIntify(tx.transaction.gasLimit),
					maxPriorityFeePerGas: bigIntify(tx.transaction.maxPriorityFeePerGas),
					maxFeePerGas: bigIntify(tx.transaction.maxFeePerGas),
					input: tx.transaction.data === null || tx.transaction.data === undefined ? new Uint8Array() : hexStringToUint8Array(tx.transaction.data),
					value: bigIntify(tx.transaction.value),
					chainId: bigIntify(tx.transaction.chainId),
					accessList: [],
				})) } ], traceTransfers: false, validation: true }, 'latest' ]
			} as const
			const serialized = serialize(EthSimulateV1Params, data)
			try {
				const request = await fetch(network.mempoolSimulationRpcEndpoint, { method: 'POST', body: JSON.stringify({ jsonrpc: '2.0', id: 0, ...serialized }), headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(60000) })
				const response = JsonRpcResponse.parse(await request.json())
				if ('error' in response) {
					console.log(response)
					throw new Error(response.error.message)
				}
				const parsed = EthSimulateV1Result.parse(response.result)
				const calls = parsed[0].calls

				return {
					totalGasUsed: calls.reduce((a, b) => a + b.gasUsed, 0n),
					firstRevert: calls.map((call, index) => {
						const to = bigIntify(txs[index].transaction.to)
						if (to === undefined) throw new Error('to is undefined')
						const from = bigIntify(txs[index].transaction.from)
						return {
							...call,
							toAddress: addressString(to),
							fromAddress: from !== undefined ? addressString(from) : undefined,
						}
					}).find((txSim) => txSim.status === 'failure'),
					results: calls,
					gasFees: txs.reduce((totalFee, tx, currentIndex) => {
						if (tx.transaction.gasPrice) return totalFee + BigInt(tx.transaction.gasPrice) * calls[currentIndex].gasUsed
						return totalFee + min(parsed[0].baseFeePerGas + BigInt(tx.transaction.maxPriorityFeePerGas || 0n), BigInt(tx.transaction.maxFeePerGas || 0n))
					}, 0n),
				}
			} catch (error) {
				if (error instanceof DOMException && error.name === 'TimeoutError') throw new Error(`Simulation timed out to RPC: ${network.mempoolSimulationRpcEndpoint}`)
				throw error
			}
		}
		case 'relay': {
			if (network.simulationRelayEndpoint === undefined) throw new Error('simulationRelayEndpoint is not defined')
			const payload = createRelaySimulationPayload(txs.map((x) => x.rawTransaction), targetBlock)
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
				totalGasUsed: callResult.results.reduce((a: bigint, b: TransactionSimulation) => a + BigInt(b.gasUsed), 0n),
				firstRevert: callResult.results.find((txSim: TransactionSimulation) => 'revert' in txSim || 'error' in txSim),
			}
		}
	}
}

let bundleId = 1
export async function sendBundle(bundle: Bundle, targetBlocks: readonly bigint[], fundingAmountMin: bigint, provider: ProviderStore, signers: Signers, blockInfo: BlockInfo, network: BouquetNetwork) {
	if (targetBlocks.length === 0) throw new Error('At least one target block is required')
	const blocksInFuture = targetBlocks.reduce((largestDistance, targetBlock) => {
		const distance = targetBlock - blockInfo.blockNumber
		if (distance <= 0n) throw new Error('Bundle target blocks must be in the future')
		return distance > largestDistance ? distance : largestDistance
	}, 0n)
	if (bundle.rescueMode && network.relayMode !== 'relay') throw new Error('EIP-7702 rescue bundles require a private relay')
	const signingBlockInfo = withPriorityFee(blockInfo, network.priorityFee)
	const maxBaseFee = getMaxBaseFeeInFutureBlock(blockInfo.baseFee, blocksInFuture)
	const transactions = (await getRawTransactionsAndCalculateFeesAndNonces(
		await createBundleTransactions(bundle, signers, signingBlockInfo, blocksInFuture, fundingAmountMin, provider.provider),
		provider.provider,
		signingBlockInfo,
		maxBaseFee,
	)).map((x) => x.rawTransaction)

	switch(network.relayMode) {
		case 'mempool': {
			const payloads = transactions.map((transaction, index) => JSON.stringify({
				jsonrpc: '2.0',
				method: 'eth_sendRawTransaction',
				id: index,
				params: [transaction]
			}))
			if (network.mempoolSubmitRpcEndpoint === undefined) throw new Error('MemPool Submit RPC Endpoint is not set')
			for (const payload of payloads) {
				const MAX_ATTEMPTS = 40
				for (var attempt = 0; attempt < MAX_ATTEMPTS; attempt++ ) {
					const request = await fetch(network.mempoolSubmitRpcEndpoint, { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' } })
					const response = await request.json()
					console.log(response)
					if (response.error !== undefined) {
						if (attempt >= MAX_ATTEMPTS - 1) throw new Error(response.error.message)
						await new Promise(r => setTimeout(r, 50 + attempt * 50))
					} else {
						break
					}
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

			return { bundleTransactions, submissions: [{ targetBlock: targetBlocks[0], bundleIdentifier: ethers.keccak256(toUtf8Bytes(payloads.join('|'))) }] }
		}
		case 'relay': {
			if (network.submissionRelayEndpoint === undefined) throw new Error('submissionRelayEndpoint is not defined')
			const submissionRelayEndpoint = network.submissionRelayEndpoint
			const submissionResults = await Promise.all(targetBlocks.map(async (targetBlock): Promise<RelayTargetSubmission> => {
				try {
					const payload = JSON.stringify({
						jsonrpc: '2.0',
						method: 'eth_sendBundle',
						id: bundleId++,
						params: [{ txs: transactions, blockNumber: `0x${targetBlock.toString(16)}`, revertingTxHashes: [] }]
					})
					const flashbotsSig = `${await provider.authSigner.getAddress()}:${await provider.authSigner.signMessage(id(payload))}`
					const request = await fetch(submissionRelayEndpoint,
						{ method: 'POST', body: payload, headers: { 'Content-Type': 'application/json', 'X-Flashbots-Signature': flashbotsSig } }
					)
					const response: unknown = await request.json()
					if (!isRecord(response)) throw new Error('Relay returned an invalid bundle submission response')
					if (isRecord(response.error) && typeof response.error.message === 'string') throw new Error(response.error.message)
					if (!isRecord(response.result) || typeof response.result.bundleHash !== 'string') throw new Error('Relay did not return a bundle hash')
					return { status: 'accepted', targetBlock, bundleIdentifier: response.result.bundleHash }
				} catch (error) {
					return { status: 'rejected', error }
				}
			}))
			const submissions = submissionResults.flatMap((result) => result.status === 'accepted' ? [{ targetBlock: result.targetBlock, bundleIdentifier: result.bundleIdentifier }] : [])
			if (submissions.length === 0) {
				for (const submissionResult of submissionResults) {
					if (submissionResult.status === 'rejected') throw submissionResult.error
				}
				throw new Error('Relay rejected every target block')
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

			return { bundleTransactions, submissions }
		}
	}
}

export async function getBundleStats(bundleHash: string, targetBlock: bigint, provider: ProviderStore, network: BouquetNetwork): Promise<BundleStatsResult> {
	if (network.submissionRelayEndpoint === undefined) return { status: 'unavailable' }
	try {
		const payload = JSON.stringify({
			jsonrpc: '2.0',
			method: 'flashbots_getBundleStatsV2',
			id: bundleId++,
			params: [{ bundleHash, blockNumber: `0x${targetBlock.toString(16)}` }],
		})
		const flashbotsSig = `${await provider.authSigner.getAddress()}:${await provider.authSigner.signMessage(id(payload))}`
		const request = await fetch(network.submissionRelayEndpoint, {
			method: 'POST',
			body: payload,
			headers: { 'Content-Type': 'application/json', 'X-Flashbots-Signature': flashbotsSig },
			signal: AbortSignal.timeout(5_000),
		})
		const response: unknown = await request.json()
		if (!isRecord(response) || !isRecord(response.result)) return { status: 'unavailable' }
		return {
			status: 'available',
			stats: {
				isSimulated: response.result.isSimulated === true,
				consideredByBuilders: getArrayLength(response.result.consideredByBuildersAt),
				sealedByBuilders: getArrayLength(response.result.sealedByBuildersAt),
			},
		}
	} catch {
		return { status: 'unavailable' }
	}
}

export async function checkBundleInclusion(transactions: { hash: string }[], provider: ProviderStore) {
	const receipts = await Promise.all(transactions.map((tx) => provider.provider.getTransactionReceipt(tx.hash)))
	const includedInBlocks = Array.from(new Set(receipts.filter((receipt): receipt is ethers.TransactionReceipt => receipt !== null).map((receipt) => BigInt(receipt.blockNumber))))
	return { transactions, included: receipts.filter(x => x === null).length === 0, includedInBlocks }
}
