import { providers, utils, Wallet } from 'ethers'
import { MEV_RELAY_GOERLI } from '../constants.js'
import { latestBlock, bundleContainsFundingTx, wallet, interceptorPayload, priorityFee, fundingAmountMin, signingAccounts, provider } from '../store.js'
import { serialize, EthereumAddress, EthereumData } from '../types.js'
import { FlashbotsBundleProvider, FlashbotsBundleTransaction } from './flashbots-ethers-provider.js'

export const getMaxBaseFeeInFutureBlock = (baseFee: bigint, blocksInFuture: number) => {
	if (blocksInFuture <= 0) throw new Error('blocksInFuture needs to be positive')
	return [...Array(blocksInFuture)].reduce((accumulator, _currentValue) => (accumulator * 1125n) / 1000n, baseFee) + 1n
}

export const createProvider = async () => {
	if (!provider.value) throw new Error('User not connected')
	const authSigner = Wallet.createRandom().connect(provider.value)
	const flashbotsProvider = await FlashbotsBundleProvider.create(provider.value as providers.BaseProvider, authSigner, MEV_RELAY_GOERLI, 'goerli')
	return flashbotsProvider
}

export const signBundle = async (bundle: FlashbotsBundleTransaction[], maxBaseFee: bigint, provider: providers.Provider) => {
	const transactions: string[] = []
	const accNonces: { [address: string]: bigint } = {}
	for (const tx of bundle) {
		tx.transaction.maxPriorityFeePerGas = priorityFee.value
		tx.transaction.maxFeePerGas = priorityFee.value + maxBaseFee
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

export const createBundleTransactions = (latestBlock: { baseFee: bigint }): FlashbotsBundleTransaction[] => {
	if (!interceptorPayload.value || (bundleContainsFundingTx.value && !wallet.value)) return []
	return interceptorPayload.value.map(({ from, to, nonce, gasLimit, value, input, chainId }, index) => {
		const gasOpts = {
			maxPriorityFeePerGas: priorityFee.peek(),
			type: 2,
			maxFeePerGas: priorityFee.peek() + getMaxBaseFeeInFutureBlock(latestBlock.baseFee, 2),
		}
		if (index === 0 && bundleContainsFundingTx.value && wallet.value)
			return {
				signer: wallet.value,
				transaction: {
					from: wallet.value?.address,
					...(interceptorPayload.value && interceptorPayload.value[0].to
						? {
								to: utils.getAddress(serialize(EthereumAddress, interceptorPayload.value[0].to)),
						  }
						: {}),
					value: fundingAmountMin.peek() - 21000n * (getMaxBaseFeeInFutureBlock(latestBlock.baseFee, 2) + priorityFee.peek()),
					data: '0x',
					gasLimit: 21000n,
					chainId: Number(chainId),
					...gasOpts,
				},
			}
		else
			return {
				signer: signingAccounts.peek()[utils.getAddress(serialize(EthereumAddress, from))],
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

export async function simulate(flashbotsProvider: FlashbotsBundleProvider) {
	if (!provider.value) throw new Error('User not connected')

	const maxBaseFee = getMaxBaseFeeInFutureBlock(latestBlock.peek().baseFee, 2)

	const signedTransactions = await signBundle(createBundleTransactions(latestBlock.peek()), maxBaseFee, provider.value)

	const simulation = await flashbotsProvider.simulate(signedTransactions, Number(latestBlock.peek().blockNumber) + 2)

	return simulation
}

export async function sendBundle(flashbotsProvider: FlashbotsBundleProvider) {
	if (!provider.value) throw new Error('User not connected')

	const maxBaseFee = getMaxBaseFeeInFutureBlock(latestBlock.peek().baseFee, 2)

	const signedTransactions = await signBundle(createBundleTransactions(latestBlock.peek()), maxBaseFee, provider.value)

	const bundleSubmission = await flashbotsProvider.sendRawBundle(signedTransactions, Number(latestBlock.peek().blockNumber) + 2)

	if ('error' in bundleSubmission) throw new Error(bundleSubmission.error.message)

	const waitResponse = await bundleSubmission.wait()
	console.log(`Wait Response: ${waitResponse}`)
}
