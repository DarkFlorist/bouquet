import { EtherSymbol, formatEther, formatUnits } from 'ethers'
import { batch, ReadonlySignal, Signal, useComputed, useSignal, useSignalEffect } from '@preact/signals'
import { getMaxBaseFeeInFutureBlock } from '../library/bundleUtils.js'
import { Button } from './Button.js'
import { BlockInfo, Bundle, Signers } from '../types/types.js'
import { ProviderStore } from '../library/provider.js'
import { SettingsModal } from './Settings.js'
import { useAsyncState, AsyncProperty } from '../library/asyncState.js'
import { simulateBundle, sendBundle, checkBundleInclusion, RelayResponseError, SimulationResponseSuccess } from '../library/flashbots.js'
import { SingleNotice } from './Warns.js'
import { BouquetNetwork, BouquetSettings } from '../types/bouquetTypes.js'
import { getNetwork } from '../constants.js'

type PendingBundle = {
	bundles: {
		[bundleIdentifier: string]: {
			targetBlock: bigint,
			gas: { priorityFee: bigint, baseFee: bigint }
			transactions: { signedTransaction: string, hash: string, account: string, nonce: bigint }[]
			included: boolean
		}
	}
	error?: Error,
	success?: {
		targetBlock: bigint,
		gas: { priorityFee: bigint, baseFee: bigint }
		transactions: { signedTransaction: string, hash: string, account: string, nonce: bigint }[]
		included: boolean
		includedInBlocks: bigint[]
	}
}

const SimulationResult = ({
	state
}: {
	state: Signal<AsyncProperty<SimulationResponseSuccess>>
}) => {
	if (state.value.state === 'pending') return <div>Simulating...</div>
	if (state.value.state === 'resolved') {
		return state.value.value.firstRevert ?
			<SingleNotice variant='error' title='A Transaction Reverted During Simulation' description={
				<div class='flex w-full min-h-[96px] border border-white/90 mt-4'>
					<div class='flex w-16 flex-col items-center justify-center text-white'>
						<span class='text-lg font-bold'>#{state.value.value.results.findIndex((x) => 'error' in x)}</span>
					</div>
					<div class='bg-gray-500/30 flex w-full justify-center flex-col gap-2 p-4 text-sm font-semibold'>
						<div class='flex gap-2 items-center'>
							<span class='w-16 text-right'>From</span>
							<span class='bg-black px-2 py-1 font-mono font-medium'>
								{state.value.value.firstRevert.fromAddress}
							</span>
						</div>
						<div class='flex gap-2 items-center'>
							<span class='w-16 text-right'>To</span>
							<span class='bg-black px-2 py-1 font-mono font-medium'>{state.value.value.firstRevert.toAddress}</span>
						</div>
						<div class='flex gap-2 items-center'>
							<span class='w-16 text-right'>Gas Used</span>
							<span class='bg-black px-2 py-1 font-mono font-medium'>{state.value.value.firstRevert.gasUsed} gas</span>
						</div>
						<div class='flex gap-2 items-center'>
							<span class='w-16 text-right'>Error</span>
							<span class='bg-black px-2 py-1 font-mono font-medium'>{'error' in state.value.value.firstRevert ? String(state.value.value.firstRevert.error) : 'Unknown'}</span>
						</div>
					</div>
				</div>
			} />
			: <SingleNotice variant='success' title='Simulation Succeeded' description={<p><b>{state.value.value.results.length}</b> Transactions succeeded, consuming <b>{state.value.value.totalGasUsed}</b> gas with a total fee of <b>{EtherSymbol}{formatEther(state.value.value.gasFees)}</b>.</p>} />
	}
	if (state.value.state === 'rejected') {
		return <SingleNotice variant='error' title='Simulation Failed' description={<p class='font-medium w-full break-all'>{state.value.error.message}</p>} />
	}
	return <></>
}

