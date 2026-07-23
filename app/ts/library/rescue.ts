import { getAddress, type Provider } from 'ethers'
import { TransactionList } from '../types/bouquetTypes.js'
import { Bundle } from '../types/types.js'
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

const addRescueFundingTransaction = (transactions: TransactionList, authority: bigint, chainId: bigint): TransactionList => {
	if (transactions.some((transaction) => transaction.from === 'FUNDING' && !isClearDelegationTransaction(transaction))) return transactions
	return [...transactions, {
		from: 'FUNDING',
		to: authority,
		value: 0n,
		input: new Uint8Array(),
		chainId,
		gasLimit: 21_000n,
	}]
}

export const ensureDelegationClearFunding = (transactions: TransactionList): TransactionList => {
	const clearTransaction = transactions.find(isClearDelegationTransaction)
	const authority = clearTransaction?.authorizationList?.find((authorization) => authorization.address === 0n)?.authority
	if (clearTransaction === undefined || authority === undefined) return transactions
	return addRescueFundingTransaction(transactions, authority, clearTransaction.chainId)
}

export const orderRescueTransactions = (transactions: TransactionList): TransactionList => [
	...transactions.filter(isClearDelegationTransaction),
	...transactions.filter((transaction) => transaction.from === 'FUNDING' && !isClearDelegationTransaction(transaction)),
	...transactions.filter((transaction) => transaction.from !== 'FUNDING' && !isClearDelegationTransaction(transaction)),
]

export const createRescueBundle = (transactions: TransactionList): Bundle => createBundle(orderRescueTransactions(transactions))
