import { computed, ReadonlySignal, Signal, useSignal } from '@preact/signals'
import { utils } from 'ethers'
import { Interface, TransactionDescription } from 'ethers/lib/utils.js'
import { useCallback } from 'preact/hooks'
import { JSXInternal } from 'preact/src/jsx.js'
import { createBundleTransactions } from '../library/bundleUtils.js'
import { FlashbotsBundleTransaction } from '../library/flashbots-ethers-provider.js'
import { AppSettings, BlockInfo, BundleState, Signers } from '../library/types.js'
import { MEV_RELAY_GOERLI } from '../constants.js'

function formatTransactionDescription(tx: TransactionDescription) {
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

export const TransactionList = ({
	parsedTransactions,
	fundingTx,
}: {
	parsedTransactions: Signal<(FlashbotsBundleTransaction & { decoded?: JSXInternal.Element })[]>
	fundingTx: boolean
}) => {
	return (
		<div class='flex w-full flex-col gap-2'>
			{parsedTransactions.value.map((tx, index) => (
				<div class='flex w-full min-h-[96px] border-2 border-white rounded-xl'>
					<div class='flex w-24 flex-col items-center justify-center text-white border-r-2'>
						<span class='text-lg font-bold'>#{index}</span>
					</div>
					<div class='bg-card flex w-full justify-center flex-col gap-2 rounded-r-xl p-4 text-sm font-semibold'>
						<div class='flex gap-2 items-center'>
							<span class='w-10 text-right'>From</span>
							<span class='rounded bg-background px-2 py-1 font-mono font-medium'>
								{fundingTx && tx.transaction.from === parsedTransactions.peek()[0].transaction.from ? 'FUNDING WALLET' : tx.transaction.from}
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
	)
}

export const Transactions = ({
	interceptorPayload,
	signers,
	blockInfo,
	appSettings,
	fundingAmountMin,
}: {
	interceptorPayload: Signal<BundleState | undefined>
	blockInfo: Signal<BlockInfo>
	signers: Signal<Signers>
	appSettings: Signal<AppSettings>
	fundingAmountMin: ReadonlySignal<bigint>
}) => {
	const transactions = computed(() =>
		createBundleTransactions(interceptorPayload.peek(), signers.peek(), blockInfo.peek(), appSettings.peek().blocksInFuture, fundingAmountMin.peek()),
	)

	const parsedTransactions = useSignal<(FlashbotsBundleTransaction & { decoded?: JSXInternal.Element })[]>(transactions.peek())
	const parseTransactionsCb = async () => {
		try {
			const uniqueAddresses = [...new Set(transactions.value.map((x) => x.transaction.to))]
			// @TODO: Map correctly to APIs when adding custom rpc support
			const requests = await Promise.all(
				uniqueAddresses.map((address) =>
					fetch(
						`https://api${
							appSettings.peek().relayEndpoint === MEV_RELAY_GOERLI ? '-goerli' : ''
						}.etherscan.io/api?module=contract&action=getabi&address=${address}&apiKey=PSW8C433Q667DVEX5BCRMGNAH9FSGFZ7Q8`,
					),
				),
			)
			const abis = await Promise.all(requests.map((request) => request.json()))
			const interfaces: { [address: string]: Interface } = abis.reduce((acc, curr: { status: string; result: string }, index) => {
				if (curr.status === '1') return { ...acc, [`${uniqueAddresses[index]}`]: new utils.Interface(curr.result) }
				else return acc
			}, {})
			const parsed = transactions.value.map((tx) => {
				if (tx.transaction.to && tx.transaction.data && tx.transaction.data !== '0x' && tx.transaction.data.length > 0) {
					const decoded = formatTransactionDescription(
						interfaces[tx.transaction.to].parseTransaction({ ...tx.transaction, data: tx.transaction.data.toString() }),
					)
					return { ...tx, decoded }
				}
				return tx
			})
			parsedTransactions.value = parsed
		} catch (error) {
			console.log('parseTransactionsCb Error:', error)
			parsedTransactions.value = transactions.peek()
		}
	}
	useCallback(parseTransactionsCb, [interceptorPayload.value])
	parseTransactionsCb()

	return (
		<>
			<h2 className='font-bold text-2xl'>Your Transactions</h2>
			<TransactionList {...{ parsedTransactions, fundingTx: interceptorPayload.peek()?.containsFundingTx ?? false }} />
		</>
	)
}
