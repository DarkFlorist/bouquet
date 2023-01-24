import { get } from 'svelte/store'
import { BigNumber, providers, utils, Wallet } from 'ethers'
import {
	FlashbotsBundleProvider,
	FlashbotsBundleResolution,
	type FlashbotsBundleTransaction,
} from '@flashbots/ethers-provider-bundle'
import { MEV_RELAY_GOERLI } from '$lib/constants'
import {
	provider,
	latestBlock,
	bundleContainsFundingTx,
	wallet,
	interceptorPayload,
	priorityFee,
	fundingAmountMin,
	signingAccounts,
} from '$lib/state'

export const getMaxBaseFeeInFutureBlock = (
	baseFee: bigint,
	blocksInFuture: number,
) => {
	let maxBaseFee = baseFee
	for (let i = 0; i < blocksInFuture; i++) {
		maxBaseFee = (maxBaseFee * 1125n) / 1000n + 1n
	}
	return maxBaseFee
}

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
		const signedTx = await tx.signer?.signTransaction(
			await signerWithProvider.populateTransaction(tx.transaction),
		)
		transactions.push(signedTx)
	}
	return transactions
}

export const createBundleTransactions = (): FlashbotsBundleTransaction[] => {
	if (!get(interceptorPayload)) return []
	return get(interceptorPayload).map(
		({ from, to, nonce, gasLimit, value, input, chainId, type }, index) => {
			const gasOpts =
				Number(type) === 2
					? {
							maxPriorityFeePerGas: get(priorityFee),
							maxFeePerGas:
								get(priorityFee) +
								getMaxBaseFeeInFutureBlock(get(latestBlock).baseFee, 2),
					  }
					: {}
			if (index === 0 && get(bundleContainsFundingTx))
				return {
					signer: get(wallet),
					transaction: {
						from: get(wallet).address,
						to: utils.getAddress(get(interceptorPayload)[0].to),
						value:
							get(fundingAmountMin) -
							21000n *
								(getMaxBaseFeeInFutureBlock(get(latestBlock).baseFee, 2) +
									get(priorityFee)),
						data: '0x',
						type: 2,
						gasLimit: 21000n,
						...gasOpts,
					},
				}
			else
				return {
					signer: get(signingAccounts)[utils.getAddress(from)],
					transaction: {
						from,
						to,
						nonce,
						gasLimit,
						data: input,
						value,
						type: Number(type),
						chainId: Number(chainId),
						...gasOpts,
					},
				}
		},
	)
}

export async function simulate(flashbotsProvider: FlashbotsBundleProvider) {
	const maxBaseFee = getMaxBaseFeeInFutureBlock(get(latestBlock).baseFee, 2)

	const signedTransactions = await signBundle(
		createBundleTransactions(),
		maxBaseFee,
		get(provider),
	)

	const simulation = await flashbotsProvider.simulate(
		signedTransactions,
		Number(get(latestBlock).blockNumber) + 2,
	)

	return simulation
}

export async function sendBundle(flashbotsProvider: FlashbotsBundleProvider) {
	const maxBaseFee = getMaxBaseFeeInFutureBlock(get(latestBlock).baseFee, 2)

	const signedTransactions = await signBundle(
		createBundleTransactions(),
		maxBaseFee,
		get(provider),
	)

	const bundleSubmission = await flashbotsProvider.sendRawBundle(
		signedTransactions,
		Number(get(latestBlock).blockNumber) + 2,
	)

	if ('error' in bundleSubmission)
		throw new Error(bundleSubmission.error.message)

	const waitResponse = await bundleSubmission.wait()
	console.log(`Wait Response: ${FlashbotsBundleResolution[waitResponse]}`)
}
