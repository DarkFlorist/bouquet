import * as t from 'funtypes';
export declare const AddressParser: t.ParsedValue<t.String, bigint>['config'];
export declare const EthereumQuantity: t.ParsedValue<t.String, bigint>;
export type EthereumQuantity = t.Static<typeof EthereumQuantity>;
export declare const EthereumData: t.ParsedValue<t.String, Uint8Array>;
export type EthereumData = t.Static<typeof EthereumData>;
export declare const EthereumAddress: t.ParsedValue<t.String, bigint>;
export type EthereumAddress = t.Static<typeof EthereumAddress>;
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
}, true>]>>;
export declare function serialize<T, U extends t.Codec<T>>(funtype: U, value: T): ToWireType<U>;
export type UnionToIntersection<T> = (T extends unknown ? (k: T) => void : never) extends (k: infer I) => void ? I : never;
export type ToWireType<T> = T extends t.Intersect<infer U> ? UnionToIntersection<{
    [I in keyof U]: ToWireType<U[I]>;
}[number]> : T extends t.Union<infer U> ? {
    [I in keyof U]: ToWireType<U[I]>;
}[number] : T extends t.Record<infer U, infer V> ? Record<t.Static<U>, ToWireType<V>> : T extends t.Partial<infer U, infer V> ? V extends true ? {
    readonly [K in keyof U]?: ToWireType<U[K]>;
} : {
    [K in keyof U]?: ToWireType<U[K]>;
} : T extends t.Object<infer U, infer V> ? V extends true ? {
    readonly [K in keyof U]: ToWireType<U[K]>;
} : {
    [K in keyof U]: ToWireType<U[K]>;
} : T extends t.Readonly<t.Tuple<infer U>> ? {
    readonly [P in keyof U]: ToWireType<U[P]>;
} : T extends t.Tuple<infer U> ? {
    [P in keyof U]: ToWireType<U[P]>;
} : T extends t.ReadonlyArray<infer U> ? readonly ToWireType<U>[] : T extends t.Array<infer U> ? ToWireType<U>[] : T extends t.ParsedValue<infer U, infer _> ? ToWireType<U> : T extends t.Codec<infer U> ? U : never;
export type HexString = `0x${string}`;
//# sourceMappingURL=interceptor-types.d.ts.map