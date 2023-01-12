import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { derived, get, writable } from 'svelte/store';
import { BigNumber, providers, utils, Wallet } from 'ethers';
import type { PayloadTransaction } from './types';
import type { FlashbotsBundleTransaction } from '@flashbots/ethers-provider-bundle';

export const ssr = false;

export const provider = writable<providers.Provider>(
	new providers.JsonRpcProvider(env.PUBLIC_RPC_URL)
);

export const wallets = writable<Wallet[]>([]);
export const interceptorPayload = writable<PayloadTransaction[]>();
export const completedSession = writable<Boolean>(false);

export const activeSession = derived(
	[wallets, interceptorPayload, completedSession],
	([$wallets, $interceptorPayload, $completedSession]) =>
		$completedSession || ($wallets.length > 0 && $interceptorPayload)
);

export const uniqueSigners = writable<string[]>();
export const isFundingTransaction = writable<Boolean>();
export const totalGas = writable<BigNumber>();
export const totalValue = writable<BigNumber>();
export const bundleTransactions = writable<FlashbotsBundleTransaction[]>();

export const currentBlock = writable<number>();
export const baseFee = writable<BigNumber>();
export const gasPrice = writable<BigNumber>();
export const fundingAmountMin = writable<BigNumber>();
export const fundingAccountBalance = writable<BigNumber>();

// Sync stores on page load
if (browser) {
	wallets.set(
		JSON.parse(localStorage.getItem('wallets') ?? '[]').map(
			(pk: string) => new Wallet(pk)
		)
	);

	// @dev: Automatically update localStorage on state change, manually update payload
	wallets.subscribe((data) =>
		localStorage.setItem(
			'wallets',
			JSON.stringify(data.map((wallet) => wallet.privateKey))
		)
	);
	completedSession.subscribe((status) =>
		localStorage.setItem('completedSession', JSON.stringify(status))
	);

	// Set interceptorPayload
	const payload = JSON.parse(
		localStorage.getItem('payload') ?? 'null'
	) as PayloadTransaction[];
	if (payload) {
		const _uniqueSigners = [
			...new Set(payload.map((tx) => utils.getAddress(tx.from))),
		];
		const _isFundingTransaction =
			payload.length >= 2 &&
			_uniqueSigners.includes(utils.getAddress(payload[0].to));

		const _bundleTransactions = payload.map(
			({ from, to, value, input, gas, type }) => ({
				transaction: {
					type: Number(type),
					from: utils.getAddress(from),
					to: utils.getAddress(to),
					value,
					data: input,
					gasLimit: gas,
				},
			})
		) as FlashbotsBundleTransaction[];

		let fundingTarget: string;
		if (_isFundingTransaction) {
			if (get(wallets).length === 0) {
				wallets.subscribe((x) => [...x, Wallet.createRandom()]);
			}
			fundingTarget = payload[0].to;
			_uniqueSigners.shift();
			_bundleTransactions.shift();
		}

		const _totalGas = _bundleTransactions.reduce(
			(sum, current) => sum.add(current?.transaction.gasLimit ?? '0'),
			BigNumber.from(0)
		);

		// @TODO: Check this properly based on simulation +- on each transaction in step
		const _totalValue = _bundleTransactions
			.filter((tx) => tx.transaction.from === fundingTarget)
			.reduce(
				(sum, current) => sum.add(current?.transaction.value ?? '0'),
				BigNumber.from(0)
			);

		uniqueSigners.set(_uniqueSigners);
		bundleTransactions.set(_bundleTransactions);
		isFundingTransaction.set(_isFundingTransaction);
		totalGas.set(_totalGas);
		totalValue.set(_totalValue);
		interceptorPayload.set(payload);
	}
	completedSession.set(
		JSON.parse(localStorage.getItem('completedSession') ?? 'false')
	);
}
