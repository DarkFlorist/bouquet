import { ReadonlySignal, Signal, useComputed, useSignal, useSignalEffect } from '@preact/signals'
import { utils } from 'ethers'
import { JSXInternal } from 'preact/src/jsx.js'
import { createBundleTransactions, FlashbotsBundleTransaction, } from '../library/bundleUtils.js'
import { AppSettings, BlockInfo, Bundle, Signers } from '../types/types.js'
import { MEV_RELAY_GOERLI } from '../constants.js'
import { ProviderStore } from '../library/provider.js'
import { Button } from './Button.js'
import { useAsyncState } from '../library/asyncState.js'

function formatTransactionDescription(tx: utils.TransactionDescription) {
	if (tx.functionFragment.inputs.length === 0) return <>{`${tx.name}()`}</>
	const params = tx.functionFragment.inputs.map((y, index) => <p class='pl-4'>{`${y.name}: ${tx.args[index].toString()}`}</p>)
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
	const interfaces = useSignal<{ [address: string]: utils.Interface }>({})
	const transactions = useSignal<(FlashbotsBundleTransaction & { decoded?: JSXInternal.Element })[]>([])
	const updateTx = async () => {
		if (provider.value) {
			const result = await createBundleTransactions(bundle.value, signers.value, blockInfo.value, appSettings.value.blocksInFuture, fundingAmountMin.value)
			if (Object.keys(interfaces.value).length === 0) {
				transactions.value = result
			} else {
				const parsed = transactions.value.map((tx) => {
					if (tx.transaction.to && tx.transaction.data && tx.transaction.data !== '0x' && tx.transaction.data.length > 0) {
						const decoded = formatTransactionDescription(
							interfaces.value[tx.transaction.to].parseTransaction({ ...tx.transaction, data: tx.transaction.data.toString() }),
						)
						return { ...tx, decoded }
					}
					return tx
				})
				transactions.value = parsed
			}
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
						}.etherscan.io/api?module=contract&action=getabi&address=${utils.getAddress(address)}&apiKey=PSW8C433Q667DVEX5BCRMGNAH9FSGFZ7Q8`,
					),
				),
			)
			const abis = await Promise.all(requests.map((request) => request.json()))
			interfaces.value = abis.reduce((acc, curr: { status: string; result: string }, index) => {
				if (curr.status === '1') return { ...acc, [`${uniqueAddresses[index]}`]: new utils.Interface(curr.result) }
				else return acc
			}, {})
			updateTx()
		} catch (error) {
			console.log('parseTransactionsCb Error:', error)
			interfaces.value = {}
		}
	}

	return (
		<>
			<h2 className='font-bold text-2xl'>Your Transactions</h2>
			<Button variant='secondary' disabled={fetchingAbis.value.value.state === 'pending'} onClick={() => fetchingAbis.waitFor(parseTransactions)}>Decode Transactions From Etherscan</Button>
			<div class='flex w-full flex-col gap-2'>
				{transactions.value.map((tx, index) => (
					<div class='flex w-full min-h-[96px] border-2 border-white rounded-xl'>
						<div class='flex w-24 flex-col items-center justify-center text-white border-r-2'>
							<span class='text-lg font-bold'>#{index}</span>
						</div>
						<div class='bg-card flex w-full justify-center flex-col gap-2 rounded-r-xl p-4 text-sm font-semibold'>
							<div class='flex gap-2 items-center'>
								<span class='w-10 text-right'>From</span>
								<span class='rounded bg-background px-2 py-1 font-mono font-medium'>
									{fundingTx.value && tx.transaction.from === transactions.peek()[0].transaction.from ? 'FUNDING WALLET' : tx.transaction.from}
								</span>
							</div>
							<div class='flex gap-2 items-center'>
								<span class='w-10 text-right'>To</span>
								<span class='rounded bg-background px-2 py-1 font-mono font-medium'>{tx.transaction.to}</span>
							</div>
							<div class='flex gap-2 items-center'>
								<span class='w-10 text-right'>Value</span>
								<span class='rounded bg-background px-2 py-1 font-mono font-medium'>{utils.formatEther(tx.transaction.value ?? 0n)} ETH</span>
							</div>
							{tx.decoded ? (
								<div class='flex gap-2 items-center'>
									<span class='w-10 text-right'>Data</span>
									<span class='rounded bg-background px-2 py-1 font-mono font-medium w-full break-all'>{tx.decoded}</span>
								</div>
							) : tx.transaction.data && tx.transaction.data !== '0x' ? (
								<div class='flex gap-2 items-center'>
									<span class='w-10 text-right'>Data</span>
									<span class='rounded bg-background px-2 py-1 font-mono font-medium w-full break-all'>{tx.transaction.data.toString()}</span>
								</div>
							) : null}
						</div>
					</div>
				))}
			</div>
		</>
	)
}
