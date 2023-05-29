import * as t from 'funtypes'

const BigIntParser: t.ParsedValue<t.String, bigint>['config'] = {
	parse: (value) => {
		if (!/^0x([a-fA-F0-9]{1,64})$/.test(value))
			return {
				success: false,
				message: `${value} is not a hex string encoded number.`,
			}
		else return { success: true, value: BigInt(value) }
	},
	serialize: (value) => {
		if (typeof value !== 'bigint') return { success: false, message: `${typeof value} is not a bigint.` }
		return { success: true, value: `0x${value.toString(16)}` }
	},
}

export const AddressParser: t.ParsedValue<t.String, bigint>['config'] = {
	parse: (value) => {
		if (!/^0x([a-fA-F0-9]{40})$/.test(value))
			return {
				success: false,
				message: `${value} is not a hex string encoded address.`,
			}
		else return { success: true, value: BigInt(value) }
	},
	serialize: (value) => {
		if (typeof value !== 'bigint') return { success: false, message: `${typeof value} is not a bigint.` }
		return { success: true, value: `0x${value.toString(16).padStart(40, '0')}` }
	},
}

const Bytes32Parser: t.ParsedValue<t.String, bigint>['config'] = {
	parse: (value) => {
		if (!/^0x([a-fA-F0-9]{64})$/.test(value))
			return {
				success: false,
				message: `${value} is not a hex string encoded 32 byte value.`,
			}
		else return { success: true, value: BigInt(value) }
	},
	serialize: (value) => {
		if (typeof value !== 'bigint') return { success: false, message: `${typeof value} is not a bigint.` }
		return { success: true, value: `0x${value.toString(16).padStart(64, '0')}` }
	},
}

const BytesParser: t.ParsedValue<t.String, Uint8Array>['config'] = {
	parse: (value) => {
		const match = /^(?:0x)?([a-fA-F0-9]*)$/.exec(value)
		if (match === null)
			return {
				success: false,
				message: `Expected a hex string encoded byte array with an optional '0x' prefix but received ${value}`,
			}
		const normalized = match[1]
		if (normalized.length % 2)
			return {
				success: false,
				message: `Hex string encoded byte array must be an even number of charcaters long.`,
			}
		const bytes = new Uint8Array(normalized.length / 2)
		for (let i = 0; i < normalized.length; i += 2) {
			bytes[i / 2] = Number.parseInt(`${normalized[i]}${normalized[i + 1]}`, 16)
		}
		return { success: true, value: new Uint8Array(bytes) }
	},
	serialize: (value) => {
		if (!(value instanceof Uint8Array)) return { success: false, message: `${typeof value} is not a Uint8Array.` }
		let result = ''
		for (let i = 0; i < value.length; ++i) {
			result += ('0' + value[i].toString(16)).slice(-2)
		}
		return { success: true, value: `0x${result}` }
	},
}

const OptionalBytesParser: t.ParsedValue<t.Union<[t.String, t.Literal<undefined>]>, Uint8Array>['config'] = {
	parse: (value) => BytesParser.parse(value || '0x'),
	serialize: (value) => BytesParser.serialize!(value || new Uint8Array()),
}

const LiteralConverterParserFactory: <TInput, TOutput>(input: TInput, output: TOutput) => t.ParsedValue<t.Runtype<TInput>, TOutput>['config'] = (
	input,
	output,
) => {
	return {
		parse: (value) => (value === input ? { success: true, value: output } : { success: false, message: `${value} was expected to be literal.` }),
		serialize: (value) => (value === output ? { success: true, value: input } : { success: false, message: `${value} was expected to be literal.` }),
	}
}

export const EthereumQuantity = t.String.withParser(BigIntParser)
export type EthereumQuantity = t.Static<typeof EthereumQuantity>

export const EthereumData = t.String.withParser(BytesParser)
export type EthereumData = t.Static<typeof EthereumData>

export const EthereumAddress = t.String.withParser(AddressParser)
export type EthereumAddress = t.Static<typeof EthereumAddress>

const EthereumBytes32 = t.String.withParser(Bytes32Parser)
type EthereumBytes32 = t.Static<typeof EthereumBytes32>

const EthereumInput = t.Union(t.String, t.Undefined).withParser(OptionalBytesParser)
type EthereumInput = t.Static<typeof EthereumInput>

const EthereumAccessList = t.ReadonlyArray(
	t
		.Object({
			address: EthereumAddress,
			storageKeys: t.ReadonlyArray(EthereumBytes32),
		})
		.asReadonly(),
)
type EthereumAccessList = t.Static<typeof EthereumAccessList>

type EthereumUnsignedTransactionLegacy = t.Static<typeof EthereumUnsignedTransactionLegacy>
const EthereumUnsignedTransactionLegacy = t.Intersect(
	t
		.Object({
			type: t.Union(
				t.Literal('0x0').withParser(LiteralConverterParserFactory('0x0', 'legacy' as const)),
				t.Literal(undefined).withParser(LiteralConverterParserFactory(undefined, 'legacy' as const)),
			),
			from: EthereumAddress,
			nonce: EthereumQuantity,
			gasPrice: EthereumQuantity,
			gas: EthereumQuantity,
			to: t.Union(EthereumAddress, t.Null),
			value: EthereumQuantity,
			input: EthereumInput,
		})
		.asReadonly(),
	t
		.Partial({
			chainId: EthereumQuantity,
		})
		.asReadonly(),
)

