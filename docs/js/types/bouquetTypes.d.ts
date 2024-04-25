import * as t from 'funtypes';
export type TransactionList = t.Static<typeof TransactionList>;
export declare const TransactionList: t.ReadonlyArray<t.Object<{
    from: t.Union<[t.ParsedValue<t.String, bigint>, t.Literal<"FUNDING">]>;
    to: t.Union<[t.ParsedValue<t.String, bigint>, t.Literal<null>]>;
    value: t.ParsedValue<t.String, bigint>;
    input: t.ParsedValue<t.Union<[t.String, t.Literal<undefined>]>, Uint8Array>;
    chainId: t.ParsedValue<t.String, bigint>;
    gasLimit: t.ParsedValue<t.String, bigint>;
}, true>>;
export type PopulatedTransactionList = t.Static<typeof PopulatedTransactionList>;
export declare const PopulatedTransactionList: t.ReadonlyArray<t.Object<{
    from: t.ParsedValue<t.String, bigint>;
    to: t.Union<[t.ParsedValue<t.String, bigint>, t.Literal<null>]>;
    value: t.ParsedValue<t.String, bigint>;
    input: t.ParsedValue<t.Union<[t.String, t.Literal<undefined>]>, Uint8Array>;
    chainId: t.ParsedValue<t.String, bigint>;
    gasLimit: t.ParsedValue<t.String, bigint>;
    nonce: t.ParsedValue<t.String, bigint>;
    maxFeePerGas: t.ParsedValue<t.String, bigint>;
    maxPriorityFeePerGas: t.ParsedValue<t.String, bigint>;
}, true>>;
//# sourceMappingURL=bouquetTypes.d.ts.map