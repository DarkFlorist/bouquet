import type { BytesLike, Signer } from 'ethers'

export type PayloadTransaction = {
	from: string
	to: string
	input: BytesLike
	value: BytesLike
	chainId: BytesLike
	gas: BytesLike
	type: BytesLike
}

export interface FlashbotsBundleTransaction {
	transaction: TransactionRequest
	signer?: Signer
}

export type TransactionRequest = {
	to: string
	from: string
	nonce?: bigint

	gasLimit: bigint
	gasPrice?: bigint

	data: BytesLike
	value: bigint
	chainId?: number

	type: number

	maxPriorityFeePerGas?: bigint
	maxFeePerGas?: bigint
}
