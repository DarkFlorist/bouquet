import * as f from 'funtypes'

export type PayloadTransaction = f.Static<typeof PayloadTransaction>
export const PayloadTransaction = f.Object({
	type: f.String,
	from: f.String,
	nonce: f.String,
	maxFeePerGas: f.String,
	maxPriorityFeePerGas: f.String,
	gas: f.String,
	to: f.String,
	value: f.String,
	input: f.String,
	chainId: f.String,
	gasSpent: f.String,
	returnValue: f.String,
	balanceChanges: f.Array(
		f.Object({
			address: f.String,
			before: f.String,
			after: f.String,
		}),
	),
	gasLimit: f.String,
})

export const Payload = f.Array(PayloadTransaction)
