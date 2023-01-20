import type { PayloadTransaction } from '$lib/types'
import { Wallet } from 'ethers'
import type { FlashbotsBundleTransaction } from '@flashbots/ethers-provider-bundle'

import {
	bundleTransactions,
	interceptorPayload,
	bundleContainsFundingTx,
	totalGas,
	totalValue,
	uniqueSigners,
	wallets,
} from '$lib/state'
import { get } from 'svelte/store'

export async function importFromInterceptor() {
	try {
		if (window.ethereum === undefined) throw 'No Wallet'

		// @ts-ignore
		await window.ethereum.request({ method: 'eth_requestAccounts' })

		// @ts-ignore
		const { payload } = (await window.ethereum.request({
			method: 'interceptor_getSimulationStack',
		})) as { payload: PayloadTransaction[] }

		if (payload.length === 0) throw 'Empty Stack'

		const uniqueSigningAccounts = [...new Set(payload.map((tx) => tx.from))]
		const isFundingTransaction =
			payload.length >= 2 && uniqueSigningAccounts.includes(payload[0].to)

		const transactions = payload.map(({ from, to, value, input, gas }) => ({
			transaction: { from, to, value, data: input, gasLimit: gas },
		})) as FlashbotsBundleTransaction[]

		let fundingTarget: string
		if (isFundingTransaction) {
			if (get(wallets).length === 0) {
				wallets.update((x) => [...x, Wallet.createRandom()])
			}
			fundingTarget = payload[0].to
			uniqueSigningAccounts.shift()
			transactions.shift()
		}

		totalGas.set(
			transactions.reduce(
				(sum, current) =>
					sum + BigInt(current?.transaction.gasLimit?.toString() ?? 0n),
				0n,
			),
		)

		// @TODO: Check this properly based on simulation +- on each transaction in step
		totalValue.set(
			transactions
				.filter((tx) => tx.transaction.from === fundingTarget)
				.reduce(
					(sum, current) =>
						sum + BigInt(current.transaction.value?.toString() ?? 0n),
					0n,
				),
		)

		localStorage.setItem('payload', JSON.stringify(payload))

		interceptorPayload.set(payload)
		uniqueSigners.set(uniqueSigningAccounts)
		bundleTransactions.set(transactions)
		bundleContainsFundingTx.set(isFundingTransaction)
	} catch (err: any) {
		if (err === 'No Wallet') {
			return 'Import Error: No Ethereum wallet detected'
		} else if (err === 'Empty Stack') {
			return 'Import Error: You have no transactions on your simulation'
		} else if (err?.code === 4001) {
			return 'Import Error: Wallet connection rejected'
		} else if (err?.code === -32601) {
			return 'Import Error: Wallet does not support returning simulations'
		} else {
			return `Unknown Error: ${JSON.stringify(err)}`
		}
	}
}
