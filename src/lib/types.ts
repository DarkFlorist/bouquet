import type { BytesLike } from 'ethers';

export type PayloadTransaction = {
	from: string;
	to: string;
	input: BytesLike;
	value: BytesLike;
	chainId: BytesLike;
	gas: BytesLike;
};
