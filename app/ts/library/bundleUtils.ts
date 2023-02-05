import { Signal } from '@preact/signals'
import { providers, utils, Wallet } from 'ethers'
import { MEV_RELAY_GOERLI } from '../constants.js'
import { serialize, EthereumAddress, EthereumData, GetSimulationStackReply } from '../types.js'
import { FlashbotsBundleProvider, FlashbotsBundleTransaction, FlashbotsTransactionResponse } from './flashbots-ethers-provider.js'

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

export const signBundle = async (bundle: FlashbotsBundleTransaction[], maxBaseFee: bigint, provider: providers.Web3Provider, priorityFee: bigint) => {
	const transactions: string[] = []
	const accNonces: { [address: string]: bigint } = {}
	for (const tx of bundle) {
		tx.transaction.maxPriorityFeePerGas = priorityFee
		tx.transaction.maxFeePerGas = priorityFee + maxBaseFee
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
	interceptorPayload: GetSimulationStackReply | undefined,
	signingAccounts: { [account: string]: Wallet },
	wallet: Wallet | undefined,
	bundleContainsFundingTx: boolean | undefined,
	blocksInFuture: bigint,
	priorityFee: bigint,
	baseFee: bigint,
	fundingAmountMin: bigint,
): FlashbotsBundleTransaction[] => {
	if (!interceptorPayload || (bundleContainsFundingTx && !wallet)) return []
	return interceptorPayload.map(({ from, to, nonce, gasLimit, value, input, chainId }, index) => {
		const gasOpts = {
			maxPriorityFeePerGas: priorityFee,
			type: 2,
			maxFeePerGas: priorityFee + getMaxBaseFeeInFutureBlock(baseFee, blocksInFuture),
		}
		if (index === 0 && bundleContainsFundingTx && wallet)
			return {
				signer: wallet,
				transaction: {
					from: wallet.address,
					...(interceptorPayload && interceptorPayload[0].to
						? {
								to: utils.getAddress(serialize(EthereumAddress, interceptorPayload[0].to)),
						  }
						: {}),
					value: fundingAmountMin - 21000n * (getMaxBaseFeeInFutureBlock(baseFee, blocksInFuture) + priorityFee),
					data: '0x',
					gasLimit: 21000n,
					chainId: Number(chainId),
					...gasOpts,
				},
			}
		else
			return {
				signer: signingAccounts[utils.getAddress(serialize(EthereumAddress, from))],
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
	walletProvider: providers.Web3Provider | undefined,
	currentBlock: bigint,
	blocksInFuture: bigint,
	baseFee: bigint,
	priorityFee: bigint,
	interceptorPayload: GetSimulationStackReply | undefined,
	bundleContainsFundingTx: boolean,
	wallet: Wallet | undefined,
	signingAccounts: { [account: string]: Wallet },
	fundingAmountMin: bigint,
) {
	if (blocksInFuture <= 0) throw new Error('Blocks in future is negative')
	if (!walletProvider) throw new Error('User not connected')

	const maxBaseFee = getMaxBaseFeeInFutureBlock(baseFee, blocksInFuture)
	const signedTransactions = await signBundle(
		createBundleTransactions(interceptorPayload, signingAccounts, wallet, bundleContainsFundingTx, blocksInFuture, priorityFee, baseFee, fundingAmountMin),
		maxBaseFee,
		walletProvider,
		priorityFee,
	)
	const simulation = await flashbotsProvider.simulate(signedTransactions, Number(currentBlock + blocksInFuture))
	return simulation
}

export async function sendBundle(
	flashbotsProvider: FlashbotsBundleProvider,
	walletProvider: providers.Web3Provider,
	currentBlock: bigint,
	blocksInFuture: bigint,
	baseFee: bigint,
	priorityFee: bigint,
	interceptorPayload: GetSimulationStackReply | undefined,
	bundleContainsFundingTx: boolean,
	wallet: Wallet | undefined,
	signingAccounts: { [account: string]: Wallet },
	fundingAmountMin: bigint,
): Promise<FlashbotsTransactionResponse> {
	if (blocksInFuture <= 0) throw new Error('Blocks in future is negative')

	const maxBaseFee = getMaxBaseFeeInFutureBlock(baseFee, blocksInFuture)
	const signedTransactions = await signBundle(
		createBundleTransactions(interceptorPayload, signingAccounts, wallet, bundleContainsFundingTx, blocksInFuture, priorityFee, baseFee, fundingAmountMin),
		maxBaseFee,
		walletProvider,
		priorityFee,
	)
	const bundleSubmission = await flashbotsProvider.sendRawBundle(signedTransactions, Number(currentBlock + blocksInFuture))
	if ('error' in bundleSubmission) throw new Error(bundleSubmission.error.message)
	return bundleSubmission
}
