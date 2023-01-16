import { browser } from '$app/environment';
import {
	blockSync,
	fundingAccountBalance,
	latestBlock,
	provider,
	wallets,
} from '$lib/state';
import { Sync, Trigger } from 'ether-state';
import { BigNumber, constants, utils } from 'ethers';
import { get } from 'svelte/store';

// Don't run on server
export const ssr = false;

const IMulticall = new utils.Interface([
	'function getEthBalance(address addr) external view returns (uint256 balance)',
]);

if (!get(blockSync) && browser) {
	blockSync.set(
		new Sync(
			[
				{
					trigger: Trigger.BLOCK,
					input: (blockNumber: BigNumber) => {
						updateLatestBlock(blockNumber);

						return [
							get(wallets).length > 0
								? get(wallets)[get(wallets).length - 1].address
								: constants.AddressZero,
						];
					},
					call: {
						// Multicall2: Balance of funding account
						target: () => '0x5ba1e12693dc8f9c48aad8770482f4739beed696',
						interface: IMulticall,
						selector: 'getEthBalance',
					},
					output: ([balance]: [BigNumber]) => {
						fundingAccountBalance.set(balance);
					},
				},
			],
			get(provider)
		)
	);
}

async function updateLatestBlock(blockNumber: BigNumber) {
	const block = await get(provider).getBlock(blockNumber.toNumber());
	const baseFee = block.baseFeePerGas ?? BigNumber.from(0);
	latestBlock.update((lastBlock) => {
		if (!lastBlock || blockNumber.gt(lastBlock.blockNumber)) {
			return { blockNumber, baseFee };
		} else return lastBlock;
	});
}
