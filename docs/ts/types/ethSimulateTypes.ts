import * as funtypes from 'funtypes'
import { EthereumAccessList, EthereumAddress, EthereumBlockTag, EthereumBytes32, EthereumData, EthereumInput, EthereumQuantity, EthereumQuantitySmall, EthereumTimestamp, LiteralConverterParserFactory } from './ethereumTypes.js'

type AccountOverride = funtypes.Static<typeof AccountOverride>
const AccountOverride = funtypes.ReadonlyPartial({
	state: funtypes.ReadonlyRecord(funtypes.String, EthereumBytes32),
	stateDiff: funtypes.ReadonlyRecord(funtypes.String, EthereumBytes32),
	nonce: EthereumQuantitySmall,
	balance: EthereumQuantity,
	code: EthereumData,
	movePrecompileToAddress: EthereumAddress,
})

type BlockOverride = funtypes.Static<typeof BlockOverride>
const BlockOverride = funtypes.Partial({
    number: EthereumQuantity,
    prevRandao: EthereumQuantity,
    time: EthereumTimestamp,
    gasLimit: EthereumQuantitySmall,
    feeRecipient: EthereumAddress,
    baseFeePerGas: EthereumQuantity,
}).asReadonly()

export type TransactionType = funtypes.Static<typeof TransactionType>
export const TransactionType = funtypes.Union(
	funtypes.Literal(0).withParser(LiteralConverterParserFactory(0, 'legacy' as const)),
	funtypes.Literal(null).withParser(LiteralConverterParserFactory(null, 'legacy' as const)),
	funtypes.Literal(undefined).withParser(LiteralConverterParserFactory(undefined, 'legacy' as const)),
	funtypes.Literal(1).withParser(LiteralConverterParserFactory(1, '2930' as const)),
	funtypes.Literal(2).withParser(LiteralConverterParserFactory(2, '1559' as const)),
	funtypes.Literal(3).withParser(LiteralConverterParserFactory(3, '4844' as const)),
)

type BlockCall = funtypes.Static<typeof BlockCall>
const BlockCall = funtypes.Partial({
	type: TransactionType,
	from: EthereumAddress,
	nonce: EthereumQuantity,
	maxFeePerGas: EthereumQuantity,
	maxPriorityFeePerGas: EthereumQuantity,
	gas: EthereumQuantity,
	to: funtypes.Union(EthereumAddress, funtypes.Null),
	value: EthereumQuantity,
	input: EthereumInput,
	chainId: EthereumQuantity,
	accessList: EthereumAccessList,
})

export type StateOverrides = funtypes.Static<typeof StateOverrides>
export const StateOverrides = funtypes.ReadonlyRecord(funtypes.String, AccountOverride)

export type BlockCalls = funtypes.Static<typeof BlockCalls>
export const BlockCalls = funtypes.Intersect(
	funtypes.ReadonlyObject({
		calls: funtypes.ReadonlyArray(BlockCall),
	}),
	funtypes.ReadonlyPartial({
		stateOverrides: StateOverrides,
		blockOverrides: BlockOverride,
	})
)

export type ethSimulateV1ParamObject = funtypes.Static<typeof ethSimulateV1ParamObject>
const ethSimulateV1ParamObject = funtypes.ReadonlyObject({
	blockStateCalls: funtypes.ReadonlyArray(BlockCalls),
	traceTransfers: funtypes.Boolean,
	validation: funtypes.Boolean,
})

export type EthSimulateV1Params = funtypes.Static<typeof EthSimulateV1Params>
export const EthSimulateV1Params = funtypes.ReadonlyObject({
	method: funtypes.Literal('eth_simulateV1'),
	params: funtypes.ReadonlyTuple(ethSimulateV1ParamObject, EthereumBlockTag),
})

export type EthereumEvent = funtypes.Static<typeof EthereumEvent>
export const EthereumEvent = funtypes.ReadonlyObject({
	address: EthereumAddress,
	data: EthereumInput,
	topics: funtypes.ReadonlyArray(EthereumBytes32),
}).asReadonly()

