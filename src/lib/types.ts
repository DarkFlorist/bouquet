import type { BytesLike } from 'ethers'

export type PayloadTransaction = {
	type: BytesLike
	from: string
	nonce: BytesLike
	maxFeePerGas: BytesLike
	maxPriorityFeePerGas: BytesLike
	gas: BytesLike
	to: string
	value: BytesLike
	input: BytesLike
	chainId: BytesLike
	gasSpent: BytesLike
	returnValue: BytesLike
	events: [
		{
			loggersAddress: string
			data: string
			topics: string[]
		},
	]
	balanceChanges: [
		{
			address: string
			before: BytesLike
			after: BytesLike
		},
	]
	gasLimit: BytesLike
}
