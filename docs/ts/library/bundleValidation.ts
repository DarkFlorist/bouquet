import { getAddress } from 'ethers'
import { Bundle } from '../types/types.js'
import { isClearDelegationTransaction } from './bundle.js'
import { addressString } from './utils.js'

export const validateBundle = (bundle: Bundle): string | undefined => {
	if (bundle.rescueMode && !isClearDelegationTransaction(bundle.transactions[0])) return 'The delegation-clearing transaction must be first.'
	for (const transaction of bundle.transactions) {
		if (transaction.type !== '7702') continue
		if ((transaction.authorizationList ?? []).length === 0) return 'An EIP-7702 transaction must include at least one authorization.'
		for (const authorization of transaction.authorizationList ?? []) {
			const signatureParts = [authorization.r, authorization.s, authorization.yParity].filter((part) => part !== undefined).length
			if (signatureParts !== 0 && signatureParts !== 3) return 'An EIP-7702 authorization has an incomplete signature.'
			if (signatureParts === 0 && authorization.authority === undefined) return 'An unsigned EIP-7702 authorization is missing its authority.'
			if (authorization.chainId !== 0n && authorization.chainId !== transaction.chainId) return 'An EIP-7702 authorization has the wrong chain ID.'
			if (authorization.authority !== undefined) {
				try {
					getAddress(addressString(authorization.authority))
				} catch {
					return 'An EIP-7702 authorization has an invalid authority.'
				}
			}
		}
	}
	return undefined
}
