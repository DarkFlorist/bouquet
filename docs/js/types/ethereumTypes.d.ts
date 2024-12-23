import * as t from 'funtypes';
export declare const AddressParser: t.ParsedValue<t.String, bigint>['config'];
export declare const BytesParser: t.ParsedValue<t.String, Uint8Array>['config'];
export declare const LiteralConverterParserFactory: <TInput, TOutput>(input: TInput, output: TOutput) => t.ParsedValue<t.Runtype<TInput>, TOutput>['config'];
export declare const EthereumQuantity: t.ParsedValue<t.String, bigint>;
export type EthereumQuantity = t.Static<typeof EthereumQuantity>;
export declare const EthereumData: t.ParsedValue<t.String, Uint8Array>;
export type EthereumData = t.Static<typeof EthereumData>;
export declare const EthereumAddress: t.ParsedValue<t.String, bigint>;
export type EthereumAddress = t.Static<typeof EthereumAddress>;
export declare const EthereumBytes32: t.ParsedValue<t.String, bigint>;
export type EthereumBytes32 = t.Static<typeof EthereumBytes32>;
export declare const EthereumInput: t.ParsedValue<t.Union<[t.String, t.Literal<undefined>]>, Uint8Array>;
export type EthereumInput = t.Static<typeof EthereumInput>;
export declare const EthereumQuantitySmall: t.ParsedValue<t.String, bigint>;
export type EthereumQuantitySmall = t.Static<typeof EthereumQuantitySmall>;
export declare const EthereumTimestamp: t.ParsedValue<t.String, Date>;
export type EthereumTimestamp = t.Static<typeof EthereumTimestamp>;
export declare const EthereumAccessList: t.ReadonlyArray<t.Object<{
    address: t.ParsedValue<t.String, bigint>;
    storageKeys: t.ReadonlyArray<t.ParsedValue<t.String, bigint>>;
}, true>>;
export type EthereumAccessList = t.Static<typeof EthereumAccessList>;
export declare const EthereumBlockTag: t.Union<[t.ParsedValue<t.String, bigint>, t.ParsedValue<t.String, bigint>, t.Literal<"latest">, t.Literal<"pending">]>;
export type EthereumBlockTag = t.Static<typeof EthereumBlockTag>;
export type UnionToIntersection<T> = (T extends unknown ? (k: T) => void : never) extends (k: infer I) => void ? I : never;
type ToWireType<T> = T extends t.Intersect<infer U> ? UnionToIntersection<{
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
export declare function serialize<T, U extends t.Codec<T>>(funtype: U, value: T): ToWireType<U>;
export {};
//# sourceMappingURL=ethereumTypes.d.ts.map