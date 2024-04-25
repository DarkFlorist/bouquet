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
//# sourceMappingURL=ethereumTypes.d.ts.map