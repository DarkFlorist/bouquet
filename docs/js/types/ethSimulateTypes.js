import * as funtypes from 'funtypes';
import { EthereumAccessList, EthereumAddress, EthereumBlockTag, EthereumBytes32, EthereumData, EthereumInput, EthereumQuantity, EthereumQuantitySmall, EthereumTimestamp, LiteralConverterParserFactory } from './ethereumTypes.js';
const AccountOverride = funtypes.ReadonlyPartial({
    state: funtypes.ReadonlyRecord(funtypes.String, EthereumBytes32),
    stateDiff: funtypes.ReadonlyRecord(funtypes.String, EthereumBytes32),
    nonce: EthereumQuantitySmall,
    balance: EthereumQuantity,
    code: EthereumData,
    movePrecompileToAddress: EthereumAddress,
});
const BlockOverride = funtypes.Partial({
    number: EthereumQuantity,
    prevRandao: EthereumQuantity,
    time: EthereumTimestamp,
    gasLimit: EthereumQuantitySmall,
    feeRecipient: EthereumAddress,
    baseFeePerGas: EthereumQuantity,
}).asReadonly();
export const TransactionType = funtypes.Union(funtypes.Literal(0).withParser(LiteralConverterParserFactory(0, 'legacy')), funtypes.Literal(null).withParser(LiteralConverterParserFactory(null, 'legacy')), funtypes.Literal(undefined).withParser(LiteralConverterParserFactory(undefined, 'legacy')), funtypes.Literal(1).withParser(LiteralConverterParserFactory(1, '2930')), funtypes.Literal(2).withParser(LiteralConverterParserFactory(2, '1559')), funtypes.Literal(3).withParser(LiteralConverterParserFactory(3, '4844')));
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
});
export const StateOverrides = funtypes.ReadonlyRecord(funtypes.String, AccountOverride);
export const BlockCalls = funtypes.Intersect(funtypes.ReadonlyObject({
    calls: funtypes.ReadonlyArray(BlockCall),
}), funtypes.ReadonlyPartial({
    stateOverrides: StateOverrides,
    blockOverrides: BlockOverride,
}));
const ethSimulateV1ParamObject = funtypes.ReadonlyObject({
    blockStateCalls: funtypes.ReadonlyArray(BlockCalls),
    traceTransfers: funtypes.Boolean,
    validation: funtypes.Boolean,
});
export const EthSimulateV1Params = funtypes.ReadonlyObject({
    method: funtypes.Literal('eth_simulateV1'),
    params: funtypes.ReadonlyTuple(ethSimulateV1ParamObject, EthereumBlockTag),
});
export const EthereumEvent = funtypes.ReadonlyObject({
    address: EthereumAddress,
    data: EthereumInput,
    topics: funtypes.ReadonlyArray(EthereumBytes32),
}).asReadonly();
const CallResultLog = funtypes.Intersect(EthereumEvent, funtypes.ReadonlyObject({
    logIndex: EthereumQuantity,
    blockHash: EthereumBytes32,
    blockNumber: EthereumQuantity,
}), funtypes.ReadonlyPartial({
    transactionHash: EthereumBytes32,
    transactionIndex: EthereumQuantity,
}));
const CallResultLogs = funtypes.ReadonlyArray(CallResultLog);
const EthSimulateCallResultFailure = funtypes.ReadonlyObject({
    status: funtypes.Literal('0x0').withParser(LiteralConverterParserFactory('0x0', 'failure')),
    returnData: EthereumData,
    gasUsed: EthereumQuantitySmall,
    error: funtypes.ReadonlyObject({
        code: funtypes.Number,
        message: funtypes.String
    })
});
const EthSimulateCallResultSuccess = funtypes.ReadonlyObject({
    returnData: EthereumData,
    gasUsed: EthereumQuantitySmall,
    status: funtypes.Literal('0x1').withParser(LiteralConverterParserFactory('0x1', 'success')),
    logs: CallResultLogs
});
export const EthSimulateV1CallResult = funtypes.Union(EthSimulateCallResultFailure, EthSimulateCallResultSuccess);
export const EthSimulateV1CallResults = funtypes.ReadonlyArray(EthSimulateV1CallResult);
const EthSimulateV1BlockResult = funtypes.ReadonlyObject({
    number: EthereumQuantity,
    hash: EthereumBytes32,
    timestamp: EthereumQuantity,
    gasLimit: EthereumQuantitySmall,
    gasUsed: EthereumQuantitySmall,
    baseFeePerGas: EthereumQuantity,
    calls: EthSimulateV1CallResults,
});
export const EthSimulateV1Result = funtypes.ReadonlyArray(EthSimulateV1BlockResult);
const JsonRpcSuccessResponse = funtypes.ReadonlyObject({
    jsonrpc: funtypes.Literal('2.0'),
    id: funtypes.Union(funtypes.String, funtypes.Number),
    result: funtypes.Unknown,
}).asReadonly();
export const JsonRpcErrorResponse = funtypes.ReadonlyObject({
    jsonrpc: funtypes.Literal('2.0'),
    id: funtypes.Union(funtypes.String, funtypes.Number),
    error: funtypes.ReadonlyObject({
        code: funtypes.Number,
        message: funtypes.String,
        data: funtypes.Unknown,
    }).asReadonly(),
}).asReadonly();
export const JsonRpcResponse = funtypes.Union(JsonRpcErrorResponse, JsonRpcSuccessResponse);
//# sourceMappingURL=ethSimulateTypes.js.map