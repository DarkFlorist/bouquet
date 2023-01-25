import { browser } from '$app/environment'
import {
	fundingAccountBalance,
	latestBlock,
	provider,
	wallet,
} from '$lib/state'
import { get } from 'svelte/store'

// Don't run on server
export const ssr = false

async function blockCallback(blockNumber: number) {
	updateLatestBlock(blockNumber)
	if (get(wallet)) {
		const bal = await get(provider).getBalance(get(wallet).address)
		fundingAccountBalance.set(bal.toBigInt())
	}
}

async function updateLatestBlock(blockNumber: number) {
	const block = await get(provider).getBlock(blockNumber)
	const baseFee = block.baseFeePerGas?.toBigInt() ?? 0n
	latestBlock.update((lastBlock) => {
		if (!lastBlock || BigInt(blockNumber) > lastBlock.blockNumber) {
			return { blockNumber: BigInt(blockNumber), baseFee }
		} else return lastBlock
	})
}

if (browser && get(provider) && get(provider).listenerCount('block') === 0) {
	get(provider).on('block', blockCallback)
}
