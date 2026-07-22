import { parseEther } from 'ethers'
import { TransactionList } from '../types/bouquetTypes.js'
import { GetSimulationStackReply } from '../types/interceptorTypes.js'

export async function requestInterceptorStackAfterConnection<T>(
	connectProvider: () => Promise<unknown>,
	requestStack: () => Promise<T>,
): Promise<T> {
	await connectProvider()
	return requestStack()
}

export function convertInterceptorTransactions(transactions: GetSimulationStackReply): TransactionList {
	return transactions.map((transaction) => {
		if (transaction.chainId === undefined) throw new Error('Transaction is missing its chain ID')
		const base = {
			from: transaction.from,
			to: transaction.to,
			value: transaction.value,
			input: transaction.input,
			gasLimit: transaction.gasLimit,
			chainId: transaction.chainId,
		}
		if (transaction.type === '7702') return { ...base, type: transaction.type, accessList: transaction.accessList, authorizationList: transaction.authorizationList }
		return { ...base, ...('accessList' in transaction ? { accessList: transaction.accessList } : {}) }
	})
}

export function markSyntheticFunding(transactions: TransactionList): TransactionList {
	if (transactions.length < 2 || transactions[0].value !== parseEther('200000') || transactions[0].to === null) return transactions
	const recipient = transactions[0].to
	const recipientUsesFunds = transactions.slice(1).some((transaction) =>
		transaction.from === recipient || transaction.authorizationList?.some((authorization) => authorization.authority === recipient),
	)
	if (!recipientUsesFunds) return transactions
	const fundingAddress = transactions[0].from
	return transactions.map((transaction) => transaction.from === fundingAddress ? { ...transaction, from: 'FUNDING' } : transaction)
}
