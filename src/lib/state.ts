import { browser } from '$app/environment'
import { env } from '$env/dynamic/public'
import { derived, get, readable, writable } from 'svelte/store'
import { providers, utils, Wallet } from 'ethers'
import type { PayloadTransaction, FlashbotsBundleTransaction } from '$lib/types'
import type { Sync } from 'ether-state'

export const ssr = false

export const provider = writable<providers.Provider>(
	new providers.JsonRpcProvider(env.PUBLIC_RPC_URL),
)

export const blockSync = writable<Sync>()
export const latestBlock = writable<{
	blockNumber: bigint
	baseFee: bigint
}>({ blockNumber: 0n, baseFee: 0n })

export const wallets = writable<Wallet[]>([])
export const interceptorPayload = writable<PayloadTransaction[]>()
export const completedSession = writable<Boolean>(false)

export const activeSession = derived(
	[wallets, interceptorPayload, completedSession],
	([$wallets, $interceptorPayload, $completedSession]) =>
		$completedSession || $interceptorPayload || $wallets.length > 0,
)

export const uniqueSigners = writable<string[]>()
export const bundleContainsFundingTx = writable<Boolean>()
export const totalGas = writable<bigint>(0n)
export const totalValue = writable<bigint>(0n)
export const bundleTransactions = writable<FlashbotsBundleTransaction[]>()

export const priorityFee = readable<bigint>(10n ** 9n * 3n)
export const fundingAmountMin = writable<bigint>(0n)
export const fundingAccountBalance = writable<bigint>(0n)

// Sync stores on page load
if (browser) {
	wallets.set(
		JSON.parse(localStorage.getItem('wallets') ?? '[]').map(
			(pk: string) => new Wallet(pk),
		),
	)

	// @dev: Automatically update localStorage on state change, manually update payload
	wallets.subscribe((data) =>
		localStorage.setItem(
			'wallets',
			JSON.stringify(data.map((wallet) => wallet.privateKey)),
		),
	)
	completedSession.subscribe((status) =>
		localStorage.setItem('completedSession', JSON.stringify(status)),
	)

	// Set interceptorPayload
	const payload = JSON.parse(
		localStorage.getItem('payload') ?? 'null',
	) as PayloadTransaction[]
	if (payload) {
		const uniqueSigningAccounts = [
			...new Set(payload.map((tx) => utils.getAddress(tx.from))),
		]
		const isFundingTransaction =
			payload.length >= 2 &&
			uniqueSigningAccounts.includes(utils.getAddress(payload[0].to))

		const transactions = payload.map(
			({ from, to, value, input, gas, type }) => ({
				transaction: {
					type: Number(type),
					from: utils.getAddress(from),
					to: utils.getAddress(to),
					value: BigInt(value.toString()),
					data: input,
					gasLimit: BigInt(gas.toString()),
				},
			}),
		)

		let fundingTarget: string
		if (isFundingTransaction) {
			if (get(wallets).length === 0) {
				wallets.subscribe((x) => [...x, Wallet.createRandom()])
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
						sum + BigInt(current?.transaction.value?.toString() ?? '0'),
					0n,
				),
		)

		uniqueSigners.set(uniqueSigningAccounts)
		bundleTransactions.set(transactions)
		bundleContainsFundingTx.set(isFundingTransaction)
		interceptorPayload.set(payload)
	}
	completedSession.set(
		JSON.parse(localStorage.getItem('completedSession') ?? 'false'),
	)
}
