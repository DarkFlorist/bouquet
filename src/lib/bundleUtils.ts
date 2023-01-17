import { BigNumber, providers, Wallet } from 'ethers'
import {
	FlashbotsBundleProvider,
	FlashbotsBundleResolution,
	type FlashbotsBundleTransaction,
} from '@flashbots/ethers-provider-bundle'
import { bundleTransactions } from './state'
import { get } from 'svelte/store'
import { env } from '$env/dynamic/public'
import { MEV_RELAY_GOERLI } from './constants'

export const createProvider = async () => {
	// Standard json rpc provider directly from ethers.js (NOT Flashbots)
	const provider = new providers.JsonRpcProvider(env.PUBLIC_RPC_URL)
	const authSigner = Wallet.createRandom().connect(provider)
	const flashbotsProvider = await FlashbotsBundleProvider.create(
		provider,
		authSigner,
		MEV_RELAY_GOERLI,
		'goerli',
	)
	return flashbotsProvider
}

export const signBundle = async (
	bundle: FlashbotsBundleTransaction[],
	maxBaseFee: BigNumber,
	provider: providers.Provider,
) => {
	const PRIORITY_FEE = BigNumber.from(10).pow(10).mul(3)
	let transactions = [] as string[]
	for (let tx of bundle) {
		const signerWithProvider = tx.signer.connect(provider)
		tx.transaction.maxPriorityFeePerGas = PRIORITY_FEE
		tx.transaction.maxFeePerGas = PRIORITY_FEE.add(maxBaseFee)
		const signedTx = await tx.signer.signTransaction(
			await signerWithProvider.populateTransaction(tx.transaction),
		)
		transactions.push(signedTx)
	}
	return transactions
}

export async function simulate(flashbotsProvider: FlashbotsBundleProvider) {
	const provider = new providers.JsonRpcProvider(env.PUBLIC_RPC_URL)

	const currentBlock = await provider.getBlockNumber()

	// Get latest baseFee and sign bundle
	const lastBlock = await provider.getBlock(currentBlock)
	const maxBaseFee = FlashbotsBundleProvider.getMaxBaseFeeInFutureBlock(
		lastBlock.baseFeePerGas ?? BigNumber.from(-1),
		2,
	)

	// @DEV: Signed TX's with gave invalid signer address when attempting to broadcost via blockexplorer
	//
	// const bundleTxs = get(bundleTransactions).map((tx) => {
	// 	tx.transaction.maxPriorityFeePerGas = PRIORITY_FEE;
	// 	tx.transaction.maxFeePerGas = PRIORITY_FEE.add(maxBaseFee);
	// 	tx.transaction.chainId = 5;
	// 	return tx;
	// });
	// const signedTransactions = await flashbotsProvider.signBundle(bundleTxs)

	const signedTransactions = await signBundle(
		get(bundleTransactions),
		maxBaseFee,
		provider,
	)
	console.log(signedTransactions)

	const simulation = await flashbotsProvider.simulate(
		signedTransactions,
		currentBlock + 2,
	)

	console.log(simulation)

	return simulation
}

export async function sendBundle(flashbotsProvider: FlashbotsBundleProvider) {
	const provider = new providers.JsonRpcProvider(env.PUBLIC_RPC_URL)

	const currentBlock = await provider.getBlockNumber()

	// Get latest baseFee and sign bundle
	const lastBlock = await provider.getBlock(currentBlock)
	const maxBaseFee = FlashbotsBundleProvider.getMaxBaseFeeInFutureBlock(
		lastBlock.baseFeePerGas ?? BigNumber.from(-1),
		2,
	)

	// @DEV: Signed TX's with gave invalid signer address when attempting to broadcost via blockexplorer
	//
	// const bundleTxs = get(bundleTransactions).map((tx) => {
	// 	tx.transaction.maxPriorityFeePerGas = PRIORITY_FEE;
	// 	tx.transaction.maxFeePerGas = PRIORITY_FEE.add(maxBaseFee);
	// 	tx.transaction.chainId = 5;
	// 	return tx;
	// });
	// const signedTransactions = await flashbotsProvider.signBundle(bundleTxs)

	const signedTransactions = await signBundle(
		get(bundleTransactions),
		maxBaseFee,
		provider,
	)
	console.log(signedTransactions)

	const bundleSubmission = await flashbotsProvider.sendRawBundle(
		signedTransactions,
		currentBlock + 2,
	)

	console.log('bundle submitted, waiting')
	if ('error' in bundleSubmission) {
		throw new Error(bundleSubmission.error.message)
	}

	const waitResponse = await bundleSubmission.wait()
	console.log(`Wait Response: ${FlashbotsBundleResolution[waitResponse]}`)
}
