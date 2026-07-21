import { batch, Signal, useSignal } from '@preact/signals'
import { useState } from 'preact/hooks'
import { parseEther } from 'ethers'
import { connectBrowserProvider, ProviderStore } from '../library/provider.js'
import { GetSimulationStackReply } from '../types/interceptorTypes.js'
import { Button } from './Button.js'
import { Bundle, Signers } from '../types/types.js'
import { BouquetSettings, TransactionList } from '../types/bouquetTypes.js'
import { ImportModal } from './ImportModal.js'
import { SingleNotice } from './Warns.js'
import { createBundle } from '../library/rescue.js'

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

export async function importFromInterceptor(
	bundle: Signal<Bundle | undefined>,
	provider: Signal<ProviderStore | undefined>,
	blockInfo: Signal<{
		blockNumber: bigint
		baseFee: bigint
		priorityFee: bigint
	}>,
	signers: Signal<Signers> | undefined,
	bouquetSettings: Signal<BouquetSettings>
) {
	if (!window.ethereum || !window.ethereum.request) throw Error('No Ethereum wallet detected')
	connectBrowserProvider(provider, blockInfo, signers, bouquetSettings)

	const { payload } = await window.ethereum
		.request({
			method: 'interceptor_getSimulationStack',
			params: ['1.0.1'],
		})
		.catch((err: { code: number }) => {
			if (err?.code === -32601) {
				throw new Error('Wallet does not support returning simulations')
			} else {
				throw new Error(`Unknown Error: ${JSON.stringify(err)}`)
			}
		})

	const tryParse = GetSimulationStackReply.safeParse(payload)
	if (!tryParse.success) throw new Error('Wallet does not support returning simulations')
	if (tryParse.value.length === 0) throw new Error('You have no transactions on your simulation')

	let converted: TransactionList
	try {
		converted = convertInterceptorTransactions(tryParse.value)
	} catch {
		throw new Error('Malformed simulation stack')
	}

	converted = markSyntheticFunding(converted)

	const containsFundingTx = converted.some((transaction) => transaction.from === 'FUNDING')

	// Take addresses that recieved funding, determine spend deficit - gas fees
	const fundingRecipients = new Set(converted.reduce((result: bigint[], tx) => (tx.to && tx.from === 'FUNDING' ? [...result, tx.to] : result), []))

	const spenderDeficits = tryParse.value.reduce((amounts: { [account: string]: { deficit: bigint, credit: bigint } }, tx) => {
		if (!fundingRecipients.has(tx.from)) return amounts
		const receipientBalanceChanges = tx.balanceChanges.filter(x => x.address === tx.from)

		const consumed = tx.value
		// Rebate is the difference between balance change and consume amount (if there were any internal transactions sending ETH back), ignore gas fees
		const balanceChange = receipientBalanceChanges.reduce((result: bigint, balanceChange) => result + balanceChange.after - balanceChange.before, 0n)
		const rebate = balanceChange + consumed + tx.maxPriorityFeePerGas * tx.gasSpent

		// Calcuate current deficit
		if (tx.from.toString() in amounts) {
			// If credit, deduct current credit from new consumption, or cancel out new consumption and open credit - whichever is smaller
			if (amounts[tx.from.toString()].credit > 0n) {
				if (amounts[tx.from.toString()].credit <= consumed) {
					amounts[tx.from.toString()].deficit += consumed - amounts[tx.from.toString()].credit
					amounts[tx.from.toString()].credit = rebate
				} else {
					// If consumed less than current rebates, deficit does not increase.
					amounts[tx.from.toString()].credit += rebate - consumed
				}
			}
		} else {
			amounts[tx.from.toString()] = { deficit: consumed, credit: rebate }
		}
		return amounts

	}, {})

	const inputValue = Object.values(spenderDeficits).reduce((sum, spender) => spender.deficit + sum, 0n)

	// Copy value and set, input of funding to inputValue
	const transactions = [...converted]
	if (containsFundingTx) {
		const fundingIndex = transactions.findIndex((transaction) => transaction.from === 'FUNDING')
		transactions[fundingIndex] = { ...transactions[fundingIndex], value: inputValue }
	}

	const importedBundle = createBundle(transactions)
	localStorage.setItem('payload', JSON.stringify(TransactionList.serialize(importedBundle.transactions)))
	bundle.value = importedBundle
}

export const Import = ({
	bundle,
	provider,
	blockInfo,
	signers,
	bouquetSettings,
}: {
	bundle: Signal<Bundle | undefined>
	provider: Signal<ProviderStore | undefined>
	blockInfo: Signal<{
		blockNumber: bigint
		baseFee: bigint
		priorityFee: bigint
	}>
	signers: Signal<Signers>
	bouquetSettings: Signal<BouquetSettings>
}) => {
	const showImportModal = useSignal<boolean>(false)
	const [error, setError] = useState<string | undefined>(undefined)

	const clearPayload = () => {
		batch(() => {
			bundle.value = undefined
			localStorage.removeItem('payload')
			signers.value.bundleSigners = {}
			setError('')
			// Keep burner wallet as long as it has funds, should clear is later if there is left over dust but not needed.
			// if (fundingAccountBalance.value === 0n) signers.value.burner = undefined
		})
	}

	return (
		<>
			{showImportModal.value ? <ImportModal bundle={bundle} clearError={() => setError('')} display={showImportModal} /> : null}
			<h2 className='font-bold text-2xl'><span class='text-gray-500'>1.</span> Import</h2>
			<div className='flex flex-col w-full gap-6'>
				<div className='flex flex-col sm:flex-row gap-4'>
					<Button
						onClick={() => importFromInterceptor(bundle, provider, blockInfo, signers, bouquetSettings).then(() => setError(undefined)).catch((err: Error) => setError(err.message))}
					>
						Import Payload from The Interceptor
					</Button>
					<Button
						onClick={() => showImportModal.value = true}
					>
						Import From JSON
					</Button>
					{bundle.value ? (
						<Button variant='secondary' onClick={clearPayload}>
							Reset
						</Button>
					) : null}
				</div>
				{error ? <SingleNotice variant='error' title='Could Not Import Transactions' description={error} /> : null}
				{error && error === 'Wallet does not support returning simulations' ? (
					<h3 className='text-xl'>
						Don't have The Interceptor Installed? Install it here{' '}
						<a className='font-bold text-accent underline' href='https://dark.florist'>
							here
						</a>
						.
					</h3>
				) : (
					''
				)}
			</div>
		</>
	)
	}
