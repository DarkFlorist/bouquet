import { batch, Signal, useSignal } from '@preact/signals'
import { useState } from 'preact/hooks'
import { parseEther } from 'ethers'
import { connectBrowserProvider, ProviderStore } from '../library/provider.js'
import { GetSimulationStackReply } from '../types/interceptorTypes.js'
import { Button } from './Button.js'
import { AppSettings, Bundle, serialize, Signers } from '../types/types.js'
import { EthereumAddress } from '../types/ethereumTypes.js'
import { TransactionList } from '../types/bouquetTypes.js'
import { ImportModal } from './ImportModal.js'
import { SingleNotice } from './Warns.js'
import { addressString } from '../library/utils.js'

export async function importFromInterceptor(
	bundle: Signal<Bundle | undefined>,
	provider: Signal<ProviderStore | undefined>,
	blockInfo: Signal<{
		blockNumber: bigint
		baseFee: bigint
		priorityFee: bigint
	}>,
	appSettings: Signal<AppSettings>,
	signers: Signal<Signers> | undefined,
) {
	if (!window.ethereum || !window.ethereum.request) throw Error('No Ethereum wallet detected')
	connectBrowserProvider(provider, blockInfo, signers, appSettings)

	const { payload } = await window.ethereum
		.request({
			method: 'interceptor_getSimulationStack',
			params: ['1.0.0'],
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

	const converted = TransactionList.safeParse(serialize(GetSimulationStackReply, tryParse.value).map(({ from, to, value, input, gasLimit, chainId }) => ({ from, to, value, input, gasLimit, chainId })))
	if (!converted.success) throw new Error('Malformed simulation stack')

	if (converted.value.length >= 2 && converted.value[0].to === converted.value[1].from && converted.value[0].value === parseEther('200000')) {
		const fundingAddr = converted.value[0].from
		converted.value = converted.value.map(tx => tx.from === fundingAddr ? { ...tx, from: 'FUNDING' } : tx)
	}

	const uniqueToAddresses = [...new Set(converted.value.map(({ from }) => from))]
	const containsFundingTx = uniqueToAddresses.includes('FUNDING')
	const uniqueSigners = uniqueToAddresses.filter((address): address is EthereumAddress => address !== 'FUNDING').map(address => addressString(address))

	const totalGas = converted.value.reduce((sum, tx) => tx.gasLimit + sum, 0n)

	// Take addresses that recieved funding, determine spend deficit - gas fees
	const fundingRecipients = new Set(converted.value.reduce((result: bigint[], tx) => (tx.to && tx.from === 'FUNDING' ? [...result, tx.to] : result), []))

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
	const transactions = [...converted.value]
	if (containsFundingTx) {
		transactions[0] = { ...transactions[0], value: inputValue }
	}

	localStorage.setItem('payload', JSON.stringify(TransactionList.serialize(transactions)))
	bundle.value = { transactions, containsFundingTx, uniqueSigners, totalGas, inputValue }
}

export const Import = ({
	bundle,
	provider,
	blockInfo,
	signers,
	appSettings,
}: {
	bundle: Signal<Bundle | undefined>
	provider: Signal<ProviderStore | undefined>
	blockInfo: Signal<{
		blockNumber: bigint
		baseFee: bigint
		priorityFee: bigint
	}>
	signers: Signal<Signers>
	appSettings: Signal<AppSettings>
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
						onClick={() => importFromInterceptor(bundle, provider, blockInfo, appSettings, signers).then(() => setError(undefined)).catch((err: Error) => setError(err.message))}
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
