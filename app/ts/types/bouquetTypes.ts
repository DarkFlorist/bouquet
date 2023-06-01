import * as t from 'funtypes'
import { EthereumAddress, EthereumInput, EthereumQuantity } from './ethereumTypes'

export type TransactionList = t.Static<typeof TransactionList>
export const TransactionList = t.ReadonlyArray(
	t
		.Object({
			from: EthereumAddress,
			to: t.Union(EthereumAddress, t.Null, t.Literal('FUNDING')),
			value: EthereumQuantity,
			input: EthereumInput,
			chainId: EthereumQuantity
		})
		.asReadonly(),
)

export type PopulatedTransactionList = t.Static<typeof PopulatedTransactionList>
export const PopulatedTransactionList = t.ReadonlyArray(
	t
		.Object({
			from: EthereumAddress,
			to: t.Union(EthereumAddress, t.Null, t.Literal('FUNDING')),
			value: EthereumQuantity,
			input: EthereumInput,
			chainId: EthereumQuantity,
			nonce: EthereumQuantity,
			maxFeePerGas: EthereumQuantity,
			maxPriorityFeePerGas: EthereumQuantity,
			gas: EthereumQuantity
		})
		.asReadonly(),
)
