import * as t from 'funtypes'
import { EthereumAddress, EthereumQuantity, EthereumData, EthereumBytes32, LiteralConverterParserFactory, EthereumInput, BytesParser } from './ethereumTypes.js'

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
	t.Object({
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
	}).asReadonly(),
	t.Partial({
		chainId: EthereumQuantity,
	}).asReadonly()
)

type EthereumUnsignedTransaction2930 = t.Static<typeof EthereumUnsignedTransaction2930>
const EthereumUnsignedTransaction2930 = t.Intersect(
	t.Object({
		type: t.Literal('0x1').withParser(LiteralConverterParserFactory('0x1', '2930' as const)),
		from: EthereumAddress,
		nonce: EthereumQuantity,
		gasPrice: EthereumQuantity,
		gas: EthereumQuantity,
		to: t.Union(EthereumAddress, t.Null),
		value: EthereumQuantity,
		input: EthereumInput,
		chainId: EthereumQuantity,
	}).asReadonly(),
	t.Partial({
		accessList: EthereumAccessList,
	})
)

type EthereumUnsignedTransaction1559 = t.Static<typeof EthereumUnsignedTransaction1559>
const EthereumUnsignedTransaction1559 = t.Intersect(
	t.Object({
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
	}).asReadonly(),
	t.Partial({
		accessList: EthereumAccessList,
	})
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
	}
}

type MulticallResponseEventLog = t.Static<typeof MulticallResponseEventLog>
const MulticallResponseEventLog = t.Object({
	loggersAddress: EthereumAddress,
	data: EthereumInput,
	topics: t.ReadonlyArray(EthereumBytes32),
}).asReadonly()

type MulticallResponseEventLogs = t.Static<typeof MulticallResponseEventLogs>
const MulticallResponseEventLogs = t.ReadonlyArray(MulticallResponseEventLog)

type EthBalanceChanges = t.Static<typeof EthBalanceChanges>
const EthBalanceChanges = t.ReadonlyArray(
	t.Object({
		address: EthereumAddress,
		before: EthereumQuantity,
		after: EthereumQuantity,
	}).asReadonly()
)

type SingleMulticallResponse = t.Static<typeof SingleMulticallResponse>
const SingleMulticallResponse = t.Union(
	t.Object({
		statusCode: t.Literal(1).withParser(LiteralConverterParserFactory(1, 'success' as const)),
		gasSpent: EthereumQuantity,
		returnValue: EthereumData,
		events: MulticallResponseEventLogs,
		balanceChanges: EthBalanceChanges,
	}).asReadonly(),
	t.Object({
		statusCode: t.Literal(0).withParser(LiteralConverterParserFactory(0, 'failure' as const)),
		gasSpent: EthereumQuantity,
		error: t.String.withParser(RevertErrorParser),
		returnValue: EthereumData,
	}).asReadonly()
)

export type GetSimulationStackReply = t.Static<typeof GetSimulationStackReply>
export const GetSimulationStackReply = t.ReadonlyArray(
	t.Intersect(
		EthereumUnsignedTransaction,
		SingleMulticallResponse,
		t.Object({
			realizedGasPrice: EthereumQuantity,
			gasLimit: EthereumQuantity,
		}).asReadonly()
	)
)
