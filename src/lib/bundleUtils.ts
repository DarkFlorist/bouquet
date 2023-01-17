import { get } from 'svelte/store'
import { BigNumber, providers, Wallet } from 'ethers'
import {
	FlashbotsBundleProvider,
	FlashbotsBundleResolution,
	type FlashbotsBundleTransaction,
} from '@flashbots/ethers-provider-bundle'
import { MEV_RELAY_GOERLI } from '$lib/constants'
import { bundleTransactions, provider, latestBlock } from '$lib/state'

export const createProvider = async () => {
	const authSigner = Wallet.createRandom().connect(get(provider))
	const flashbotsProvider = await FlashbotsBundleProvider.create(
		get(provider) as providers.BaseProvider,
		authSigner,
		MEV_RELAY_GOERLI,
		'goerli',
	)
	return flashbotsProvider
}

export const signBundle = async (
	bundle: FlashbotsBundleTransaction[],
	maxBaseFee: bigint,
	provider: providers.Provider,
) => {
	const PRIORITY_FEE = 10n ** 9n * 3n
	let transactions = [] as string[]
	for (let tx of bundle) {
		const signerWithProvider = tx.signer.connect(provider)
		tx.transaction.maxPriorityFeePerGas = PRIORITY_FEE
		tx.transaction.maxFeePerGas = PRIORITY_FEE + maxBaseFee
		const signedTx = await tx.signer.signTransaction(
			await signerWithProvider.populateTransaction(tx.transaction),
		)
		transactions.push(signedTx)
	}
	return transactions
}

export async function simulate(flashbotsProvider: FlashbotsBundleProvider) {
	const maxBaseFee = FlashbotsBundleProvider.getMaxBaseFeeInFutureBlock(
		BigNumber.from(get(latestBlock).baseFee),
		2,
	).toBigInt()

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
		get(provider),
	)
	console.log(signedTransactions)

	const simulation = await flashbotsProvider.simulate(
		signedTransactions,
		Number(get(latestBlock).blockNumber) + 2,
	)

	console.log(simulation)

	return simulation
}

export async function sendBundle(flashbotsProvider: FlashbotsBundleProvider) {
	const maxBaseFee = FlashbotsBundleProvider.getMaxBaseFeeInFutureBlock(
		BigNumber.from(get(latestBlock).baseFee),
		2,
	).toBigInt()

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
		get(provider),
	)
	console.log(signedTransactions)

	const bundleSubmission = await flashbotsProvider.sendRawBundle(
		signedTransactions,
		Number(get(latestBlock).blockNumber) + 2,
	)

	console.log('bundle submitted, waiting')
	if ('error' in bundleSubmission)
		throw new Error(bundleSubmission.error.message)

	const waitResponse = await bundleSubmission.wait()
	console.log(`Wait Response: ${FlashbotsBundleResolution[waitResponse]}`)
}