type EthereumUnsignedTransaction2930 = t.Static<typeof EthereumUnsignedTransaction2930>
const EthereumUnsignedTransaction2930 = t.Intersect(
	t
		.Object({
			type: t.Literal('0x1').withParser(LiteralConverterParserFactory('0x1', '2930' as const)),
			from: EthereumAddress,
			nonce: EthereumQuantity,
			gasPrice: EthereumQuantity,
			gas: EthereumQuantity,
			to: t.Union(EthereumAddress, t.Null),
			value: EthereumQuantity,
			input: EthereumInput,
			chainId: EthereumQuantity,
		})
		.asReadonly(),
	t.Partial({
		accessList: EthereumAccessList,
	}),
)

type EthereumUnsignedTransaction1559 = t.Static<typeof EthereumUnsignedTransaction1559>
const EthereumUnsignedTransaction1559 = t.Intersect(
	t
		.Object({
			type: t.Literal('0x2').withParser(LiteralConverterParserFactory('0x2', '1559' as const)),
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
		.asReadonly(),
	t.Partial({
		accessList: EthereumAccessList,
	}),
)
type EthereumUnsignedTransaction = t.Static<typeof EthereumUnsignedTransaction>
const EthereumUnsignedTransaction = t.Union(EthereumUnsignedTransactionLegacy, EthereumUnsignedTransaction2930, EthereumUnsignedTransaction1559)

const RevertErrorParser: t.ParsedValue<t.String, string>['config'] = {
	parse: (value) => {
		if (!value.startsWith('Reverted ')) return { success: true, value }
		const parseResult = BytesParser.parse(value.slice('Reverted '.length))
		if (!parseResult.success) return parseResult
		const decoded = new TextDecoder().decode(parseResult.value)
		return { success: true, value: decoded }
	},
	serialize: (value) => {
		const encoded = new TextEncoder().encode(value)
		const serializationResult = BytesParser.serialize!(encoded)
		if (!serializationResult.success) return serializationResult
		return { success: true, value: `Reverted ${serializationResult.value}` }
	},
}

type MulticallResponseEventLog = t.Static<typeof MulticallResponseEventLog>
const MulticallResponseEventLog = t
	.Object({
		loggersAddress: EthereumAddress,
		data: EthereumInput,
		topics: t.ReadonlyArray(EthereumBytes32),
	})
	.asReadonly()

type MulticallResponseEventLogs = t.Static<typeof MulticallResponseEventLogs>
const MulticallResponseEventLogs = t.ReadonlyArray(MulticallResponseEventLog)

type EthBalanceChanges = t.Static<typeof EthBalanceChanges>
const EthBalanceChanges = t.ReadonlyArray(
	t
		.Object({
			address: EthereumAddress,
			before: EthereumQuantity,
			after: EthereumQuantity,
		})
		.asReadonly(),
)

type SingleMulticallResponse = t.Static<typeof SingleMulticallResponse>
const SingleMulticallResponse = t.Union(
	t
		.Object({
			statusCode: t.Literal(1).withParser(LiteralConverterParserFactory(1, 'success' as const)),
			gasSpent: EthereumQuantity,
			returnValue: EthereumData,
			events: MulticallResponseEventLogs,
			balanceChanges: EthBalanceChanges,
		})
		.asReadonly(),
	t
		.Object({
			statusCode: t.Literal(0).withParser(LiteralConverterParserFactory(0, 'failure' as const)),
			gasSpent: EthereumQuantity,
			error: t.String.withParser(RevertErrorParser),
			returnValue: EthereumData,
		})
		.asReadonly(),
)

export type GetSimulationStackReply = t.Static<typeof GetSimulationStackReply>
export const GetSimulationStackReply = t.ReadonlyArray(
	t.Intersect(
		EthereumUnsignedTransaction,
		SingleMulticallResponse,
		t
			.Object({
				realizedGasPrice: EthereumQuantity,
				gasLimit: EthereumQuantity,
			})
			.asReadonly(),
	),
)

export function serialize<T, U extends t.Codec<T>>(funtype: U, value: T) {
	return funtype.serialize(value) as ToWireType<U>
}

export type BouquetTransactionList = t.Static<typeof BouquetTransactionList>
export const BouquetTransactionList = t.Array(
	t.Object({
		from: EthereumAddress,
		to: t.Union(EthereumAddress, t.Null),
		value: EthereumQuantity,
		data: EthereumInput,
		chainId: EthereumQuantity,
	})
)

export type UnionToIntersection<T> = (T extends unknown ? (k: T) => void : never) extends (k: infer I) => void ? I : never

export type ToWireType<T> = T extends t.Intersect<infer U>
	? UnionToIntersection<{ [I in keyof U]: ToWireType<U[I]> }[number]>
	: T extends t.Union<infer U>
	? { [I in keyof U]: ToWireType<U[I]> }[number]
	: T extends t.Record<infer U, infer V>
	? Record<t.Static<U>, ToWireType<V>>
	: T extends t.Partial<infer U, infer V>
	? V extends true
	? { readonly [K in keyof U]?: ToWireType<U[K]> }
	: { [K in keyof U]?: ToWireType<U[K]> }
	: T extends t.Object<infer U, infer V>
	? V extends true
	? { readonly [K in keyof U]: ToWireType<U[K]> }
	: { [K in keyof U]: ToWireType<U[K]> }
	: T extends t.Readonly<t.Tuple<infer U>>
	? { readonly [P in keyof U]: ToWireType<U[P]> }
	: T extends t.Tuple<infer U>
	? { [P in keyof U]: ToWireType<U[P]> }
	: T extends t.ReadonlyArray<infer U>
	? readonly ToWireType<U>[]
	: T extends t.Array<infer U>
	? ToWireType<U>[]
	: T extends t.ParsedValue<infer U, infer _>
	? ToWireType<U>
	: T extends t.Codec<infer U>
	? U
	: never

export type HexString = `0x${string}`
