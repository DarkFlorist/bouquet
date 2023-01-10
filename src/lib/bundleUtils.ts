import { providers, Wallet } from 'ethers';
import {
	FlashbotsBundleProvider,
	type FlashbotsBundleTransaction,
} from '@flashbots/ethers-provider-bundle';
import { bundleTransactions } from './state';
import { get } from 'svelte/store';
import { env } from '$env/dynamic/public';

export const createProvider = async () => {
	// Standard json rpc provider directly from ethers.js (NOT Flashbots)
	const provider = new providers.JsonRpcProvider(env.PUBLIC_RPC_URL);
	const authSigner = Wallet.createRandom().connect(provider);
	const flashbotsProvider = await FlashbotsBundleProvider.create(
		provider, // a normal ethers.js provider, to perform gas estimiations and nonce lookups
		authSigner, // ethers.js signer wallet, only for signing request payloads, not transactions
		// 'https://0xb1d229d9c21298a87846c7022ebeef277dfc321fe674fa45312e20b5b6c400bfde9383f801848d7837ed5fc449083a12@relay-goerli.edennetwork.io', // 'https://relay-goerli.flashbots.net/',
		'https://relay-goerli.flashbots.net/',
		'goerli'
	);
	return flashbotsProvider;
};

export async function simulate(flashbotsProvider: FlashbotsBundleProvider) {
	console.log(env.PUBLIC_RPC_URL);
	const provider = new providers.JsonRpcProvider(env.PUBLIC_RPC_URL);

	// @TODO: fix signing
	// const bundle: FlashbotsBundleTransaction[] = get(bundleTransactions).map(
	// 	(x) => ({
	// 		signer: x.signer as Wallet,
	// 		transaction: {
	// 			to: x.transaction.to,
	// 			from: x.transaction.from,
	// 			value: x.transaction.value,
	// 			data: x.transaction.iwnput,
	// 			gasLimit: x.transaction.gas,
	// 		},
	// 	})
	// );
	const signedTransactions = await flashbotsProvider.signBundle(
		get(bundleTransactions) as FlashbotsBundleTransaction[]
	);
	console.log(signedTransactions);

	const currentBlock = await provider.getBlockNumber();

	const simulation = await flashbotsProvider.simulate(
		signedTransactions,
		currentBlock + 2
	);
	console.log(simulation);
	// const real = await flashbotsProvider.sendBundle(
	// 	get(bundleTransactions) as FlashbotsBundleTransaction[],
	// 	currentBlock + 2
	// );
	// console.log(real);
}
