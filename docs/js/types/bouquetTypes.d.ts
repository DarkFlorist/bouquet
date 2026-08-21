import * as funtypes from 'funtypes';
export type Eip7702Authorization = funtypes.Static<typeof Eip7702Authorization>;
export declare const Eip7702Authorization: funtypes.Intersect<[funtypes.Object<{
    chainId: funtypes.ParsedValue<funtypes.String, bigint>;
    address: funtypes.ParsedValue<funtypes.String, bigint>;
    nonce: funtypes.ParsedValue<funtypes.String, bigint>;
}, true>, funtypes.Partial<{
    authority: funtypes.ParsedValue<funtypes.String, bigint>;
    r: funtypes.ParsedValue<funtypes.String, bigint>;
    s: funtypes.ParsedValue<funtypes.String, bigint>;
    yParity: funtypes.Union<[funtypes.ParsedValue<funtypes.Literal<"0x0">, "even">, funtypes.ParsedValue<funtypes.Literal<"0x1">, "odd">]>;
}, true>]>;
export type TransactionList = funtypes.Static<typeof TransactionList>;
export declare const TransactionList: funtypes.ReadonlyArray<funtypes.Intersect<[funtypes.Object<{
    from: funtypes.Union<[funtypes.ParsedValue<funtypes.String, bigint>, funtypes.Literal<"FUNDING">]>;
    to: funtypes.Union<[funtypes.ParsedValue<funtypes.String, bigint>, funtypes.Literal<null>]>;
    value: funtypes.ParsedValue<funtypes.String, bigint>;
    input: funtypes.ParsedValue<funtypes.Union<[funtypes.String, funtypes.Literal<undefined>]>, Uint8Array>;
    chainId: funtypes.ParsedValue<funtypes.String, bigint>;
    gasLimit: funtypes.ParsedValue<funtypes.String, bigint>;
}, true>, funtypes.Partial<{
    type: funtypes.Union<[funtypes.Literal<"1559">, funtypes.Literal<"7702">]>;
    accessList: funtypes.ReadonlyArray<funtypes.Object<{
        address: funtypes.ParsedValue<funtypes.String, bigint>;
        storageKeys: funtypes.ReadonlyArray<funtypes.ParsedValue<funtypes.String, bigint>>;
    }, true>>;
    authorizationList: funtypes.ReadonlyArray<funtypes.Intersect<[funtypes.Object<{
        chainId: funtypes.ParsedValue<funtypes.String, bigint>;
        address: funtypes.ParsedValue<funtypes.String, bigint>;
        nonce: funtypes.ParsedValue<funtypes.String, bigint>;
    }, true>, funtypes.Partial<{
        authority: funtypes.ParsedValue<funtypes.String, bigint>;
        r: funtypes.ParsedValue<funtypes.String, bigint>;
        s: funtypes.ParsedValue<funtypes.String, bigint>;
        yParity: funtypes.Union<[funtypes.ParsedValue<funtypes.Literal<"0x0">, "even">, funtypes.ParsedValue<funtypes.Literal<"0x1">, "odd">]>;
    }, true>]>>;
}, true>]>>;
export type PopulatedTransactionList = funtypes.Static<typeof PopulatedTransactionList>;
export declare const PopulatedTransactionList: funtypes.ReadonlyArray<funtypes.Object<{
    from: funtypes.ParsedValue<funtypes.String, bigint>;
    to: funtypes.Union<[funtypes.ParsedValue<funtypes.String, bigint>, funtypes.Literal<null>]>;
    value: funtypes.ParsedValue<funtypes.String, bigint>;
    input: funtypes.ParsedValue<funtypes.Union<[funtypes.String, funtypes.Literal<undefined>]>, Uint8Array>;
    chainId: funtypes.ParsedValue<funtypes.String, bigint>;
    gasLimit: funtypes.ParsedValue<funtypes.String, bigint>;
    nonce: funtypes.ParsedValue<funtypes.String, bigint>;
    maxFeePerGas: funtypes.ParsedValue<funtypes.String, bigint>;
    maxPriorityFeePerGas: funtypes.ParsedValue<funtypes.String, bigint>;
}, true>>;
export type BouquetNetwork = funtypes.Static<typeof BouquetNetwork>;
export declare const BouquetNetwork: funtypes.Object<{
    chainId: funtypes.ParsedValue<funtypes.String, bigint>;
    networkName: funtypes.String;
    relayMode: funtypes.Union<[funtypes.Literal<"relay">, funtypes.Literal<"mempool">]>;
    mempoolSubmitRpcEndpoint: funtypes.Union<[funtypes.String, funtypes.Literal<undefined>]>;
    mempoolSimulationRpcEndpoint: funtypes.Union<[funtypes.String, funtypes.Literal<undefined>]>;
    blocksInFuture: funtypes.ParsedValue<funtypes.String, bigint>;
    priorityFee: funtypes.ParsedValue<funtypes.String, bigint>;
    blockExplorerApi: funtypes.Union<[funtypes.String, funtypes.Literal<undefined>]>;
    blockExplorer: funtypes.Union<[funtypes.String, funtypes.Literal<undefined>]>;
    simulationRelayEndpoint: funtypes.Union<[funtypes.String, funtypes.Literal<undefined>]>;
    submissionRelayEndpoint: funtypes.Union<[funtypes.String, funtypes.Literal<undefined>]>;
}, false>;
export type BouquetSettings = funtypes.Static<typeof BouquetSettings>;
export declare const BouquetSettings: funtypes.ReadonlyArray<funtypes.Object<{
    chainId: funtypes.ParsedValue<funtypes.String, bigint>;
    networkName: funtypes.String;
    relayMode: funtypes.Union<[funtypes.Literal<"relay">, funtypes.Literal<"mempool">]>;
    mempoolSubmitRpcEndpoint: funtypes.Union<[funtypes.String, funtypes.Literal<undefined>]>;
    mempoolSimulationRpcEndpoint: funtypes.Union<[funtypes.String, funtypes.Literal<undefined>]>;
    blocksInFuture: funtypes.ParsedValue<funtypes.String, bigint>;
    priorityFee: funtypes.ParsedValue<funtypes.String, bigint>;
    blockExplorerApi: funtypes.Union<[funtypes.String, funtypes.Literal<undefined>]>;
    blockExplorer: funtypes.Union<[funtypes.String, funtypes.Literal<undefined>]>;
    simulationRelayEndpoint: funtypes.Union<[funtypes.String, funtypes.Literal<undefined>]>;
    submissionRelayEndpoint: funtypes.Union<[funtypes.String, funtypes.Literal<undefined>]>;
}, false>>;
//# sourceMappingURL=bouquetTypes.d.ts.map