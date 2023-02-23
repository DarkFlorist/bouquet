import { Signal } from '@preact/signals'
import { providers, utils, Wallet } from 'ethers'
import { MEV_RELAY_GOERLI } from '../constants.js'
import { FlashbotsBundleProvider, FlashbotsBundleTransaction, FlashbotsTransactionResponse } from './flashbots-ethers-provider.js'
import { EthereumAddress, EthereumData, serialize } from './interceptor-types.js'
import { BlockInfo, BundleState, Signers } from './types.js'

export const getMaxBaseFeeInFutureBlock = (baseFee: bigint, blocksInFuture: bigint) => {
	if (blocksInFuture <= 0n) throw new Error('blocksInFuture needs to be positive')
	return [...Array(blocksInFuture)].reduce((accumulator, _currentValue) => (accumulator * 1125n) / 1000n, baseFee) + 1n
}

export const createProvider = async (provider: Signal<providers.Web3Provider | undefined>) => {
	if (!provider.value) throw new Error('User not connected')
	const authSigner = Wallet.createRandom().connect(provider.value)
	const flashbotsProvider = await FlashbotsBundleProvider.create(provider.value as providers.BaseProvider, authSigner, MEV_RELAY_GOERLI, 'goerli')
	return flashbotsProvider
}

export const signBundle = async (bundle: FlashbotsBundleTransaction[], provider: providers.Web3Provider, blockInfo: BlockInfo, maxBaseFee: bigint) => {
	const transactions: string[] = []
	const accNonces: { [address: string]: bigint } = {}
	for (const tx of bundle) {
		tx.transaction.maxPriorityFeePerGas = blockInfo.priorityFee
		tx.transaction.maxFeePerGas = blockInfo.priorityFee + maxBaseFee
		if (!tx.transaction.from) throw new Error('BundleTransaction missing from address')
		if (!tx.transaction.chainId) throw new Error('BundleTransaction missing chainId')
		if (accNonces[tx.transaction.from]) {
			accNonces[tx.transaction.from] = accNonces[tx.transaction.from] + 1n
		} else {
			accNonces[tx.transaction.from] = BigInt(await provider.getTransactionCount(tx.transaction.from, 'latest'))
		}
		tx.transaction.nonce = accNonces[tx.transaction.from]
		const signedTx = await tx.signer.signTransaction(tx.transaction)
		transactions.push(signedTx as string)
	}
	return transactions
}

export const createBundleTransactions = (
	interceptorPayload: BundleState | undefined,
	signers: Signers,
	blockInfo: BlockInfo,
	blocksInFuture: bigint,
	fundingAmountMin: bigint,
): FlashbotsBundleTransaction[] => {
	if (!interceptorPayload) return []
	return interceptorPayload.payload.map(({ from, to, nonce, gasLimit, value, input, chainId }, index) => {
		const gasOpts = {
			maxPriorityFeePerGas: blockInfo.priorityFee,
			type: 2,
			maxFeePerGas: blockInfo.priorityFee + getMaxBaseFeeInFutureBlock(blockInfo.baseFee, blocksInFuture),
		}
		if (index === 0 && interceptorPayload.containsFundingTx && signers.burner)
			return {
				signer: signers.burner,
				transaction: {
					from: signers.burner.address,
					...(interceptorPayload && interceptorPayload.payload[0].to
						? {
								to: utils.getAddress(serialize(EthereumAddress, interceptorPayload.payload[0].to)),
						  }
						: {}),
					value: fundingAmountMin - 21000n * (getMaxBaseFeeInFutureBlock(blockInfo.baseFee, blocksInFuture) + blockInfo.priorityFee),
					data: '0x',
					gasLimit: 21000n,
					chainId: Number(chainId),
					...gasOpts,
				},
			}
		else
			return {
				signer: signers.bundleSigners[utils.getAddress(serialize(EthereumAddress, from))],
				transaction: {
					from: utils.getAddress(serialize(EthereumAddress, from)),
					...(to ? { to: utils.getAddress(serialize(EthereumAddress, to)) } : {}),
					nonce,
					gasLimit,
					data: serialize(EthereumData, input),
					value,
					chainId: Number(chainId),
					...gasOpts,
				},
			}
	})
}

export async function simulate(
	flashbotsProvider: FlashbotsBundleProvider,
	walletProvider: providers.Web3Provider,
	blockInfo: BlockInfo,
	blocksInFuture: bigint,
	bundleData: BundleState,
	signers: Signers,
	fundingAmountMin: bigint,
) {
	if (blocksInFuture <= 0n) throw new Error('Blocks in future is negative')

	const maxBaseFee = getMaxBaseFeeInFutureBlock(blockInfo.baseFee, blocksInFuture)
	const signedTransactions = await signBundle(
		createBundleTransactions(bundleData, signers, blockInfo, blocksInFuture, fundingAmountMin),
		walletProvider,
		blockInfo,
		maxBaseFee,
	)
	return await flashbotsProvider.simulate(signedTransactions, Number(blockInfo.blockNumber + blocksInFuture))
}

export async function sendBundle(
	flashbotsProvider: FlashbotsBundleProvider,
	walletProvider: providers.Web3Provider,
	blockInfo: BlockInfo,
	blocksInFuture: bigint,
	bundleData: BundleState,
	signers: Signers,
	fundingAmountMin: bigint,
): Promise<FlashbotsTransactionResponse> {
	if (blocksInFuture <= 0n) throw new Error('Blocks in future is negative')

	const maxBaseFee = getMaxBaseFeeInFutureBlock(blockInfo.baseFee, blocksInFuture)
	const signedTransactions = await signBundle(
		createBundleTransactions(bundleData, signers, blockInfo, blocksInFuture, fundingAmountMin),
		walletProvider,
		blockInfo,
		maxBaseFee,
	)
	const bundleSubmission = await flashbotsProvider.sendRawBundle(signedTransactions, Number(blockInfo.blockNumber + blocksInFuture))
	if ('error' in bundleSubmission) throw new Error(bundleSubmission.error.message)
	return bundleSubmission
}