type CallResultLog = funtypes.Static<typeof CallResultLog>
const CallResultLog = funtypes.Intersect(
	EthereumEvent,
	funtypes.ReadonlyObject({
		logIndex: EthereumQuantity,
		blockHash: EthereumBytes32,
		blockNumber: EthereumQuantity,
	}),
	funtypes.ReadonlyPartial({ // these are not optional in the eth_simulateV1 spec, but they are not standard for logs
		transactionHash: EthereumBytes32,
		transactionIndex: EthereumQuantity,
	})
)

type CallResultLogs = funtypes.Static<typeof CallResultLogs>
const CallResultLogs = funtypes.ReadonlyArray(CallResultLog)

type EthSimulateCallResultFailure = funtypes.Static<typeof EthSimulateCallResultFailure>
const EthSimulateCallResultFailure = funtypes.ReadonlyObject({
	  status: funtypes.Literal('0x0').withParser(LiteralConverterParserFactory('0x0', 'failure' as const)),
	  returnData: EthereumData,
	  gasUsed: EthereumQuantitySmall,
	  error: funtypes.ReadonlyObject({
		  code: funtypes.Number,
		  message: funtypes.String
	  })
})

type EthSimulateCallResultSuccess = funtypes.Static<typeof EthSimulateCallResultSuccess>
const EthSimulateCallResultSuccess = funtypes.ReadonlyObject({
	returnData: EthereumData,
	gasUsed: EthereumQuantitySmall,
	status: funtypes.Literal('0x1').withParser(LiteralConverterParserFactory('0x1', 'success' as const)),
	logs: CallResultLogs
})

export type EthSimulateV1CallResult = funtypes.Static<typeof EthSimulateV1CallResult>
export const EthSimulateV1CallResult = funtypes.Union(EthSimulateCallResultFailure, EthSimulateCallResultSuccess)

export type EthSimulateV1CallResults = funtypes.Static<typeof EthSimulateV1CallResults>
export const EthSimulateV1CallResults = funtypes.ReadonlyArray(EthSimulateV1CallResult)

type EthSimulateV1BlockResult = funtypes.Static<typeof EthSimulateV1BlockResult>
const EthSimulateV1BlockResult = funtypes.ReadonlyObject({
    number: EthereumQuantity,
    hash: EthereumBytes32,
    timestamp: EthereumQuantity,
    gasLimit: EthereumQuantitySmall,
    gasUsed: EthereumQuantitySmall,
    baseFeePerGas: EthereumQuantity,
    calls: EthSimulateV1CallResults,
})

export type EthSimulateV1Result = funtypes.Static<typeof EthSimulateV1Result>
export const EthSimulateV1Result = funtypes.ReadonlyArray(EthSimulateV1BlockResult)

type JsonRpcSuccessResponse = funtypes.Static<typeof JsonRpcSuccessResponse>
const JsonRpcSuccessResponse = funtypes.ReadonlyObject({
	jsonrpc: funtypes.Literal('2.0'),
	id: funtypes.Union(funtypes.String, funtypes.Number),
	result: funtypes.Unknown,
}).asReadonly()

export type JsonRpcErrorResponse = funtypes.Static<typeof JsonRpcErrorResponse>
export const JsonRpcErrorResponse = funtypes.ReadonlyObject({
	jsonrpc: funtypes.Literal('2.0'),
	id: funtypes.Union(funtypes.String, funtypes.Number),
	error: funtypes.ReadonlyObject({
		code: funtypes.Number,
		message: funtypes.String,
		data: funtypes.Unknown,
	}).asReadonly(),
}).asReadonly()

export type JsonRpcResponse = funtypes.Static<typeof JsonRpcResponse>
export const JsonRpcResponse = funtypes.Union(JsonRpcErrorResponse, JsonRpcSuccessResponse)
