import { computed, signal } from '@preact/signals'
import { providers, utils, Wallet } from 'ethers'
import { EthereumAddress, GetSimulationStackReply, serialize } from './types.js'
import { getMaxBaseFeeInFutureBlock } from './library/bundleUtils.js'

export const ssr = false

// Primary Stores
export const provider = signal<providers.Provider | undefined>(undefined)
export const latestBlock = signal<{
	blockNumber: bigint
	baseFee: bigint
}>({ blockNumber: 0n, baseFee: 0n })
export const wallet = signal<Wallet | undefined>(undefined)
export const interceptorPayload = signal<GetSimulationStackReply | undefined>(undefined)
export const completedSession = signal<boolean>(false)
export const fundingAccountBalance = signal<bigint>(0n)
export const signingAccounts = signal<{ [account: string]: Wallet }>({})
export const priorityFee = signal<bigint>(10n ** 9n * 3n)

// Computed State
export const activeSession = computed(() => completedSession.value || interceptorPayload.value)
export const bundleContainsFundingTx = computed(() => interceptorPayload.value && interceptorPayload.value.length > 1 && interceptorPayload.value[0].to === interceptorPayload.value[1].from)
export const uniqueSigners = computed(() => {
	if (interceptorPayload.value) {
		const addresses = [...new Set(interceptorPayload.value.map((x) => utils.getAddress(serialize(EthereumAddress, x.from))))]
		if (bundleContainsFundingTx.value) addresses.shift()
		return addresses
	}
	return []
})
export const totalGas = computed(() => {
	if (interceptorPayload.value) {
		return interceptorPayload.value.reduce((sum, tx, index) => (index === 0 && bundleContainsFundingTx.value ? 21000n : BigInt(tx.gasLimit.toString()) + sum), 0n)
	}
	return 0n
})
// @TODO: Change this to track minimum amount of ETH needed to deposit
export const totalValue = computed(() => {
	if (interceptorPayload.value) {
		return interceptorPayload.value.reduce((sum, tx, index) => (index === 0 && bundleContainsFundingTx.value ? 0n : BigInt(tx.value.toString()) + sum), 0n)
	}
	return 0n
})
export const fundingAmountMin = computed(() => {
	if (!bundleContainsFundingTx.value) return 0n
	const maxBaseFee = getMaxBaseFeeInFutureBlock(latestBlock.value.baseFee, 2)
	return totalGas.value * (priorityFee.value + maxBaseFee) + totalValue.value
})

// Sync stores on page load
const burnerPrivateKey = localStorage.getItem('wallet')
if (burnerPrivateKey) {
	wallet.value = new Wallet(burnerPrivateKey)
}

// @dev: Automatically update localStorage on state change, manually update payload
wallet.subscribe((w) => {
	if (w) localStorage.setItem('wallet', w.privateKey)
	else localStorage.removeItem('wallet')
})

completedSession.subscribe((status) => localStorage.setItem('completedSession', JSON.stringify(status)))

// Set interceptorPayload
const payload = JSON.parse(localStorage.getItem('payload') ?? 'null')
if (payload) interceptorPayload.value = GetSimulationStackReply.parse(payload)

bundleContainsFundingTx.subscribe((x) => {
	if (x && !wallet.value) wallet.value = Wallet.createRandom()
})
