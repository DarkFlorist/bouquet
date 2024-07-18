import * as t from 'funtypes';
import { EthereumAddress, EthereumQuantity, EthereumData, EthereumBytes32, LiteralConverterParserFactory, EthereumInput, BytesParser } from './ethereumTypes.js';
const EthereumAccessList = t.ReadonlyArray(t
    .Object({
    address: EthereumAddress,
    storageKeys: t.ReadonlyArray(EthereumBytes32),
})
    .asReadonly());
const EthereumUnsignedTransactionLegacy = t.Intersect(t.Object({
    type: t.Union(t.Literal('0x0').withParser(LiteralConverterParserFactory('0x0', 'legacy')), t.Literal(undefined).withParser(LiteralConverterParserFactory(undefined, 'legacy'))),
    from: EthereumAddress,
    nonce: EthereumQuantity,
    gasPrice: EthereumQuantity,
    gas: EthereumQuantity,
    to: t.Union(EthereumAddress, t.Null),
    value: EthereumQuantity,
    input: EthereumInput,
}).asReadonly(), t.Partial({
    chainId: EthereumQuantity,
}).asReadonly());
const EthereumUnsignedTransaction2930 = t.Intersect(t.Object({
    type: t.Literal('0x1').withParser(LiteralConverterParserFactory('0x1', '2930')),
    from: EthereumAddress,
    nonce: EthereumQuantity,
    gasPrice: EthereumQuantity,
    gas: EthereumQuantity,
    to: t.Union(EthereumAddress, t.Null),
    value: EthereumQuantity,
    input: EthereumInput,
    chainId: EthereumQuantity,
}).asReadonly(), t.Partial({
    accessList: EthereumAccessList,
}));
const EthereumUnsignedTransaction1559 = t.Intersect(t.Object({
    type: t.Literal('0x2').withParser(LiteralConverterParserFactory('0x2', '1559')),
    from: EthereumAddress,
    nonce: EthereumQuantity,
    maxFeePerGas: EthereumQuantity,
    maxPriorityFeePerGas: EthereumQuantity,
    gas: EthereumQuantity,
    to: t.Union(EthereumAddress, t.Null),
    value: EthereumQuantity,
    input: EthereumInput,
    chainId: EthereumQuantity,
}).asReadonly(), t.Partial({
    accessList: EthereumAccessList,
}));
const EthereumUnsignedTransaction = t.Union(EthereumUnsignedTransactionLegacy, EthereumUnsignedTransaction2930, EthereumUnsignedTransaction1559);
const RevertErrorParser = {
    parse: (value) => {
        if (!value.startsWith('Reverted '))
            return { success: true, value };
        const parseResult = BytesParser.parse(value.slice('Reverted '.length));
        if (!parseResult.success)
            return parseResult;
        const decoded = new TextDecoder().decode(parseResult.value);
        return { success: true, value: decoded };
    },
    serialize: (value) => {
        const encoded = new TextEncoder().encode(value);
        const serializationResult = BytesParser.serialize(encoded);
        if (!serializationResult.success)
            return serializationResult;
        return { success: true, value: `Reverted ${serializationResult.value}` };
    }
};
const MulticallResponseEventLog = t.Object({
    loggersAddress: EthereumAddress,
    data: EthereumInput,
    topics: t.ReadonlyArray(EthereumBytes32),
}).asReadonly();
const MulticallResponseEventLogs = t.ReadonlyArray(MulticallResponseEventLog);
const EthBalanceChanges = t.ReadonlyArray(t.Object({
    address: EthereumAddress,
    before: EthereumQuantity,
    after: EthereumQuantity,
}).asReadonly());
const SingleMulticallResponse = t.Union(t.Object({
    statusCode: t.Literal(1).withParser(LiteralConverterParserFactory(1, 'success')),
    gasSpent: EthereumQuantity,
    returnValue: EthereumData,
    events: MulticallResponseEventLogs,
    balanceChanges: EthBalanceChanges,
}).asReadonly(), t.Object({
    statusCode: t.Literal(0).withParser(LiteralConverterParserFactory(0, 'failure')),
    gasSpent: EthereumQuantity,
    error: t.String.withParser(RevertErrorParser),
    returnValue: EthereumData,
}).asReadonly());
export const GetSimulationStackReply = t.ReadonlyArray(t.Intersect(EthereumUnsignedTransaction, SingleMulticallResponse, t.Object({
    realizedGasPrice: EthereumQuantity,
    gasLimit: EthereumQuantity,
    maxPriorityFeePerGas: EthereumQuantity,
    balanceChanges: EthBalanceChanges
}).asReadonly()));
//# sourceMappingURL=interceptorTypes.js.map