export const Bundles = ({
	outstandingBundles,
	bouquetNetwork,
}: {
	outstandingBundles: Signal<PendingBundle>,
	bouquetNetwork: Signal<BouquetNetwork>,
}) => {
	if (outstandingBundles.value.error) return <SingleNotice variant='error' title='Error Sending Bundle' description={<p class='font-medium w-full break-all'>{outstandingBundles.value.error.message}</p>} />

	const network = bouquetNetwork.value // provider.value ? getNetwork(bouquetSettings.value, provider.value.chainId) : undefined
	const blockExplorerBaseUrl = network !== undefined ? network.blockExplorer : undefined

	return (
		<div class='flex flex-col-reverse gap-4'>
			{outstandingBundles.value.success
				? <SingleNotice variant='success' title= { network.relayMode === 'mempool' ? 'Transactions included!' : 'Bundle Included!' } description={<div>
						<h3 class='text-md'><b>{outstandingBundles.value.success.transactions.length}</b> { `transactions were included in block${ outstandingBundles.value.success.includedInBlocks.length > 1 ? 's' : '' }` } <b>{ outstandingBundles.value.success.includedInBlocks.join(',') }</b></h3>
						<div class='flex flex-col gap-1 py-1'>
							{outstandingBundles.value.success.transactions.map((tx, index) => blockExplorerBaseUrl
								? <p class='flex items-center gap-2'><b>#{index}</b><a class='underline text-white/50 flex items-center gap-2' href={`${blockExplorerBaseUrl}tx/${tx.hash}`} target="_blank">{tx.hash}<svg aria-hidden="true" class='h-6' fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"> <path d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" stroke-linecap="round" stroke-linejoin="round"></path></svg></a></p>
								: <p><b>#{index}</b> <span class='semibold text-white/50'>{tx.hash}</span></p>
							)}
						</div>
					</div>} />
				: Object.values(outstandingBundles.value.bundles).map((bundle) => <div class='flex items-center gap-2 text-white'>
						<svg class='animate-spin h-4 w-4 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
							<circle class='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' stroke-width='4'></circle>
							<path class='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
						</svg>
						<p>Attempting to get { network.relayMode === 'mempool' ? 'transactions' : 'bundle' } included before block {bundle.targetBlock.toString(10)} with max fee of {Number(formatUnits(bundle.gas.baseFee + bundle.gas.priorityFee, 'gwei')).toPrecision(3)} gwei per gas</p>
					</div>
			)}
		</div>
	)
}

