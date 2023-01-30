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
	const authSigner = Wallet.createRandom().connect(provider.value)
	const flashbotsProvider = await FlashbotsBundleProvider.create(provider.value as providers.BaseProvider, authSigner, MEV_RELAY_GOERLI, 'goerli')
	return flashbotsProvider
}

export const signBundle = async (bundle: FlashbotsBundleTransaction[], maxBaseFee: bigint, provider: providers.Provider) => {
	const PRIORITY_FEE = 10n ** 9n * 3n // TODO, change to not hardcoded value
	let transactions: string[] = []
	for (const tx of bundle) {
		const signerWithProvider = tx.signer.connect(provider)
		tx.transaction.maxPriorityFeePerGas = PRIORITY_FEE
		tx.transaction.maxFeePerGas = PRIORITY_FEE + maxBaseFee
		const signedTx = await tx.signer?.signTransaction(await signerWithProvider.populateTransaction(tx.transaction))
		transactions.push(signedTx)
	}
	return transactions
}

export const createBundleTransactions = (): FlashbotsBundleTransaction[] => {
	if (!interceptorPayload.value || (bundleContainsFundingTx.value && !wallet.value)) return []
	return interceptorPayload.value.map(({ from, to, nonce, gasLimit, value, input, chainId }, index) => {
		const gasOpts = {
			maxPriorityFeePerGas: priorityFee.peek(),
			type: 2,
			maxFeePerGas: priorityFee.peek() + getMaxBaseFeeInFutureBlock(latestBlock.peek().baseFee, 2),
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
					value: fundingAmountMin.peek() - 21000n * (getMaxBaseFeeInFutureBlock(latestBlock.peek().baseFee, 2) + priorityFee.peek()),
					data: '0x',
					gasLimit: 21000n,
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
	const maxBaseFee = getMaxBaseFeeInFutureBlock(latestBlock.peek().baseFee, 2)

	const signedTransactions = await signBundle(createBundleTransactions(), maxBaseFee, provider.peek())

	const simulation = await flashbotsProvider.simulate(signedTransactions, Number(latestBlock.peek().blockNumber) + 2)

	return simulation
}

export async function sendBundle(flashbotsProvider: FlashbotsBundleProvider) {
	const maxBaseFee = getMaxBaseFeeInFutureBlock(latestBlock.peek().baseFee, 2)

	const signedTransactions = await signBundle(createBundleTransactions(), maxBaseFee, provider.peek())

	const bundleSubmission = await flashbotsProvider.sendRawBundle(signedTransactions, Number(latestBlock.peek().blockNumber) + 2)

	if ('error' in bundleSubmission) throw new Error(bundleSubmission.error.message)

	const waitResponse = await bundleSubmission.wait()
	console.log(`Wait Response: ${waitResponse}`)
}
