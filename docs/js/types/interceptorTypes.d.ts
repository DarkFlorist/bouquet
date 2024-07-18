import * as t from 'funtypes';
export type GetSimulationStackReply = t.Static<typeof GetSimulationStackReply>;
export declare const GetSimulationStackReply: t.ReadonlyArray<t.Intersect<[t.Union<[t.Intersect<[t.Object<{
    type: t.Union<[t.ParsedValue<t.Literal<"0x0">, "legacy">, t.ParsedValue<t.Literal<undefined>, "legacy">]>;
    from: t.ParsedValue<t.String, bigint>;
    nonce: t.ParsedValue<t.String, bigint>;
    gasPrice: t.ParsedValue<t.String, bigint>;
    gas: t.ParsedValue<t.String, bigint>;
    to: t.Union<[t.ParsedValue<t.String, bigint>, t.Literal<null>]>;
    value: t.ParsedValue<t.String, bigint>;
    input: t.ParsedValue<t.Union<[t.String, t.Literal<undefined>]>, Uint8Array>;
}, true>, t.Partial<{
    chainId: t.ParsedValue<t.String, bigint>;
}, true>]>, t.Intersect<[t.Object<{
    type: t.ParsedValue<t.Literal<"0x1">, "2930">;
    from: t.ParsedValue<t.String, bigint>;
    nonce: t.ParsedValue<t.String, bigint>;
    gasPrice: t.ParsedValue<t.String, bigint>;
    gas: t.ParsedValue<t.String, bigint>;
    to: t.Union<[t.ParsedValue<t.String, bigint>, t.Literal<null>]>;
    value: t.ParsedValue<t.String, bigint>;
    input: t.ParsedValue<t.Union<[t.String, t.Literal<undefined>]>, Uint8Array>;
    chainId: t.ParsedValue<t.String, bigint>;
}, true>, t.Partial<{
    accessList: t.ReadonlyArray<t.Object<{
        address: t.ParsedValue<t.String, bigint>;
        storageKeys: t.ReadonlyArray<t.ParsedValue<t.String, bigint>>;
    }, true>>;
}, false>]>, t.Intersect<[t.Object<{
    type: t.ParsedValue<t.Literal<"0x2">, "1559">;
    from: t.ParsedValue<t.String, bigint>;
    nonce: t.ParsedValue<t.String, bigint>;
    maxFeePerGas: t.ParsedValue<t.String, bigint>;
    maxPriorityFeePerGas: t.ParsedValue<t.String, bigint>;
    gas: t.ParsedValue<t.String, bigint>;
    to: t.Union<[t.ParsedValue<t.String, bigint>, t.Literal<null>]>;
    value: t.ParsedValue<t.String, bigint>;
    input: t.ParsedValue<t.Union<[t.String, t.Literal<undefined>]>, Uint8Array>;
    chainId: t.ParsedValue<t.String, bigint>;
}, true>, t.Partial<{
    accessList: t.ReadonlyArray<t.Object<{
        address: t.ParsedValue<t.String, bigint>;
        storageKeys: t.ReadonlyArray<t.ParsedValue<t.String, bigint>>;
    }, true>>;
}, false>]>]>, t.Union<[t.Object<{
    statusCode: t.ParsedValue<t.Literal<1>, "success">;
    gasSpent: t.ParsedValue<t.String, bigint>;
    returnValue: t.ParsedValue<t.String, Uint8Array>;
    events: t.ReadonlyArray<t.Object<{
        loggersAddress: t.ParsedValue<t.String, bigint>;
        data: t.ParsedValue<t.Union<[t.String, t.Literal<undefined>]>, Uint8Array>;
        topics: t.ReadonlyArray<t.ParsedValue<t.String, bigint>>;
    }, true>>;
    balanceChanges: t.ReadonlyArray<t.Object<{
        address: t.ParsedValue<t.String, bigint>;
        before: t.ParsedValue<t.String, bigint>;
        after: t.ParsedValue<t.String, bigint>;
    }, true>>;
}, true>, t.Object<{
    statusCode: t.ParsedValue<t.Literal<0>, "failure">;
    gasSpent: t.ParsedValue<t.String, bigint>;
    error: t.ParsedValue<t.String, string>;
    returnValue: t.ParsedValue<t.String, Uint8Array>;
}, true>]>, t.Object<{
    realizedGasPrice: t.ParsedValue<t.String, bigint>;
    gasLimit: t.ParsedValue<t.String, bigint>;
    maxPriorityFeePerGas: t.ParsedValue<t.String, bigint>;
    balanceChanges: t.ReadonlyArray<t.Object<{
        address: t.ParsedValue<t.String, bigint>;
        before: t.ParsedValue<t.String, bigint>;
        after: t.ParsedValue<t.String, bigint>;
    }, true>>;
}, true>]>>;
//# sourceMappingURL=interceptorTypes.d.ts.map