import * as funtypes from 'funtypes';
export type TransactionType = funtypes.Static<typeof TransactionType>;
export declare const TransactionType: funtypes.Union<[funtypes.ParsedValue<funtypes.Literal<0>, "legacy">, funtypes.ParsedValue<funtypes.Literal<null>, "legacy">, funtypes.ParsedValue<funtypes.Literal<undefined>, "legacy">, funtypes.ParsedValue<funtypes.Literal<1>, "2930">, funtypes.ParsedValue<funtypes.Literal<2>, "1559">, funtypes.ParsedValue<funtypes.Literal<3>, "4844">]>;
export type StateOverrides = funtypes.Static<typeof StateOverrides>;
export declare const StateOverrides: funtypes.ReadonlyRecord<funtypes.String, funtypes.Partial<{
    state: funtypes.ReadonlyRecord<funtypes.String, funtypes.ParsedValue<funtypes.String, bigint>>;
    stateDiff: funtypes.ReadonlyRecord<funtypes.String, funtypes.ParsedValue<funtypes.String, bigint>>;
    nonce: funtypes.ParsedValue<funtypes.String, bigint>;
    balance: funtypes.ParsedValue<funtypes.String, bigint>;
    code: funtypes.ParsedValue<funtypes.String, Uint8Array>;
    movePrecompileToAddress: funtypes.ParsedValue<funtypes.String, bigint>;
}, true>>;
export type BlockCalls = funtypes.Static<typeof BlockCalls>;
export declare const BlockCalls: funtypes.Intersect<[funtypes.Object<{
    calls: funtypes.ReadonlyArray<funtypes.Partial<{
        type: funtypes.Union<[funtypes.ParsedValue<funtypes.Literal<0>, "legacy">, funtypes.ParsedValue<funtypes.Literal<null>, "legacy">, funtypes.ParsedValue<funtypes.Literal<undefined>, "legacy">, funtypes.ParsedValue<funtypes.Literal<1>, "2930">, funtypes.ParsedValue<funtypes.Literal<2>, "1559">, funtypes.ParsedValue<funtypes.Literal<3>, "4844">]>;
        from: funtypes.ParsedValue<funtypes.String, bigint>;
        nonce: funtypes.ParsedValue<funtypes.String, bigint>;
        maxFeePerGas: funtypes.ParsedValue<funtypes.String, bigint>;
        maxPriorityFeePerGas: funtypes.ParsedValue<funtypes.String, bigint>;
        gas: funtypes.ParsedValue<funtypes.String, bigint>;
        to: funtypes.Union<[funtypes.ParsedValue<funtypes.String, bigint>, funtypes.Literal<null>]>;
        value: funtypes.ParsedValue<funtypes.String, bigint>;
        input: funtypes.ParsedValue<funtypes.Union<[funtypes.String, funtypes.Literal<undefined>]>, Uint8Array>;
        chainId: funtypes.ParsedValue<funtypes.String, bigint>;
        accessList: funtypes.ReadonlyArray<funtypes.Object<{
            address: funtypes.ParsedValue<funtypes.String, bigint>;
            storageKeys: funtypes.ReadonlyArray<funtypes.ParsedValue<funtypes.String, bigint>>;
        }, true>>;
    }, false>>;
}, true>, funtypes.Partial<{
    stateOverrides: funtypes.ReadonlyRecord<funtypes.String, funtypes.Partial<{
        state: funtypes.ReadonlyRecord<funtypes.String, funtypes.ParsedValue<funtypes.String, bigint>>;
        stateDiff: funtypes.ReadonlyRecord<funtypes.String, funtypes.ParsedValue<funtypes.String, bigint>>;
        nonce: funtypes.ParsedValue<funtypes.String, bigint>;
        balance: funtypes.ParsedValue<funtypes.String, bigint>;
        code: funtypes.ParsedValue<funtypes.String, Uint8Array>;
        movePrecompileToAddress: funtypes.ParsedValue<funtypes.String, bigint>;
    }, true>>;
    blockOverrides: funtypes.Partial<{
        number: funtypes.ParsedValue<funtypes.String, bigint>;
        prevRandao: funtypes.ParsedValue<funtypes.String, bigint>;
        time: funtypes.ParsedValue<funtypes.String, Date>;
        gasLimit: funtypes.ParsedValue<funtypes.String, bigint>;
        feeRecipient: funtypes.ParsedValue<funtypes.String, bigint>;
        baseFeePerGas: funtypes.ParsedValue<funtypes.String, bigint>;
    }, true>;
}, true>]>;
export type ethSimulateV1ParamObject = funtypes.Static<typeof ethSimulateV1ParamObject>;
declare const ethSimulateV1ParamObject: funtypes.Object<{
    blockStateCalls: funtypes.ReadonlyArray<funtypes.Intersect<[funtypes.Object<{
        calls: funtypes.ReadonlyArray<funtypes.Partial<{
            type: funtypes.Union<[funtypes.ParsedValue<funtypes.Literal<0>, "legacy">, funtypes.ParsedValue<funtypes.Literal<null>, "legacy">, funtypes.ParsedValue<funtypes.Literal<undefined>, "legacy">, funtypes.ParsedValue<funtypes.Literal<1>, "2930">, funtypes.ParsedValue<funtypes.Literal<2>, "1559">, funtypes.ParsedValue<funtypes.Literal<3>, "4844">]>;
            from: funtypes.ParsedValue<funtypes.String, bigint>;
            nonce: funtypes.ParsedValue<funtypes.String, bigint>;
            maxFeePerGas: funtypes.ParsedValue<funtypes.String, bigint>;
            maxPriorityFeePerGas: funtypes.ParsedValue<funtypes.String, bigint>;
            gas: funtypes.ParsedValue<funtypes.String, bigint>;
            to: funtypes.Union<[funtypes.ParsedValue<funtypes.String, bigint>, funtypes.Literal<null>]>;
            value: funtypes.ParsedValue<funtypes.String, bigint>;
            input: funtypes.ParsedValue<funtypes.Union<[funtypes.String, funtypes.Literal<undefined>]>, Uint8Array>;
            chainId: funtypes.ParsedValue<funtypes.String, bigint>;
            accessList: funtypes.ReadonlyArray<funtypes.Object<{
                address: funtypes.ParsedValue<funtypes.String, bigint>;
                storageKeys: funtypes.ReadonlyArray<funtypes.ParsedValue<funtypes.String, bigint>>;
            }, true>>;
        }, false>>;
    }, true>, funtypes.Partial<{
        stateOverrides: funtypes.ReadonlyRecord<funtypes.String, funtypes.Partial<{
            state: funtypes.ReadonlyRecord<funtypes.String, funtypes.ParsedValue<funtypes.String, bigint>>;
            stateDiff: funtypes.ReadonlyRecord<funtypes.String, funtypes.ParsedValue<funtypes.String, bigint>>;
            nonce: funtypes.ParsedValue<funtypes.String, bigint>;
            balance: funtypes.ParsedValue<funtypes.String, bigint>;
            code: funtypes.ParsedValue<funtypes.String, Uint8Array>;
            movePrecompileToAddress: funtypes.ParsedValue<funtypes.String, bigint>;
        }, true>>;
        blockOverrides: funtypes.Partial<{
            number: funtypes.ParsedValue<funtypes.String, bigint>;
            prevRandao: funtypes.ParsedValue<funtypes.String, bigint>;
            time: funtypes.ParsedValue<funtypes.String, Date>;
            gasLimit: funtypes.ParsedValue<funtypes.String, bigint>;
            feeRecipient: funtypes.ParsedValue<funtypes.String, bigint>;
            baseFeePerGas: funtypes.ParsedValue<funtypes.String, bigint>;
        }, true>;
    }, true>]>>;
    traceTransfers: funtypes.Boolean;
    validation: funtypes.Boolean;
}, true>;
export type EthSimulateV1Params = funtypes.Static<typeof EthSimulateV1Params>;
export declare const EthSimulateV1Params: funtypes.Object<{
    method: funtypes.Literal<"eth_simulateV1">;
    params: funtypes.ReadonlyTuple<[funtypes.Object<{
        blockStateCalls: funtypes.ReadonlyArray<funtypes.Intersect<[funtypes.Object<{
            calls: funtypes.ReadonlyArray<funtypes.Partial<{
                type: funtypes.Union<[funtypes.ParsedValue<funtypes.Literal<0>, "legacy">, funtypes.ParsedValue<funtypes.Literal<null>, "legacy">, funtypes.ParsedValue<funtypes.Literal<undefined>, "legacy">, funtypes.ParsedValue<funtypes.Literal<1>, "2930">, funtypes.ParsedValue<funtypes.Literal<2>, "1559">, funtypes.ParsedValue<funtypes.Literal<3>, "4844">]>;
                from: funtypes.ParsedValue<funtypes.String, bigint>;
                nonce: funtypes.ParsedValue<funtypes.String, bigint>;
                maxFeePerGas: funtypes.ParsedValue<funtypes.String, bigint>;
                maxPriorityFeePerGas: funtypes.ParsedValue<funtypes.String, bigint>;
                gas: funtypes.ParsedValue<funtypes.String, bigint>;
                to: funtypes.Union<[funtypes.ParsedValue<funtypes.String, bigint>, funtypes.Literal<null>]>;
                value: funtypes.ParsedValue<funtypes.String, bigint>;
                input: funtypes.ParsedValue<funtypes.Union<[funtypes.String, funtypes.Literal<undefined>]>, Uint8Array>;
                chainId: funtypes.ParsedValue<funtypes.String, bigint>;
                accessList: funtypes.ReadonlyArray<funtypes.Object<{
                    address: funtypes.ParsedValue<funtypes.String, bigint>;
                    storageKeys: funtypes.ReadonlyArray<funtypes.ParsedValue<funtypes.String, bigint>>;
                }, true>>;
            }, false>>;
        }, true>, funtypes.Partial<{
            stateOverrides: funtypes.ReadonlyRecord<funtypes.String, funtypes.Partial<{
                state: funtypes.ReadonlyRecord<funtypes.String, funtypes.ParsedValue<funtypes.String, bigint>>;
                stateDiff: funtypes.ReadonlyRecord<funtypes.String, funtypes.ParsedValue<funtypes.String, bigint>>;
                nonce: funtypes.ParsedValue<funtypes.String, bigint>;
                balance: funtypes.ParsedValue<funtypes.String, bigint>;
                code: funtypes.ParsedValue<funtypes.String, Uint8Array>;
                movePrecompileToAddress: funtypes.ParsedValue<funtypes.String, bigint>;
            }, true>>;
            blockOverrides: funtypes.Partial<{
                number: funtypes.ParsedValue<funtypes.String, bigint>;
                prevRandao: funtypes.ParsedValue<funtypes.String, bigint>;
                time: funtypes.ParsedValue<funtypes.String, Date>;
                gasLimit: funtypes.ParsedValue<funtypes.String, bigint>;
                feeRecipient: funtypes.ParsedValue<funtypes.String, bigint>;
                baseFeePerGas: funtypes.ParsedValue<funtypes.String, bigint>;
            }, true>;
        }, true>]>>;
        traceTransfers: funtypes.Boolean;
        validation: funtypes.Boolean;
    }, true>, funtypes.Union<[funtypes.ParsedValue<funtypes.String, bigint>, funtypes.ParsedValue<funtypes.String, bigint>, funtypes.Literal<"latest">, funtypes.Literal<"pending">]>]>;
}, true>;
export type EthereumEvent = funtypes.Static<typeof EthereumEvent>;
export declare const EthereumEvent: funtypes.Object<{
    address: funtypes.ParsedValue<funtypes.String, bigint>;
    data: funtypes.ParsedValue<funtypes.Union<[funtypes.String, funtypes.Literal<undefined>]>, Uint8Array>;
    topics: funtypes.ReadonlyArray<funtypes.ParsedValue<funtypes.String, bigint>>;
}, true>;
export type EthSimulateV1CallResult = funtypes.Static<typeof EthSimulateV1CallResult>;
export declare const EthSimulateV1CallResult: funtypes.Union<[funtypes.Object<{
    status: funtypes.ParsedValue<funtypes.Literal<"0x0">, "failure">;
    returnData: funtypes.ParsedValue<funtypes.String, Uint8Array>;
    gasUsed: funtypes.ParsedValue<funtypes.String, bigint>;
    error: funtypes.Object<{
        code: funtypes.Number;
        message: funtypes.String;
    }, true>;
}, true>, funtypes.Object<{
    returnData: funtypes.ParsedValue<funtypes.String, Uint8Array>;
    gasUsed: funtypes.ParsedValue<funtypes.String, bigint>;
    status: funtypes.ParsedValue<funtypes.Literal<"0x1">, "success">;
    logs: funtypes.ReadonlyArray<funtypes.Intersect<[funtypes.Object<{
        address: funtypes.ParsedValue<funtypes.String, bigint>;
        data: funtypes.ParsedValue<funtypes.Union<[funtypes.String, funtypes.Literal<undefined>]>, Uint8Array>;
        topics: funtypes.ReadonlyArray<funtypes.ParsedValue<funtypes.String, bigint>>;
    }, true>, funtypes.Object<{
        logIndex: funtypes.ParsedValue<funtypes.String, bigint>;
        blockHash: funtypes.ParsedValue<funtypes.String, bigint>;
        blockNumber: funtypes.ParsedValue<funtypes.String, bigint>;
    }, true>, funtypes.Partial<{
        transactionHash: funtypes.ParsedValue<funtypes.String, bigint>;
        transactionIndex: funtypes.ParsedValue<funtypes.String, bigint>;
    }, true>]>>;
}, true>]>;
export type EthSimulateV1CallResults = funtypes.Static<typeof EthSimulateV1CallResults>;
export declare const EthSimulateV1CallResults: funtypes.ReadonlyArray<funtypes.Union<[funtypes.Object<{
    status: funtypes.ParsedValue<funtypes.Literal<"0x0">, "failure">;
    returnData: funtypes.ParsedValue<funtypes.String, Uint8Array>;
    gasUsed: funtypes.ParsedValue<funtypes.String, bigint>;
    error: funtypes.Object<{
        code: funtypes.Number;
        message: funtypes.String;
    }, true>;
}, true>, funtypes.Object<{
    returnData: funtypes.ParsedValue<funtypes.String, Uint8Array>;
    gasUsed: funtypes.ParsedValue<funtypes.String, bigint>;
    status: funtypes.ParsedValue<funtypes.Literal<"0x1">, "success">;
    logs: funtypes.ReadonlyArray<funtypes.Intersect<[funtypes.Object<{
        address: funtypes.ParsedValue<funtypes.String, bigint>;
        data: funtypes.ParsedValue<funtypes.Union<[funtypes.String, funtypes.Literal<undefined>]>, Uint8Array>;
        topics: funtypes.ReadonlyArray<funtypes.ParsedValue<funtypes.String, bigint>>;
    }, true>, funtypes.Object<{
        logIndex: funtypes.ParsedValue<funtypes.String, bigint>;
        blockHash: funtypes.ParsedValue<funtypes.String, bigint>;
        blockNumber: funtypes.ParsedValue<funtypes.String, bigint>;
    }, true>, funtypes.Partial<{
        transactionHash: funtypes.ParsedValue<funtypes.String, bigint>;
        transactionIndex: funtypes.ParsedValue<funtypes.String, bigint>;
    }, true>]>>;
}, true>]>>;
export type EthSimulateV1Result = funtypes.Static<typeof EthSimulateV1Result>;
export declare const EthSimulateV1Result: funtypes.ReadonlyArray<funtypes.Object<{
    number: funtypes.ParsedValue<funtypes.String, bigint>;
    hash: funtypes.ParsedValue<funtypes.String, bigint>;
    timestamp: funtypes.ParsedValue<funtypes.String, bigint>;
    gasLimit: funtypes.ParsedValue<funtypes.String, bigint>;
    gasUsed: funtypes.ParsedValue<funtypes.String, bigint>;
    baseFeePerGas: funtypes.ParsedValue<funtypes.String, bigint>;
    calls: funtypes.ReadonlyArray<funtypes.Union<[funtypes.Object<{
        status: funtypes.ParsedValue<funtypes.Literal<"0x0">, "failure">;
        returnData: funtypes.ParsedValue<funtypes.String, Uint8Array>;
        gasUsed: funtypes.ParsedValue<funtypes.String, bigint>;
        error: funtypes.Object<{
            code: funtypes.Number;
            message: funtypes.String;
        }, true>;
    }, true>, funtypes.Object<{
        returnData: funtypes.ParsedValue<funtypes.String, Uint8Array>;
        gasUsed: funtypes.ParsedValue<funtypes.String, bigint>;
        status: funtypes.ParsedValue<funtypes.Literal<"0x1">, "success">;
        logs: funtypes.ReadonlyArray<funtypes.Intersect<[funtypes.Object<{
            address: funtypes.ParsedValue<funtypes.String, bigint>;
            data: funtypes.ParsedValue<funtypes.Union<[funtypes.String, funtypes.Literal<undefined>]>, Uint8Array>;
            topics: funtypes.ReadonlyArray<funtypes.ParsedValue<funtypes.String, bigint>>;
        }, true>, funtypes.Object<{
            logIndex: funtypes.ParsedValue<funtypes.String, bigint>;
            blockHash: funtypes.ParsedValue<funtypes.String, bigint>;
            blockNumber: funtypes.ParsedValue<funtypes.String, bigint>;
        }, true>, funtypes.Partial<{
            transactionHash: funtypes.ParsedValue<funtypes.String, bigint>;
            transactionIndex: funtypes.ParsedValue<funtypes.String, bigint>;
        }, true>]>>;
    }, true>]>>;
}, true>>;
export type JsonRpcErrorResponse = funtypes.Static<typeof JsonRpcErrorResponse>;
export declare const JsonRpcErrorResponse: funtypes.Object<{
    jsonrpc: funtypes.Literal<"2.0">;
    id: funtypes.Union<[funtypes.String, funtypes.Number]>;
    error: funtypes.Object<{
        code: funtypes.Number;
        message: funtypes.String;
        data: funtypes.Unknown;
    }, true>;
}, true>;
export type JsonRpcResponse = funtypes.Static<typeof JsonRpcResponse>;
export declare const JsonRpcResponse: funtypes.Union<[funtypes.Object<{
    jsonrpc: funtypes.Literal<"2.0">;
    id: funtypes.Union<[funtypes.String, funtypes.Number]>;
    error: funtypes.Object<{
        code: funtypes.Number;
        message: funtypes.String;
        data: funtypes.Unknown;
    }, true>;
}, true>, funtypes.Object<{
    jsonrpc: funtypes.Literal<"2.0">;
    id: funtypes.Union<[funtypes.String, funtypes.Number]>;
    result: funtypes.Unknown;
}, true>]>;
export {};
//# sourceMappingURL=ethSimulateTypes.d.ts.map