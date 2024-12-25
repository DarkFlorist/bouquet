import { getAddress } from 'ethers'
import { EthereumAddress } from '../types/ethereumTypes.js'
import { serialize } from '../types/types.js'

export function addressString(address: bigint): string {
	return getAddress(serialize(EthereumAddress, address))
}

export const min = (left: bigint, right: bigint) => left < right ? left : right

function bigintToUint8Array(value: bigint, numberOfBytes: number) {
	if (typeof value === 'number') value = BigInt(value)
	if (value >= 2n ** BigInt(numberOfBytes * 8) || value < 0n) throw new Error(`Cannot fit ${ value } into a ${ numberOfBytes }-byte unsigned integer.`)
	const result = new Uint8Array(numberOfBytes)
	for (let i = 0; i < result.length; ++i) {
		result[i] = Number((value >> BigInt(numberOfBytes - i - 1) * 8n) & 0xffn)
	}
	return result
}

export function stringToUint8Array(data: string) {
	const dataLength = (data.length - 2) / 2
	if (dataLength === 0) return new Uint8Array()
	return bigintToUint8Array(BigInt(data), dataLength)
}
