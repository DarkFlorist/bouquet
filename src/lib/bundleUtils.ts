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
	console.log(env.PUBLIC_RPC_URL);
	const provider = new providers.JsonRpcProvider(env.PUBLIC_RPC_URL);
	const authSigner = Wallet.createRandom().connect(provider);
	const flashbotsProvider = await FlashbotsBundleProvider.create(
		provider, // a normal ethers.js provider, to perform gas estimiations and nonce lookups
		authSigner, // ethers.js signer wallet, only for signing request payloads, not transactions
		'https://relay-goerli.flashbots.net/'
	);
	return flashbotsProvider;
};

export async function simulate(flashbotsProvider: FlashbotsBundleProvider) {
	console.log(env.PUBLIC_RPC_URL);
	const provider = new providers.JsonRpcProvider(env.PUBLIC_RPC_URL);

	const currentBlock = await provider.getBlockNumber();
	// @TODO: fix signing
	const bundle: FlashbotsBundleTransaction[] = get(bundleTransactions).map(
		(x) => ({
			signer: x.signer as Wallet,
			transaction: {
				to: x.transaction.to,
				from: x.transaction.from,
				value: x.transaction.value,
				data: x.transaction.input,
				gasLimit: x.transaction.gas,
			},
		})
	);
	const signedTransactions = await flashbotsProvider.signBundle(bundle);
	// const simulation = await flashbotsProvider.simulate(
	// 	signedTransactions,
	// 	currentBlock + 5
	// );
	console.log(signedTransactions);
}
