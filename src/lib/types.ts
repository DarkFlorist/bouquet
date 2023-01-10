import type { BytesLike, Wallet } from 'ethers';

export type PayloadTransaction = {
	from: string;
	to: string;
	input: BytesLike;
	value: BytesLike;
	chainId: BytesLike;
	gas: BytesLike;
};

export type BundledTransaction = {
	signer?: Wallet;
	transaction: {
		from: string;
		to: string;
		input: BytesLike;
		value: BytesLike;
		gas: BytesLike;
	};
};
