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
		provider,
		authSigner,
		'https://relay-goerli.flashbots.net/',
		'goerli'
	);
	return flashbotsProvider;
};

export async function simulate(flashbotsProvider: FlashbotsBundleProvider) {
	const provider = new providers.JsonRpcProvider(env.PUBLIC_RPC_URL);

	const signedTransactions = await flashbotsProvider.signBundle(
		get(bundleTransactions) as FlashbotsBundleTransaction[]
	);

	const currentBlock = await provider.getBlockNumber();

	const simulation = await flashbotsProvider.simulate(
		signedTransactions,
		currentBlock + 2
	);
	return simulation;
}
