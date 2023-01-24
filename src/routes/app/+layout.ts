import { browser } from '$app/environment'
import {
	blockSync,
	fundingAccountBalance,
	latestBlock,
	provider,
	wallet,
} from '$lib/state'
import { Sync, Trigger } from 'ether-state'
import { BigNumber, constants, utils } from 'ethers'
import { get } from 'svelte/store'

// Don't run on server
export const ssr = false

const IMulticall = new utils.Interface([
	'function getEthBalance(address addr) external view returns (uint256 balance)',
])

if (!get(blockSync) && browser) {
	blockSync.set(
		new Sync(
			[
				{
					trigger: Trigger.BLOCK,
					input: (blockNumber: BigNumber) => {
						updateLatestBlock(blockNumber.toBigInt())

						return [get(wallet)?.address ?? constants.AddressZero]
					},
					call: {
						// Multicall2: Balance of funding account
						target: () => '0x5ba1e12693dc8f9c48aad8770482f4739beed696',
						interface: IMulticall,
						selector: 'getEthBalance',
					},
					output: ([balance]: [BigNumber]) => {
						fundingAccountBalance.set(
							get(wallet)?.address !== constants.AddressZero
								? balance.toBigInt()
								: 0n,
						)
					},
				},
			],
			get(provider),
		),
	)
}

async function updateLatestBlock(blockNumber: bigint) {
	const block = await get(provider).getBlock(Number(blockNumber))
	const baseFee = block.baseFeePerGas?.toBigInt() ?? 0n
	latestBlock.update((lastBlock) => {
		if (!lastBlock || blockNumber > lastBlock.blockNumber) {
			return { blockNumber, baseFee }
		} else return lastBlock
	})
}
