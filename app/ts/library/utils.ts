import { getAddress } from 'ethers'
import { EthereumAddress } from '../types/ethereumTypes.js'
import { serialize } from '../types/types.js'

export function addressString(address: bigint): string {
	return getAddress(serialize(EthereumAddress, address))
}

export const min = (left: bigint, right: bigint) => left < right ? left : right
