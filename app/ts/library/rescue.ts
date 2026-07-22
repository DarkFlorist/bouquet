import { getAddress, type Provider } from 'ethers'
import { TransactionList } from '../types/bouquetTypes.js'
import { Bundle } from '../types/types.js'
import { addressString } from './utils.js'
import { createBundle, isClearDelegationTransaction } from './bundle.js'

export type ClearDelegationTransactionInput = {
	authority: string
	chainId: bigint
}

const EIP_7702_DELEGATION_PREFIX = '0xef0100'

export const parseEip7702DelegationTarget = (code: string): string | undefined => {
	if (!/^0xef0100[0-9a-f]{40}$/i.test(code)) return undefined
	return getAddress(`0x${code.slice(EIP_7702_DELEGATION_PREFIX.length)}`)
}

export const getActiveEip7702DelegationTarget = async (provider: Pick<Provider, 'getCode'>, authority: string): Promise<string | undefined> => {
	const code = await provider.getCode(getAddress(authority), 'latest')
	return parseEip7702DelegationTarget(code)
}

export { isClearDelegationTransaction } from './bundle.js'

export const createClearDelegationTransaction = ({ authority, chainId }: ClearDelegationTransactionInput): TransactionList[number] => {
	const authorityAddress = getAddress(authority)
	if (chainId <= 0n) throw new Error('The rescue transaction needs a valid chain ID.')
	return {
		from: 'FUNDING',
		to: null,
		value: 0n,
		input: new Uint8Array(),
		chainId,
		gasLimit: 100_000n,
		type: '7702',
		accessList: [],
		authorizationList: [{
			chainId,
			address: 0n,
			// This placeholder is refreshed from the connected provider immediately before every simulation and submission.
			nonce: 0n,
			authority: BigInt(authorityAddress),
		}],
	}
}

export const orderRescueTransactions = (transactions: TransactionList): TransactionList => [
	...transactions.filter(isClearDelegationTransaction),
	...transactions.filter((transaction) => transaction.from === 'FUNDING' && !isClearDelegationTransaction(transaction)),
	...transactions.filter((transaction) => transaction.from !== 'FUNDING' && !isClearDelegationTransaction(transaction)),
]

export const createRescueBundle = (transactions: TransactionList): Bundle => createBundle(orderRescueTransactions(transactions))

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
