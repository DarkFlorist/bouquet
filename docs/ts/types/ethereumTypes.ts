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

export const BytesParser: t.ParsedValue<t.String, Uint8Array>['config'] = {
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

export const LiteralConverterParserFactory: <TInput, TOutput>(input: TInput, output: TOutput) => t.ParsedValue<t.Runtype<TInput>, TOutput>['config'] = (
	input,
	output,
) => {
	return {
		parse: (value) => (value === input ? { success: true, value: output } : { success: false, message: `${value} was expected to be literal.` }),
		serialize: (value) => (value === output ? { success: true, value: input } : { success: false, message: `${value} was expected to be literal.` }),
	}
}

const SmallIntParser: t.ParsedValue<t.String, bigint>['config'] = {
	parse: value => {
		if (!/^0x([a-fA-F0-9]{1,64})$/.test(value)) return { success: false, message: `${value} is not a hex string encoded number.` }
		if (BigInt(value) >= 2n**64n) return { success: false, message: `${value} must be smaller than 2^64.` }
		return { success: true, value: BigInt(value) }
	},
	serialize: value => {
		if (value >= 2n**64n) return { success: false, message: `${value} must be smaller than 2^64.` }
		if (typeof value !== 'bigint') return { success: false, message: `${typeof value} is not a bigint.`}
		return { success: true, value: `0x${value.toString(16)}` }
	},
}

const TimestampParser: t.ParsedValue<t.String, Date>['config'] = {
	parse: value => {
		if (!/^0x([a-fA-F0-9]{0,8})$/.test(value)) return { success: false, message: `${value} is not a hex string encoded timestamp.` }
		return { success: true, value: new Date(Number.parseInt(value, 16) * 1000) }
	},
	serialize: value => {
		if (!(value instanceof Date)) return { success: false, message: `${typeof value} is not a Date.`}
		return { success: true, value: `0x${Math.floor(value.valueOf() / 1000).toString(16)}` }
	},
}

export const EthereumQuantity = t.String.withParser(BigIntParser)
export type EthereumQuantity = t.Static<typeof EthereumQuantity>

export const EthereumData = t.String.withParser(BytesParser)
export type EthereumData = t.Static<typeof EthereumData>

export const EthereumAddress = t.String.withParser(AddressParser)
export type EthereumAddress = t.Static<typeof EthereumAddress>

export const EthereumBytes32 = t.String.withParser(Bytes32Parser)
export type EthereumBytes32 = t.Static<typeof EthereumBytes32>

export const EthereumInput = t.Union(t.String, t.Undefined).withParser(OptionalBytesParser)
export type EthereumInput = t.Static<typeof EthereumInput>

export const EthereumQuantitySmall = t.String.withParser(SmallIntParser)
export type EthereumQuantitySmall = t.Static<typeof EthereumQuantitySmall>

export const EthereumTimestamp = t.String.withParser(TimestampParser)
export type EthereumTimestamp = t.Static<typeof EthereumTimestamp>

export const EthereumAccessList = t.ReadonlyArray(
	t.ReadonlyObject({
		address: EthereumAddress,
		storageKeys: t.ReadonlyArray(EthereumBytes32)
	}).asReadonly()
)
export type EthereumAccessList = t.Static<typeof EthereumAccessList>

export const EthereumBlockTag = t.Union(EthereumQuantitySmall, EthereumBytes32, t.Literal('latest'), t.Literal('pending'))
export type EthereumBlockTag = t.Static<typeof EthereumBlockTag>

export type UnionToIntersection<T> = (T extends unknown ? (k: T) => void : never) extends (k: infer I) => void ? I : never

type ToWireType<T> =
	T extends t.Intersect<infer U> ? UnionToIntersection<{ [I in keyof U]: ToWireType<U[I]> }[number]>
	: T extends t.Union<infer U> ? { [I in keyof U]: ToWireType<U[I]> }[number]
	: T extends t.Record<infer U, infer V> ? Record<t.Static<U>, ToWireType<V>>
	: T extends t.Partial<infer U, infer V> ? V extends true ? { readonly [K in keyof U]?: ToWireType<U[K]> } : { [K in keyof U]?: ToWireType<U[K]> }
	: T extends t.Object<infer U, infer V> ? V extends true ? { readonly [K in keyof U]: ToWireType<U[K]> } : { [K in keyof U]: ToWireType<U[K]> }
	: T extends t.Readonly<t.Tuple<infer U>> ? { readonly [P in keyof U]: ToWireType<U[P]>}
	: T extends t.Tuple<infer U> ? { [P in keyof U]: ToWireType<U[P]>}
	: T extends t.ReadonlyArray<infer U> ? readonly ToWireType<U>[]
	: T extends t.Array<infer U> ? ToWireType<U>[]
	: T extends t.ParsedValue<infer U, infer _> ? ToWireType<U>
	: T extends t.Codec<infer U> ? U
	: never

export function serialize<T, U extends t.Codec<T>>(funtype: U, value: T) {
	return funtype.serialize(value) as ToWireType<U>
}
