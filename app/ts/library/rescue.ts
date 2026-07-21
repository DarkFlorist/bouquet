import { getAddress } from 'ethers'
import { Eip7702Authorization, TransactionList } from '../types/bouquetTypes.js'
import { Bundle } from '../types/types.js'
import { addressString } from './utils.js'

export type ClearDelegationTransactionInput = {
	sponsor: string
	authority: string
	chainId: bigint
	authorizationNonce: bigint
}

const hasCompleteSignature = (authorization: Eip7702Authorization) =>
	authorization.r !== undefined && authorization.s !== undefined && authorization.yParity !== undefined

export const isClearDelegationTransaction = (transaction: TransactionList[number]) =>
	transaction.type === '7702' && (transaction.authorizationList ?? []).some((authorization) => authorization.address === 0n)

export const createClearDelegationTransaction = ({ sponsor, authority, chainId, authorizationNonce }: ClearDelegationTransactionInput): TransactionList[number] => {
	const sponsorAddress = getAddress(sponsor)
	const authorityAddress = getAddress(authority)
	if (sponsorAddress === authorityAddress) throw new Error('The clean sponsor must be different from the compromised account.')
	if (chainId <= 0n) throw new Error('The rescue transaction needs a valid chain ID.')
	if (authorizationNonce < 0n) throw new Error('The authorization nonce cannot be negative.')
	return {
		from: BigInt(sponsorAddress),
		to: BigInt(sponsorAddress),
		value: 0n,
		input: new Uint8Array(),
		chainId,
		gasLimit: 100_000n,
		type: '7702',
		accessList: [],
		authorizationList: [{
			chainId,
			address: 0n,
			nonce: authorizationNonce,
			authority: BigInt(authorityAddress),
		}],
	}
}

export const orderRescueTransactions = (transactions: TransactionList): TransactionList => [
	...transactions.filter(isClearDelegationTransaction),
	...transactions.filter((transaction) => transaction.from === 'FUNDING'),
	...transactions.filter((transaction) => transaction.from !== 'FUNDING' && !isClearDelegationTransaction(transaction)),
]

export const createBundle = (transactions: TransactionList): Bundle => {
	const orderedTransactions = orderRescueTransactions(transactions)
	const signerAddresses = new Set<string>()
	for (const transaction of orderedTransactions) {
		if (transaction.from !== 'FUNDING') signerAddresses.add(addressString(transaction.from))
		if (transaction.type !== '7702') continue
		for (const authorization of transaction.authorizationList ?? []) {
			if (!hasCompleteSignature(authorization) && authorization.authority !== undefined) {
				signerAddresses.add(addressString(authorization.authority))
			}
		}
	}
	return {
		transactions: orderedTransactions,
		containsFundingTx: orderedTransactions.some((transaction) => transaction.from === 'FUNDING'),
		rescueMode: orderedTransactions.some(isClearDelegationTransaction),
		totalGas: orderedTransactions.reduce((sum, transaction) => sum + transaction.gasLimit, 0n),
		inputValue: orderedTransactions.reduce((sum, transaction) => transaction.from === 'FUNDING' ? sum + transaction.value : sum, 0n),
		uniqueSigners: [...signerAddresses],
	}
}

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
