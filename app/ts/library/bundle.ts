import { Eip7702Authorization, TransactionList } from '../types/bouquetTypes.js'
import { Bundle } from '../types/types.js'
import { addressString } from './utils.js'

const hasCompleteSignature = (authorization: Eip7702Authorization) =>
	authorization.r !== undefined && authorization.s !== undefined && authorization.yParity !== undefined

export const isClearDelegationTransaction = (transaction: TransactionList[number]) =>
	transaction.type === '7702' && (transaction.authorizationList ?? []).some((authorization) => authorization.address === 0n)

export const createBundle = (transactions: TransactionList): Bundle => {
	const signerAddresses = new Set<string>()
	for (const transaction of transactions) {
		if (transaction.from !== 'FUNDING') signerAddresses.add(addressString(transaction.from))
		if (transaction.type !== '7702') continue
		for (const authorization of transaction.authorizationList ?? []) {
			if (!hasCompleteSignature(authorization) && authorization.authority !== undefined) {
				signerAddresses.add(addressString(authorization.authority))
			}
		}
	}
	return {
		transactions,
		containsFundingTx: transactions.some((transaction) => transaction.from === 'FUNDING'),
		rescueMode: transactions.some(isClearDelegationTransaction),
		totalGas: transactions.reduce((sum, transaction) => sum + transaction.gasLimit, 0n),
		inputValue: transactions.reduce((sum, transaction) => transaction.from === 'FUNDING' ? sum + transaction.value : sum, 0n),
		uniqueSigners: [...signerAddresses],
	}
}
