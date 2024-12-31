import * as t from 'funtypes';
import { EthereumAddress } from './ethereumTypes.js';
export const EtherscanSourceCodeResult = t.Object({
    status: t.Union(t.Literal('1'), t.Literal('0')),
    result: t.ReadonlyTuple(t.Object({
        ABI: t.String,
        Proxy: t.Union(t.Literal('1'), t.Literal('0')),
        Implementation: t.Union(t.Literal(''), EthereumAddress)
    }))
}).asReadonly();
export const EtherscanGetABIResult = t.Object({
    status: t.Union(t.Literal('1'), t.Literal('0')),
    result: t.String
}).asReadonly();
export const SourcifyMetadataResult = t.Object({
    compiler: t.Unknown,
    language: t.Unknown,
    output: t.Object({
        abi: t.Array(t.Unknown)
    }),
    settings: t.Unknown,
    sources: t.Unknown,
    version: t.Unknown,
}).asReadonly();
//# sourceMappingURL=apiTypes.js.map