import { ReadonlySignal, Signal, useSignal, useSignalEffect } from '@preact/signals'
import { EtherSymbol, formatEther, getAddress, Interface, parseEther, TransactionDescription } from 'ethers'
import { JSXInternal } from 'preact/src/jsx.js'
import { AppSettings, BlockInfo, Bundle, serialize, Signers } from '../types/types.js'
import { NETWORKS } from '../constants.js'
import { ProviderStore } from '../library/provider.js'
import { Button } from './Button.js'
import { useAsyncState } from '../library/asyncState.js'
import { TransactionList } from '../types/bouquetTypes.js'
import { SingleNotice } from './Warns.js'
import { GetSimulationStackReply } from '../types/interceptorTypes.js'
import { addressString } from '../library/utils.js'
import { importFromInterceptor } from './Import.js'
import { EtherscanGetABIResult, EtherscanSourceCodeResult } from '../types/apiTypes.js'

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
	blockInfo,
	appSettings,
	signers
}: {
	provider: Signal<ProviderStore | undefined>
	bundle: Signal<Bundle | undefined>
	blockInfo: Signal<BlockInfo>
	signers: Signal<Signers>
	appSettings: Signal<AppSettings>
	fundingAmountMin: ReadonlySignal<bigint>
}) => {
	const interfaces = useSignal<{ [address: string]: Interface }>({})
	const decodedTransactions = useSignal<(JSXInternal.Element | null)[]>([])
	const interceptorComparison = useSignal<{ different: boolean, intervalId?: ReturnType<typeof setInterval> }>({ different: true })

	function copyTransactions() {
		if (!bundle.value) return
		const parsedList = TransactionList.safeSerialize(bundle.value.transactions)
		if ('success' in parsedList && parsedList.success) navigator.clipboard.writeText(JSON.stringify(parsedList.value, null, 2))
	}

	const fetchingAbis = useAsyncState()

	async function fetchAbis() {
		if (!bundle.value || !bundle.value.transactions) return
		try {
			const uniqueAddresses = [...new Set(bundle.value.transactions.map((tx) => tx.to ? addressString(tx.to) : null ).filter(addr => addr))] as string[]
			const abis: (string | undefined)[] = []

			const requests = await Promise.all(
				uniqueAddresses.map((address) =>
					fetch(
						`https://api${appSettings.peek().relayEndpoint === NETWORKS['5'].mevRelay ? '-goerli' : ''
						}.etherscan.io/api?module=contract&action=getsourcecode&address=${getAddress(address.toLowerCase())}&apiKey=PSW8C433Q667DVEX5BCRMGNAH9FSGFZ7Q8`,
					),
				),
			)
			const sourcecodeResults = await Promise.all(requests.map((request) => request.json()))
			const parsedSourceCode = sourcecodeResults.map(x => EtherscanSourceCodeResult.safeParse(x))

			// Extract ABI from getSourceCode request if not proxy, otherwise attempt to fetch ABI of implementation
			for (const contract of parsedSourceCode) {
				if (contract.success == false || contract.value.status !== '1') abis.push(undefined)
				else {
					if (contract.value.result[0].Proxy === '1' && contract.value.result[0].Implementation !== '') {
						const implReq = await fetch(`https://api${appSettings.peek().relayEndpoint ===  NETWORKS['5'].mevRelay ? '-goerli' : ''}.etherscan.io/api?module=contract&action=getabi&address=${addressString(contract.value.result[0].Implementation)}&apiKey=PSW8C433Q667DVEX5BCRMGNAH9FSGFZ7Q8`)
						const implResult = EtherscanGetABIResult.safeParse(await implReq.json())
						abis.push(implResult.success && implResult.value.status === '1' ? implResult.value.result : undefined)
					} else abis.push(contract.value.result[0].ABI && contract.value.result[0].ABI !== 'Contract source code not verified' ? contract.value.result[0].ABI : undefined)
				}
			}

			interfaces.value = abis.reduce((acc, curr, index) => {
				if (curr) return { ...acc, [`${uniqueAddresses[index]}`]: new Interface(curr) }
				else return acc
			}, {})
		} catch (error) {
			console.log('parseTransactionsCb Error:', error)
			interfaces.value = {}
		}
	}

	useSignalEffect(() => {
		if (interfaces.value && bundle.value) {
			parseTransactions()
			compareWithInterceptor()
		}
		if (provider.value && provider.value.isInterceptor && !interceptorComparison.value.intervalId) createCompareInterval()
	})

	const parseTransactions = async () => {
		if (!bundle.value) return
		decodedTransactions.value = bundle.value.transactions.map((tx) => {
			if (tx.to && tx.input && tx.input.length > 0) {
				const contractAddr = addressString(tx.to)
				const txDescription = interfaces.value[contractAddr] ? interfaces.value[contractAddr].parseTransaction({ value: tx.value ?? undefined, data: tx.input.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '0x') }) : null
				return txDescription ? formatTransactionDescription(txDescription) : null
			}
			return null
		})
	}

	const compare = async () => {
		if (!provider.value || !provider.value.isInterceptor || !bundle.value) return false
		try {
			// fetch stack from Interceptor
			const { payload } = await provider.value.provider.send('interceptor_getSimulationStack', ['1.0.0'])
			const tryParse = GetSimulationStackReply.safeParse(payload)
			if (!tryParse.success) return false
			let parsedInterceptorTransactions = TransactionList.parse(serialize(GetSimulationStackReply, tryParse.value).map(({ from, to, value, input, gasLimit, chainId }) => ({ from, to, value, input, gasLimit, chainId })))
			if (parsedInterceptorTransactions.length === 0) return false

			// Detect 'make me rich'
			if (parsedInterceptorTransactions.length >= 2 && parsedInterceptorTransactions[0].to === parsedInterceptorTransactions[1].from && parsedInterceptorTransactions[0].value === parseEther('200000')) {
				const fundingAddrr = parsedInterceptorTransactions[0].from
				parsedInterceptorTransactions = parsedInterceptorTransactions.map(tx => tx.from === fundingAddrr ? { ...tx, from: 'FUNDING' } : tx)
			}

			// Compare
			const interceptorValue = TransactionList.serialize(parsedInterceptorTransactions.filter(tx => tx.from !== 'FUNDING'))
			const bouquetValue = TransactionList.serialize(bundle.value.transactions.filter(tx => tx.from !== 'FUNDING'))
			return JSON.stringify(interceptorValue) !== JSON.stringify(bouquetValue)
		} catch {
			return false
		}
	}

	const compareWithInterceptor = async () => {
		const different = await compare()
		interceptorComparison.value = { ...interceptorComparison.value, different }
	}

	async function createCompareInterval() {
		if (!provider.value || !provider.value.isInterceptor) return;
		const different = await compare()
		interceptorComparison.value = { different, intervalId: setInterval(compareWithInterceptor, 20000)}
	}

	return (
		<>
			<h2 className='font-bold text-2xl'>Your Transactions</h2>
			<div className='flex flex-row gap-4'>
				<Button variant='secondary' disabled={fetchingAbis.value.value.state === 'pending'} onClick={() => fetchingAbis.waitFor(fetchAbis)}>Decode Transactions From Etherscan</Button>
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
			{interceptorComparison.value.different ? <SingleNotice variant='warn' title='Potentially Outdated Transaction List' description={<>The transactions imported in Bouquet differ from the current simulation in The Interceptor extension. <button onClick={() => importFromInterceptor(bundle, provider, blockInfo, appSettings, signers)} class='underline text-white font-semibold'>Import From Interceptor</button> </>} /> : null}
			<div class='flex w-full flex-col gap-2'>
				{bundle.value?.transactions.map((tx, index) => (
					<div class='flex w-full min-h-[96px] border border-white/90'>
						<div class='flex w-24 flex-col items-center justify-center text-white'>
							<span class='text-lg font-bold'>#{index}</span>
						</div>
						<div class='bg-gray-500/30 flex w-full justify-center flex-col gap-2 p-4 text-sm font-semibold'>
							<div class='flex gap-2 items-center'>
								<span class='w-10 text-right'>From</span>
								<span class='bg-black px-2 py-1 font-mono font-medium'>
									{tx.from !== 'FUNDING' ? addressString(tx.from) : tx.from}
								</span>
							</div>
							<div class='flex gap-2 items-center'>
								<span class='w-10 text-right'>To</span>
								<span class='bg-black px-2 py-1 font-mono font-medium'>{tx.to ? addressString(tx.to) : 'Contract Deployment'}</span>
							</div>
							<div class='flex gap-2 items-center'>
								<span class='w-10 text-right'>Value</span>
								<span class='bg-black px-2 py-1 font-mono font-medium'>{EtherSymbol}{formatEther(tx.value + (tx.from === 'FUNDING' && bundle.value && bundle.value.containsFundingTx ? bundle.value.totalGas * (blockInfo.value.baseFee + blockInfo.value.priorityFee): 0n))} + {EtherSymbol}{formatEther(tx.gasLimit * (blockInfo.value.baseFee + blockInfo.value.priorityFee))} Gas Fee</span>
							</div>
							{decodedTransactions.value[index] ? (
								<div class='flex gap-2 items-center'>
									<span class='w-10 text-right'>Data</span>
									<span class='bg-black px-2 py-1 font-mono font-medium w-full break-all'>{decodedTransactions.value[index]}</span>
								</div>
							) : tx.input && tx.input.length > 0 ? (
								<div class='flex gap-2 items-center'>
									<span class='w-10 text-right'>Data</span>
									<span class='bg-black px-2 py-1 font-mono font-medium w-full break-all'>{tx.input.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '0x')}</span>
								</div>
							) : null}
						</div>
					</div>
				))}
			</div>
		</>
	)
}
