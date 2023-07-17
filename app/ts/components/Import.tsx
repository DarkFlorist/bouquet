import { batch, Signal, useSignal } from '@preact/signals'
import { useState } from 'preact/hooks'
import { getAddress } from 'ethers'
import { connectBrowserProvider, ProviderStore } from '../library/provider.js'
import { GetSimulationStackReply } from '../types/interceptorTypes.js'
import { Button } from './Button.js'
import { AppSettings, Bundle, serialize, Signers } from '../types/types.js'
import { EthereumAddress } from '../types/ethereumTypes.js'
import { TransactionList } from '../types/bouquetTypes.js'
import { ImportModal } from './ImportModal.js'
import { SingleNotice } from './Warns.js'

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
	const parsed = tryParse.value
	if (parsed.length === 0) throw new Error('You have no transactions on your simulation')

	const converted = TransactionList.safeParse(serialize(GetSimulationStackReply, parsed).map(({ from, to, value, input, gasLimit, chainId }) => ({ from, to, value, input, gasLimit, chainId })))
	if (!converted.success) throw new Error('Malformed simulation stack')

	localStorage.setItem('payload', JSON.stringify(TransactionList.serialize(converted.value)))

	const containsFundingTx = parsed.length > 1 && parsed[0].to === parsed[1].from
	const uniqueSigners = [...new Set(parsed.map((x) => getAddress(serialize(EthereumAddress, x.from))))].filter(
		(_, index) => !(index === 0 && containsFundingTx),
	)

	const totalGas = parsed.reduce((sum, tx, index) => (index === 0 && containsFundingTx ? 21000n : BigInt(tx.gasLimit.toString()) + sum), 0n)
	// @TODO: Change this to track minimum amount of ETH needed to deposit
	const inputValue = parsed.reduce((sum, tx, index) => (index === 0 && containsFundingTx ? 0n : BigInt(tx.value.toString()) + sum), 0n)

	bundle.value = { transactions: converted.value, containsFundingTx, uniqueSigners, totalGas, inputValue }
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