export const Submit = ({
	provider,
	bundle,
	fundingAmountMin,
	signers,
	bouquetSettings,
	blockInfo,
}: {
	provider: Signal<ProviderStore | undefined>
	bundle: Signal<Bundle | undefined>
	signers: Signal<Signers>
	fundingAmountMin: ReadonlySignal<bigint>
	bouquetSettings: Signal<BouquetSettings>
	blockInfo: Signal<BlockInfo>
}) => {
	const bouquetNetwork = useComputed(() => getNetwork(bouquetSettings.value, provider.value?.chainId || 1n))

	// General component state
	const showSettings = useSignal<boolean>(false)

	const missingRequirements = useComputed(() => {
		if (!bundle.value) return 'No transactions imported yet.'
		const missingSigners = bundle.value.uniqueSigners.length !== Object.keys(signers.value.bundleSigners).length
		const insufficientBalance = signers.value.burnerBalance < fundingAmountMin.value
		if (missingSigners && insufficientBalance) return 'Missing private keys for signing accounts and funding wallet has insufficent balance.'
		if (missingSigners) return 'Missing private keys for signing accounts.'
		if (insufficientBalance) return 'Funding wallet has insufficent balance.'
		return false
	})

	// Simulations
	const { value: simulationPromise, waitFor: waitForSimulation } = useAsyncState<SimulationResponseSuccess>()

	async function simulateCallback() {
		if (!provider.value) throw 'User not connected'
		if (!bundle.value) throw 'No imported bundle found'
		const simulationResult = await simulateBundle(
			bundle.value,
			fundingAmountMin.peek(),
			provider.value,
			signers.peek(),
			blockInfo.peek(),
			getNetwork(bouquetSettings.peek(), provider.value.chainId)
		)
		if ('error' in simulationResult) throw new Error((simulationResult as RelayResponseError).error.message)
		else return simulationResult
	}

	// Submissions
	const submissionStatus = useSignal<{ active: boolean, lastBlock: bigint, timesSubmited: number }>({ active: false, lastBlock: 0n, timesSubmited: 0 })
	const outstandingBundles = useSignal<PendingBundle>({ bundles: {} })

	useSignalEffect(() => {
		if (blockInfo.value.blockNumber > submissionStatus.value.lastBlock) {
			bundleSubmission(blockInfo.value.blockNumber)
		}
	})

	async function bundleSubmission(blockNumber: bigint) {
		submissionStatus.value = { ...submissionStatus.peek(), lastBlock: blockNumber }

		if (!provider.value) throw new Error('User not connected')
		if (!bundle.value) throw new Error('No imported bundle found')
		const providerStore = provider.value

		// Check status of current bundles
		const checkedPending = await Promise.all(Object.keys(outstandingBundles.peek().bundles).map(bundleHash => checkBundleInclusion(outstandingBundles.peek().bundles[bundleHash].transactions, providerStore)))
		const included = checkedPending.filter(checkedPending => checkedPending.included)
		if (included.length > 0) {
			// We done!
			batch(() => {
				const checkedBundles = Object.keys(outstandingBundles.peek().bundles).reduce((checked: {
					[bundleHash: string]: {
						targetBlock: bigint,
						gas: { priorityFee: bigint, baseFee: bigint }
						transactions: { signedTransaction: string, hash: string, account: string, nonce: bigint }[]
						included: boolean
						includedInBlocks: bigint[]
					}
				}, current, index) => {
					if (checkedPending[index].included) {
						checked[current] = { ...outstandingBundles.peek().bundles[current], includedInBlocks: checkedPending[index].includedInBlocks }
						checked[current].included = checkedPending[index].included
					}
					return checked
				}, {})
				outstandingBundles.value = {
					error: outstandingBundles.peek().error,
					bundles: checkedBundles,
					success: Object.values(checkedBundles).find(x => x.included)
				}
				submissionStatus.value = { active: false, lastBlock: blockNumber, timesSubmited: 0 }
				simulationPromise.value = { ...simulationPromise.value, state: 'inactive' }
			})
		} else {
			if (bouquetNetwork.peek().relayMode === 'mempool' && submissionStatus.peek().timesSubmited > 0) return // don't resubmit on mempool mode
			// Remove old submissions
			outstandingBundles.value = {
				error: outstandingBundles.peek().error,
				success: outstandingBundles.peek().success,
				bundles: Object.keys(outstandingBundles.peek().bundles)
					.filter(tx => outstandingBundles.peek().bundles[tx].targetBlock + 1n > blockNumber)
					.reduce((obj: {
						[bundleHash: string]: {
							targetBlock: bigint,
							gas: { priorityFee: bigint, baseFee: bigint }
							transactions: { signedTransaction: string, hash: string, account: string, nonce: bigint }[]
							included: boolean
						}
					}, bundleHash) => {
						obj[bundleHash] = outstandingBundles.peek().bundles[bundleHash]
						return obj
					}, {})
			}

			// Try Submit
			if (submissionStatus.value.active && !outstandingBundles.value.success) {
				submissionStatus.value = { ...submissionStatus.peek(), timesSubmited: submissionStatus.peek().timesSubmited + 1 }
				try {
					const targetBlock = blockNumber + bouquetNetwork.peek().blocksInFuture
					const gas = blockInfo.peek()
					gas.priorityFee = bouquetNetwork.value.priorityFee
					const bundleRequest = await sendBundle(
						bundle.value,
						targetBlock,
						fundingAmountMin.peek(),
						provider.value,
						signers.peek(),
						blockInfo.peek(),
						bouquetNetwork.peek()
					)

					if (!(bundleRequest.bundleIdentifier in outstandingBundles.peek().bundles)) {
						outstandingBundles.value = { ...outstandingBundles.peek(),  bundles: {...outstandingBundles.peek().bundles, [bundleRequest.bundleIdentifier]: { targetBlock, gas, transactions: bundleRequest.bundleTransactions, included: false } } }
					}
				} catch (err) {
					console.error('SendBundle error', err)
					const error = err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' ? new Error(err.message) : new Error('Unknown Error')
					batch(() => {
						submissionStatus.value = { active: false, lastBlock: blockNumber, timesSubmited: submissionStatus.peek().timesSubmited }
						outstandingBundles.value = { ...outstandingBundles.peek(), error }
					})
				}
			}
		}
	}

	async function toggleSubmission() {
		batch(() => {
			simulationPromise.value = { ...simulationPromise.value, state: 'inactive' }
			outstandingBundles.value = { bundles: !outstandingBundles.peek().success ? outstandingBundles.peek().bundles : {}, error: undefined, success: submissionStatus.peek().active ? outstandingBundles.peek().success : undefined }
			submissionStatus.value = { ...submissionStatus.peek(), active: !submissionStatus.peek().active }
		})
		bundleSubmission(blockInfo.peek().blockNumber)
	}

	return (
		<>
			<h2 className='font-bold text-2xl'><span class='text-gray-500'>3.</span> Submit</h2>
			<SettingsModal display={showSettings} bouquetNetwork={bouquetNetwork} bouquetSettings={bouquetSettings}/>
			{!outstandingBundles.value.success && missingRequirements.value ? (
				<p>{missingRequirements.peek()}</p>
			) : (
				<div className='flex flex-col w-full gap-4'>
					<div>
						{ bouquetNetwork.value.relayMode === 'mempool' ? <>
								<div style = 'padding-bottom: 10px;'>
									<SingleNotice variant = 'warn' title = 'Mempool mode is dangerous' description = { `You are currently using Mempool mode. When mempool mode is enabled. The transactions are sent as individual transactions. This means it's possible that only one of the transactions might end up on the chain. Use this mode only if a relay is not available for the network.`} />
								</div>
								<p><span className='font-bold'>Gas:</span> {formatUnits(getMaxBaseFeeInFutureBlock(blockInfo.value.baseFee, bouquetNetwork.value.blocksInFuture), 'gwei')} gwei + {formatUnits(bouquetNetwork.value.priorityFee.toString(), 'gwei')} gwei priority</p>
								<p><span className='font-bold'>Transaction Submit RPC:</span> { bouquetNetwork.value.mempoolSubmitRpcEndpoint }</p>
							</> : <>
								<p><span className='font-bold'>Gas:</span> {formatUnits(getMaxBaseFeeInFutureBlock(blockInfo.value.baseFee, bouquetNetwork.value.blocksInFuture), 'gwei')} gwei + {formatUnits(bouquetNetwork.value.priorityFee.toString(), 'gwei')} gwei priority</p>
								<p><span className='font-bold'>Relays:</span> simulation:{bouquetNetwork.value.simulationRelayEndpoint}, submit:{bouquetNetwork.value.submissionRelayEndpoint} (Block {blockInfo.value.blockNumber.toString()})</p>
								<p>Transactions will be attempt to be included in the block {bouquetNetwork.value.blocksInFuture.toString()} blocks from now.</p>
							</>
						}

						<p>You can edit these settings <button className='font-bold underline' onClick={() => showSettings.value = true}>here</button>.</p>
					</div>
					<div className='flex flex-row gap-6'>
						{ bouquetNetwork.value.relayMode === 'relay' ? <><Button onClick={() => waitForSimulation(simulateCallback)} disabled={simulationPromise.value.state === 'pending'} variant='secondary'>Simulate</Button> </> : <></> }
						<Button onClick={toggleSubmission}>
							{submissionStatus.value.active ? (bouquetNetwork.value.relayMode === 'relay' ? `Stop submitting to relay` : `Stop tracking the transactions`) : `Submit to ${ bouquetNetwork.value.relayMode }`}</Button>
					</div>
					<SimulationResult state={simulationPromise} />
					<Bundles outstandingBundles={outstandingBundles} bouquetNetwork={bouquetNetwork}/>
				</div>
			)}
		</>
	)
}
