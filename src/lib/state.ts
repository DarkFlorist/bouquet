import { browser } from '$app/environment'
import { env } from '$env/dynamic/public'
import { derived, get, readable, writable } from 'svelte/store'
import { providers, utils, Wallet } from 'ethers'
import type { PayloadTransaction } from '$lib/types'
import type { Sync } from 'ether-state'
import { getMaxBaseFeeInFutureBlock } from './bundleUtils'

export const ssr = false

// Primary Stores
export const provider = writable<providers.Provider>(
	new providers.JsonRpcProvider(env.PUBLIC_RPC_URL),
)
export const blockSync = writable<Sync>()

export const latestBlock = writable<{
	blockNumber: bigint
	baseFee: bigint
}>({ blockNumber: 0n, baseFee: 0n })
export const wallet = writable<Wallet>()
export const interceptorPayload = writable<PayloadTransaction[]>()
export const completedSession = writable<boolean>(false)
export const fundingAccountBalance = writable<bigint>(0n)
export const signingAccounts = writable<{ [account: string]: Wallet }>({})
export const priorityFee = readable<bigint>(10n ** 9n * 3n)

export const activeSession = derived(
	[wallet, interceptorPayload, completedSession],
	([$wallet, $interceptorPayload, $completedSession]) =>
		$completedSession || $interceptorPayload || $wallet,
)

// Derived State
export const bundleContainsFundingTx = derived(
	[interceptorPayload],
	([$interceptorPayload]) =>
		$interceptorPayload &&
		$interceptorPayload.length > 1 &&
		$interceptorPayload[0].to === $interceptorPayload[1].from,
)
export const uniqueSigners = derived(
	[interceptorPayload, bundleContainsFundingTx],
	([$interceptorPayload, $bundleContainsFundingTx]) => {
		if ($interceptorPayload) {
			const addresses = [
				...new Set($interceptorPayload.map((x) => utils.getAddress(x.from))),
			]
			if ($bundleContainsFundingTx) addresses.shift()
			return addresses
		} else return []
	},
)
export const totalGas = derived(
	[interceptorPayload, bundleContainsFundingTx],
	([$interceptorPayload, $bundleContainsFundingTx]) => {
		if ($interceptorPayload) {
			return $interceptorPayload.reduce(
				(sum, tx, index) =>
					index === 0 && $bundleContainsFundingTx
						? 21000n
						: BigInt(tx.gasLimit.toString()) + sum,
				0n,
			)
		} else return 0n
	},
)
// @TODO: Change this to track minimum amount of ETH needed to deposit
export const totalValue = derived(
	[interceptorPayload, bundleContainsFundingTx],
	([$interceptorPayload, $bundleContainsFundingTx]) => {
		if ($interceptorPayload) {
			return $interceptorPayload.reduce(
				(sum, tx, index) =>
					index === 0 && $bundleContainsFundingTx
						? 0n
						: BigInt(tx.value.toString()) + sum,
				0n,
			)
		} else return 0n
	},
)
export const fundingAmountMin = derived(
	[totalGas, totalValue, priorityFee, latestBlock],
	([$totalGas, $totalValue, $priorityFee, $latestBlock]) => {
		const maxBaseFee = getMaxBaseFeeInFutureBlock($latestBlock.baseFee, 2)
		return $totalGas * ($priorityFee + maxBaseFee) + $totalValue
	},
)

// Sync stores on page load
if (browser) {
	const burnerPk = localStorage.getItem('wallet')
	if (burnerPk) {
		wallet.set(new Wallet(burnerPk))
	}

	// @dev: Automatically update localStorage on state change, manually update payload
	wallet.subscribe((w) => {
		if (w) localStorage.setItem('wallet', w.privateKey)
		else localStorage.removeItem('wallet')
	})

	completedSession.subscribe((status) =>
		localStorage.setItem('completedSession', JSON.stringify(status)),
	)

	// Set interceptorPayload
	const payload = JSON.parse(localStorage.getItem('payload') ?? 'null')
	if (payload) interceptorPayload.set(payload)

	bundleContainsFundingTx.subscribe((x) => {
		if (x && !get(wallet)) wallet.set(Wallet.createRandom())
	})
}
