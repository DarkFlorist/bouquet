import * as t from 'funtypes';
const BigIntParser = {
    parse: (value) => {
        if (!/^0x([a-fA-F0-9]{1,64})$/.test(value))
            return {
                success: false,
                message: `${value} is not a hex string encoded number.`,
            };
        else
            return { success: true, value: BigInt(value) };
    },
    serialize: (value) => {
        if (typeof value !== 'bigint')
            return { success: false, message: `${typeof value} is not a bigint.` };
        return { success: true, value: `0x${value.toString(16)}` };
    },
};
export const AddressParser = {
    parse: (value) => {
        if (!/^0x([a-fA-F0-9]{40})$/.test(value))
            return {
                success: false,
                message: `${value} is not a hex string encoded address.`,
            };
        else
            return { success: true, value: BigInt(value) };
    },
    serialize: (value) => {
        if (typeof value !== 'bigint')
            return { success: false, message: `${typeof value} is not a bigint.` };
        return { success: true, value: `0x${value.toString(16).padStart(40, '0')}` };
    },
};
const Bytes32Parser = {
    parse: (value) => {
        if (!/^0x([a-fA-F0-9]{64})$/.test(value))
            return {
                success: false,
                message: `${value} is not a hex string encoded 32 byte value.`,
            };
        else
            return { success: true, value: BigInt(value) };
    },
    serialize: (value) => {
        if (typeof value !== 'bigint')
            return { success: false, message: `${typeof value} is not a bigint.` };
        return { success: true, value: `0x${value.toString(16).padStart(64, '0')}` };
    },
};
const BytesParser = {
    parse: (value) => {
        const match = /^(?:0x)?([a-fA-F0-9]*)$/.exec(value);
        if (match === null)
            return {
                success: false,
                message: `Expected a hex string encoded byte array with an optional '0x' prefix but received ${value}`,
            };
        const normalized = match[1];
        if (normalized.length % 2)
            return {
                success: false,
                message: `Hex string encoded byte array must be an even number of charcaters long.`,
            };
        const bytes = new Uint8Array(normalized.length / 2);
        for (let i = 0; i < normalized.length; i += 2) {
            bytes[i / 2] = Number.parseInt(`${normalized[i]}${normalized[i + 1]}`, 16);
        }
        return { success: true, value: new Uint8Array(bytes) };
    },
    serialize: (value) => {
        if (!(value instanceof Uint8Array))
            return { success: false, message: `${typeof value} is not a Uint8Array.` };
        let result = '';
        for (let i = 0; i < value.length; ++i) {
            result += ('0' + value[i].toString(16)).slice(-2);
        }
        return { success: true, value: `0x${result}` };
    },
};
const OptionalBytesParser = {
    parse: (value) => BytesParser.parse(value || '0x'),
    serialize: (value) => BytesParser.serialize(value || new Uint8Array()),
};
const LiteralConverterParserFactory = (input, output) => {
    return {
        parse: (value) => (value === input ? { success: true, value: output } : { success: false, message: `${value} was expected to be literal.` }),
        serialize: (value) => (value === output ? { success: true, value: input } : { success: false, message: `${value} was expected to be literal.` }),
    };
};
export const EthereumQuantity = t.String.withParser(BigIntParser);
export const EthereumData = t.String.withParser(BytesParser);
export const EthereumAddress = t.String.withParser(AddressParser);
const EthereumBytes32 = t.String.withParser(Bytes32Parser);
const EthereumInput = t.Union(t.String, t.Undefined).withParser(OptionalBytesParser);
const EthereumAccessList = t.ReadonlyArray(t
    .Object({
    address: EthereumAddress,
    storageKeys: t.ReadonlyArray(EthereumBytes32),
})
    .asReadonly());
const EthereumUnsignedTransactionLegacy = t.Intersect(t
    .Object({
    type: t.Union(t.Literal('0x0').withParser(LiteralConverterParserFactory('0x0', 'legacy')), t.Literal(undefined).withParser(LiteralConverterParserFactory(undefined, 'legacy'))),
    from: EthereumAddress,
    nonce: EthereumQuantity,
    gasPrice: EthereumQuantity,
    gas: EthereumQuantity,
    to: t.Union(EthereumAddress, t.Null),
    value: EthereumQuantity,
    input: EthereumInput,
})
    .asReadonly(), t
    .Partial({
    chainId: EthereumQuantity,
})
    .asReadonly());
const EthereumUnsignedTransaction2930 = t.Intersect(t
    .Object({
    type: t.Literal('0x1').withParser(LiteralConverterParserFactory('0x1', '2930')),
    from: EthereumAddress,
    nonce: EthereumQuantity,
    gasPrice: EthereumQuantity,
    gas: EthereumQuantity,
    to: t.Union(EthereumAddress, t.Null),
    value: EthereumQuantity,
    input: EthereumInput,
    chainId: EthereumQuantity,
})
    .asReadonly(), t.Partial({
    accessList: EthereumAccessList,
}));
const EthereumUnsignedTransaction1559 = t.Intersect(t
    .Object({
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
})
    .asReadonly(), t.Partial({
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
    },
};
const MulticallResponseEventLog = t
    .Object({
    loggersAddress: EthereumAddress,
    data: EthereumInput,
    topics: t.ReadonlyArray(EthereumBytes32),
})
    .asReadonly();
const MulticallResponseEventLogs = t.ReadonlyArray(MulticallResponseEventLog);
const EthBalanceChanges = t.ReadonlyArray(t
    .Object({
    address: EthereumAddress,
    before: EthereumQuantity,
    after: EthereumQuantity,
})
    .asReadonly());
const SingleMulticallResponse = t.Union(t
    .Object({
    statusCode: t.Literal(1).withParser(LiteralConverterParserFactory(1, 'success')),
    gasSpent: EthereumQuantity,
    returnValue: EthereumData,
    events: MulticallResponseEventLogs,
    balanceChanges: EthBalanceChanges,
})
    .asReadonly(), t
    .Object({
    statusCode: t.Literal(0).withParser(LiteralConverterParserFactory(0, 'failure')),
    gasSpent: EthereumQuantity,
    error: t.String.withParser(RevertErrorParser),
    returnValue: EthereumData,
})
    .asReadonly());
export const GetSimulationStackReply = t.ReadonlyArray(t.Intersect(EthereumUnsignedTransaction, SingleMulticallResponse, t
    .Object({
    realizedGasPrice: EthereumQuantity,
    gasLimit: EthereumQuantity,
})
    .asReadonly()));
export function serialize(funtype, value) {
    return funtype.serialize(value);
}
//# sourceMappingURL=interceptor-types.js.map