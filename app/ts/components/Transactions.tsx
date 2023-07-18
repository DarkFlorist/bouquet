import { ReadonlySignal, Signal, useComputed, useSignal, useSignalEffect } from '@preact/signals'
import { formatEther, getAddress, Interface, TransactionDescription } from 'ethers'
import { JSXInternal } from 'preact/src/jsx.js'
import { createBundleTransactions, FlashbotsBundleTransaction } from '../library/bundleUtils.js'
import { AppSettings, BlockInfo, Bundle, Signers } from '../types/types.js'
import { MEV_RELAY_GOERLI } from '../constants.js'
import { ProviderStore } from '../library/provider.js'
import { Button } from './Button.js'
import { useAsyncState } from '../library/asyncState.js'
import { TransactionList } from '../types/bouquetTypes.js'
import { SingleNotice } from './Warns.js'

function formatTransactionDescription(tx: TransactionDescription) {
	if (tx.fragment.inputs.length === 0) return <>{`${tx.name}()`}</>
	const params = tx.fragment.inputs.map((y, index) => <p class='pl-4'>{`${y.name}: ${tx.args[index].toString()}`}</p>)
	return (
		<>
			<p>{`${tx.name}(`}</p>
			{params}
			<p>)</p>
		</>
	)
}

export const Transactions = ({
	provider,
	bundle,
	signers,
	blockInfo,
	appSettings,
	fundingAmountMin,
}: {
	provider: Signal<ProviderStore | undefined>
	bundle: Signal<Bundle | undefined>
	blockInfo: Signal<BlockInfo>
	signers: Signal<Signers>
	appSettings: Signal<AppSettings>
	fundingAmountMin: ReadonlySignal<bigint>
}) => {
	const fundingTx = useComputed(() => bundle.value ? bundle.value.containsFundingTx : false)
	const interfaces = useSignal<{ [address: string]: Interface }>({})
	const transactions = useSignal<(FlashbotsBundleTransaction & { decoded?: JSXInternal.Element })[]>([])
	const updateTx = async () => {
		if (!provider.value || !bundle.value) return transactions.value = []
		const result = await createBundleTransactions(bundle.value, signers.value, blockInfo.value, appSettings.value.blocksInFuture, fundingAmountMin.value)
		if (Object.keys(interfaces.value).length === 0) {
			return transactions.value = result
		} else {
			const parsed = transactions.value.map((tx) => {
				if (tx.transaction.to && tx.transaction.data && tx.transaction.data.length > 2) {
					const txDescription = interfaces.value[tx.transaction.to.toString()].parseTransaction({ value: tx.transaction.value ?? undefined, data: tx.transaction.data ?? undefined })
					return txDescription ? { ...tx, decoded: formatTransactionDescription(txDescription) } : tx
				}
				return tx
			})
			return transactions.value = parsed
		}
	}
	useSignalEffect(() => {
		if (provider.value && bundle.value) {
			updateTx()
		}
	})

	const fetchingAbis = useAsyncState()

	async function parseTransactions() {
		try {
			const uniqueAddresses = [...new Set(transactions.value.filter(tx => typeof tx.transaction.to === 'string').map((x) => x.transaction.to))] as string[]
			const requests = await Promise.all(
				uniqueAddresses.map((address) =>
					fetch(
						`https://api${appSettings.peek().relayEndpoint === MEV_RELAY_GOERLI ? '-goerli' : ''
						}.etherscan.io/api?module=contract&action=getabi&address=${getAddress(address.toLowerCase())}&apiKey=PSW8C433Q667DVEX5BCRMGNAH9FSGFZ7Q8`,
					),
				),
			)
			const abis = await Promise.all(requests.map((request) => request.json()))
			interfaces.value = abis.reduce((acc, curr: { status: string; result: string }, index) => {
				if (curr.status === '1') return { ...acc, [`${uniqueAddresses[index]}`]: new Interface(curr.result) }
				else return acc
			}, {})
			updateTx()
		} catch (error) {
			console.log('parseTransactionsCb Error:', error)
			interfaces.value = {}
		}
	}

	function copyTransactions() {
		if (!bundle.value) return
		const parsedList = TransactionList.safeSerialize(bundle.value.transactions)
		if ('success' in parsedList && parsedList.success) navigator.clipboard.writeText(JSON.stringify(parsedList.value, null, 2))
	}

	const differentInterceptorStack = useSignal(false)

	return (
		<>
			<h2 className='font-bold text-2xl'>Your Transactions</h2>
			<div className='flex flex-row gap-4'>
				<Button variant='secondary' disabled={fetchingAbis.value.value.state === 'pending'} onClick={() => fetchingAbis.waitFor(parseTransactions)}>Decode Transactions From Etherscan</Button>
				<Button variant='secondary' onClick={copyTransactions}><>Copy Transaction List
					<svg
						className='h-8 inline-block'
						aria-hidden='true'
						fill='none'
						stroke='currentColor'
						stroke-width='1.5'
						viewBox='0 0 24 24'
						xmlns='http://www.w3.org/2000/svg'
					>
						<path
							d='M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 00-2.25 2.25v6'
							stroke-linecap='round'
							stroke-linejoin='round'
						></path>
					</svg>
				</>
				</Button>
			</div>
			{differentInterceptorStack.value ? <SingleNotice variant='warn' title='Potentially Outdated Transaction List' description='The transactions imported in Bouquet differ from the current simulation in The Interceptor extension.' /> : null}
			<div class='flex w-full flex-col gap-2'>
				{transactions.value.map((tx, index) => (
					<div class='flex w-full min-h-[96px] border border-white/90'>
						<div class='flex w-24 flex-col items-center justify-center text-white'>
							<span class='text-lg font-bold'>#{index}</span>
						</div>
						<div class='bg-gray-500/30 flex w-full justify-center flex-col gap-2 p-4 text-sm font-semibold'>
							<div class='flex gap-2 items-center'>
								<span class='w-10 text-right'>From</span>
								<span class='bg-black px-2 py-1 font-mono font-medium'>
									{fundingTx.value && tx.transaction.from === transactions.peek()[0].transaction.from ? 'FUNDING WALLET' : tx.transaction.from}
								</span>
							</div>
							<div class='flex gap-2 items-center'>
								<span class='w-10 text-right'>To</span>
								<span class='bg-black px-2 py-1 font-mono font-medium'>{tx.transaction.to}</span>
							</div>
							<div class='flex gap-2 items-center'>
								<span class='w-10 text-right'>Value</span>
								<span class='bg-black px-2 py-1 font-mono font-medium'>{formatEther(tx.transaction.value ?? 0n)} ETH</span>
							</div>
							{tx.decoded ? (
								<div class='flex gap-2 items-center'>
									<span class='w-10 text-right'>Data</span>
									<span class='bg-black px-2 py-1 font-mono font-medium w-full break-all'>{tx.decoded}</span>
								</div>
							) : tx.transaction.data && tx.transaction.data !== '0x' ? (
								<div class='flex gap-2 items-center'>
									<span class='w-10 text-right'>Data</span>
									<span class='bg-black px-2 py-1 font-mono font-medium w-full break-all'>{tx.transaction.data.toString()}</span>
								</div>
							) : null}
						</div>
					</div>
				))}
			</div>
		</>
	)
}
