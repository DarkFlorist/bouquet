import * as funtypes from 'funtypes'
import { EthereumAddress, EthereumInput, EthereumQuantity } from './ethereumTypes.js'

export type TransactionList = funtypes.Static<typeof TransactionList>
export const TransactionList = funtypes.ReadonlyArray(funtypes.Object({
	from: funtypes.Union(EthereumAddress, funtypes.Literal('FUNDING')),
	to: funtypes.Union(EthereumAddress, funtypes.Null),
	value: EthereumQuantity,
	input: EthereumInput,
	chainId: EthereumQuantity,
	gasLimit: EthereumQuantity
}).asReadonly())

export type PopulatedTransactionList = funtypes.Static<typeof PopulatedTransactionList>
export const PopulatedTransactionList = funtypes.ReadonlyArray(funtypes.Object({
	from: EthereumAddress,
	to: funtypes.Union(EthereumAddress, funtypes.Null),
	value: EthereumQuantity,
	input: EthereumInput,
	chainId: EthereumQuantity,
	gasLimit: EthereumQuantity,
	nonce: EthereumQuantity,
	maxFeePerGas: EthereumQuantity,
	maxPriorityFeePerGas: EthereumQuantity
}).asReadonly())

export type BouquetNetwork = funtypes.Static<typeof BouquetNetwork>
export const BouquetNetwork = funtypes.Object({
	chainId: EthereumQuantity,
	networkName: funtypes.String,
	relayMode: funtypes.Union(funtypes.Literal('relay'), funtypes.Literal('mempool')),
	mempoolSubmitRpcEndpoint: funtypes.Union(funtypes.String, funtypes.Undefined),
	mempoolSimulationRpcEndpoint: funtypes.Union(funtypes.String, funtypes.Undefined),
	blocksInFuture: EthereumQuantity,
	priorityFee: EthereumQuantity,
	blockExplorerApi: funtypes.Union(funtypes.String, funtypes.Undefined),
	blockExplorer: funtypes.Union(funtypes.String, funtypes.Undefined),
	simulationRelayEndpoint: funtypes.Union(funtypes.String, funtypes.Undefined),
	submissionRelayEndpoint: funtypes.Union(funtypes.String, funtypes.Undefined)
})

export type BouquetSettings = funtypes.Static<typeof BouquetSettings>
export const BouquetSettings = funtypes.ReadonlyArray(BouquetNetwork)
