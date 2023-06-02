import { providers, Signer, utils } from 'ethers'
import { BlockInfo, Bundle, serialize, Signers } from '../types/types.js'
import { EthereumAddress, EthereumData } from '../types/ethereumTypes.js'

export interface FlashbotsBundleTransaction {
	transaction: providers.TransactionRequest
	signer: Signer
}

export const getMaxBaseFeeInFutureBlock = (baseFee: bigint, blocksInFuture: bigint) => {
	if (blocksInFuture <= 0n) throw new Error('blocksInFuture needs to be positive')
	return [...Array(blocksInFuture)].reduce((accumulator, _currentValue) => (accumulator * 1125n) / 1000n, baseFee) + 1n
}

async function getSimulatedCountsOnNetwork(provider: providers.Web3Provider): Promise<{ [address: string]: bigint }> {
	try {
		const { payload } = await provider.send(
			'interceptor_getSimulationStack',
			['1.0.0']
		)
		const result = payload.reduce((acc: { [address: string]: bigint }, curr: { from: string }) => {
			curr.from = utils.getAddress(curr.from)
			if (curr.from in acc) acc[curr.from] += 1n
			else acc[curr.from] = 1n
			return acc
		}, {})
		return result
	} catch (error) {
		console.error("getSimulatedCountsOnNetwork error: ", error)
		return {}
	}
}

export const signBundle = async (bundle: FlashbotsBundleTransaction[], provider: providers.Web3Provider, blockInfo: BlockInfo, maxBaseFee: bigint) => {
	const transactions: string[] = []
	const inSimulation = await getSimulatedCountsOnNetwork(provider)
	const accNonces: { [address: string]: bigint } = {}
	for (const tx of bundle) {
		tx.transaction.maxPriorityFeePerGas = blockInfo.priorityFee
		tx.transaction.maxFeePerGas = blockInfo.priorityFee + maxBaseFee
		if (!tx.transaction.from) throw new Error('BundleTransaction missing from address')
		if (!tx.transaction.chainId) throw new Error('BundleTransaction missing chainId')
		// Fetch and increment nonces from network, reduce the fetch amount by amount of transactions made on the simulation stack
		if (tx.transaction.from in accNonces) {
			accNonces[tx.transaction.from] += 1n
		} else {
			accNonces[tx.transaction.from] = BigInt(await provider.getTransactionCount(tx.transaction.from, 'latest'))
			if (tx.transaction.from in inSimulation) accNonces[tx.transaction.from] -= inSimulation[tx.transaction.from]
		}
		tx.transaction.nonce = accNonces[tx.transaction.from]
		const signedTx = await tx.signer.signTransaction(tx.transaction)
		transactions.push(signedTx as string)
	}
	return transactions
}

export const createBundleTransactions = async (
	bundle: Bundle | undefined,
	signers: Signers,
	blockInfo: BlockInfo,
	blocksInFuture: bigint,
	fundingAmountMin: bigint,
): Promise<FlashbotsBundleTransaction[]> => {
	if (!bundle) return []
	return await Promise.all(bundle.transactions.map(async ({ from, to, gasLimit, value, input, chainId }, index) => {
		const gasOpts = {
			maxPriorityFeePerGas: blockInfo.priorityFee,
			type: 2,
			maxFeePerGas: blockInfo.priorityFee + getMaxBaseFeeInFutureBlock(blockInfo.baseFee, blocksInFuture),
		}
		if (index === 0 && bundle.containsFundingTx && signers.burner) {
			return {
				signer: signers.burner,
				transaction: {
					from: signers.burner.address,
					...(bundle && bundle.transactions[0].to
						? {
							to: utils.getAddress(serialize(EthereumAddress, bundle.transactions[0].to)),
						}
						: {}),
					value: fundingAmountMin - 21000n * (getMaxBaseFeeInFutureBlock(blockInfo.baseFee, blocksInFuture) + blockInfo.priorityFee),
					data: '0x',
					gasLimit: 21000n,
					chainId: Number(chainId),
					...gasOpts,
				},
			}
		} else
			return {
				signer: signers.bundleSigners[utils.getAddress(serialize(EthereumAddress, from))],
				transaction: {
					from: utils.getAddress(serialize(EthereumAddress, from)),
					...(to ? { to: utils.getAddress(serialize(EthereumAddress, to)) } : {}),
					gasLimit,
					data: serialize(EthereumData, input),
					value,
					chainId: Number(chainId),
					...gasOpts,
				},
			}
	}))
}
