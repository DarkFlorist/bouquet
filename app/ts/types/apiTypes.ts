import * as t from 'funtypes'
import { EthereumAddress } from './ethereumTypes'

// Not full result definition, only entries that we consume
// https://docs.etherscan.io/api-endpoints/contracts#get-contract-source-code-for-verified-contract-source-codes
export type EtherscanSourceCodeResult = t.Static<typeof EtherscanSourceCodeResult>
export const EtherscanSourceCodeResult = t.Object({
	status: t.Union(t.Literal('1'), t.Literal('0')),
	result: t.ReadonlyArray(t.Object({
		ABI: t.String,
		Proxy: t.Union(t.Literal('1'), t.Literal('0')),
		Implementation: t.Union(t.Literal(''), EthereumAddress)
	}).asReadonly())
}).asReadonly().withConstraint(x => x.result.length === 1)


// Not full result definition, only entries that we consume
// https://docs.etherscan.io/api-endpoints/contracts#get-contract-abi-for-verified-contract-source-codes
export type EtherscanGetABIResult = t.Static<typeof EtherscanGetABIResult>
export const EtherscanGetABIResult = t.Object({
	status: t.Union(t.Literal('1'), t.Literal('0')),
	result: t.String
}).asReadonly()

