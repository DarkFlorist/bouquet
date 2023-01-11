// import { provider, wallets } from '$lib/state';
// import { Sync, Trigger } from 'ether-state';
// import { constants, utils, type BigNumber } from 'ethers';
// import { get } from 'svelte/store';

// Don't run on server
export const ssr = false;

// const IMulticall = new utils.Interface([
// 	'function getEthBalance(address addr) external view returns (uint256 balance)',
// ]);

// new Sync(
// 	[
// 		{
// 			trigger: Trigger.BLOCK,
// 			input: (blockNumber: BigNumber) => {
// 				console.log('Blocknumber', blockNumber);
// 				// @TODO: track block height and last baseFee

// 				return [
// 					get(wallets).length > 0
// 						? get(wallets)[get(wallets).length - 1].address
// 						: constants.AddressZero,
// 				];
// 			},
// 			call: {
// 				// 		Multicall2: Balance of funding account
// 				target: () => '0x5ba1e12693dc8f9c48aad8770482f4739beed696',
// 				interface: IMulticall,
// 				selector: 'getEthBalance',
// 			},
// 			output: ([balance]: [BigNumber]) => {
// 				console.log('Burner balance:', utils.formatEther(balance));
// 			},
// 		},
// 	],
// 	get(provider)
// );
