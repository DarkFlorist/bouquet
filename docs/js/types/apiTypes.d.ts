import * as t from 'funtypes';
export type EtherscanSourceCodeResult = t.Static<typeof EtherscanSourceCodeResult>;
export declare const EtherscanSourceCodeResult: t.Object<{
    status: t.Union<[t.Literal<"1">, t.Literal<"0">]>;
    result: t.ReadonlyTuple<[t.Object<{
        ABI: t.String;
        Proxy: t.Union<[t.Literal<"1">, t.Literal<"0">]>;
        Implementation: t.Union<[t.Literal<"">, t.ParsedValue<t.String, bigint>]>;
    }, false>]>;
}, true>;
export type EtherscanGetABIResult = t.Static<typeof EtherscanGetABIResult>;
export declare const EtherscanGetABIResult: t.Object<{
    status: t.Union<[t.Literal<"1">, t.Literal<"0">]>;
    result: t.String;
}, true>;
export type SourcifyMetadataResult = t.Static<typeof SourcifyMetadataResult>;
export declare const SourcifyMetadataResult: t.Object<{
    compiler: t.Unknown;
    language: t.Unknown;
    output: t.Object<{
        abi: t.Array<t.Unknown>;
    }, false>;
    settings: t.Unknown;
    sources: t.Unknown;
    version: t.Unknown;
}, true>;
//# sourceMappingURL=apiTypes.d.ts.map