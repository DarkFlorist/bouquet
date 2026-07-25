import { EtherSymbol, formatEther, formatUnits } from 'ethers'
import { batch, ReadonlySignal, Signal, useComputed, useSignal, useSignalEffect } from '@preact/signals'
import { getFutureFeeProjection } from '../library/bundleUtils.js'
import { Button } from './Button.js'
import { BlockInfo, Bundle, Signers } from '../types/types.js'
import { ProviderStore } from '../library/provider.js'
import { SettingsModal } from './Settings.js'
import { useAsyncState, AsyncProperty } from '../library/asyncState.js'
import { simulateBundle, sendBundle, checkBundleInclusion, SimulationResponseSuccess } from '../library/flashbots.js'
import { SingleNotice } from './Warns.js'
import { BouquetNetwork, BouquetSettings } from '../types/bouquetTypes.js'
import { getNetwork } from '../constants.js'
import { validateBundle } from '../library/bundleValidation.js'
import { describeBundleTarget, getBundleTargetBlocks, hasTargetBlockBeenMined, latestBundleTarget, shouldSubmitForBlock } from '../library/submission.js'
import { useEffect } from 'preact/hooks'

type PendingBundle = {
	bundles: {
		[bundleIdentifier: string]: {
			bundleHash: string,
			targetBlock: bigint,
			gas: { priorityFee: bigint, baseFee: bigint }
			transactions: { signedTransaction: string, hash: string, account: string, nonce: bigint }[]
			included: boolean
		}
	}
	missedTargets: { targetBlock: bigint, diagnostic: string }[]
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
							<span class='bg-black px-2 py-1 font-mono font-medium'>{'error' in state.value.value.firstRevert ? JSON.stringify(state.value.value.firstRevert.error) : 'Unknown'}</span>
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
	blockInfo,
}: {
	outstandingBundles: Signal<PendingBundle>,
	bouquetNetwork: Signal<BouquetNetwork>,
	blockInfo: ReadonlySignal<BlockInfo>,
}) => {
	if (outstandingBundles.value.error) return <SingleNotice variant='error' title='Error Sending Bundle' description={<p class='font-medium w-full break-all'>{outstandingBundles.value.error.message}</p>} />

	const blockExplorerBaseUrl = bouquetNetwork.value !== undefined ? bouquetNetwork.value.blockExplorer : undefined
	const latestPendingBundle = latestBundleTarget(Object.values(outstandingBundles.value.bundles))

	return (
		<div class='flex flex-col gap-3'>
			{outstandingBundles.value.success
				? <SingleNotice variant='success' title= { bouquetNetwork.value.relayMode === 'mempool' ? 'Transactions included!' : 'Bundle Included!' } description={<div>
						<h3 class='text-md'><b>{outstandingBundles.value.success.transactions.length}</b> { `transactions were included in block${ outstandingBundles.value.success.includedInBlocks.length > 1 ? 's' : '' }` } <b>{ outstandingBundles.value.success.includedInBlocks.join(',') }</b></h3>
						<div class='flex flex-col gap-1 py-1'>
							{outstandingBundles.value.success.transactions.map((tx, index) => blockExplorerBaseUrl
								? <p class='flex items-center gap-2'><b>#{index}</b><a class='underline text-white/50 flex items-center gap-2' href={`${blockExplorerBaseUrl}tx/${tx.hash}`} target="_blank">{tx.hash}<svg aria-hidden="true" class='h-6' fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"> <path d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" stroke-linecap="round" stroke-linejoin="round"></path></svg></a></p>
								: <p><b>#{index}</b> <span class='semibold text-white/50'>{tx.hash}</span></p>
							)}
						</div>
					</div>} />
				: <>
					{outstandingBundles.value.missedTargets.slice(-5).map(({ targetBlock, diagnostic }) => <p key={targetBlock.toString()} class='text-sm text-white/60'>Bundle for block {targetBlock.toString()} was not included. {diagnostic}</p>)}
					{latestPendingBundle === undefined ? null : <div class='flex items-center gap-2 text-white'>
						<svg class='animate-spin h-4 w-4 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
							<circle class='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' stroke-width='4'></circle>
							<path class='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
						</svg>
						<p>{describeBundleTarget(blockInfo.value.blockNumber, latestPendingBundle.targetBlock)} Max fee: {Number(formatUnits(latestPendingBundle.gas.baseFee + latestPendingBundle.gas.priorityFee, 'gwei')).toPrecision(3)} gwei per gas.</p>
					</div>}
				</>
			}
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
	const futureFeeProjection = useComputed(() => getFutureFeeProjection(blockInfo.value, bouquetNetwork.value))

	// General component state
	const showSettings = useSignal<boolean>(false)

	const missingRequirements = useComputed(() => {
		if (!bundle.value) return 'No transactions imported yet.'
		const validationError = validateBundle(bundle.value)
		if (validationError !== undefined) return validationError
		if (bundle.value.rescueMode && bouquetNetwork.value.relayMode !== 'relay') return 'EIP-7702 rescue bundles require a private relay network.'
		const missingSigners = bundle.value.uniqueSigners.some((address) => signers.value.bundleSigners[address] === undefined)
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
		const network = getNetwork(bouquetSettings.peek(), provider.value.chainId)
		const targetBlock = blockInfo.peek().blockNumber + network.blocksInFuture
		const simulationResult = await simulateBundle(
			bundle.value,
			fundingAmountMin.peek(),
			provider.value,
			signers.peek(),
			blockInfo.peek(),
			targetBlock,
			network
		)
		if ('error' in simulationResult) throw new Error(simulationResult.error.message)
		else return simulationResult
	}

	// Submissions
	const submissionStatus = useSignal<{ active: boolean, lastBlock: bigint, timesSubmited: number }>({ active: false, lastBlock: 0n, timesSubmited: 0 })
	const submissionInProgress = useSignal(false)
	const outstandingBundles = useSignal<PendingBundle>({ bundles: {}, missedTargets: [] })

	useSignalEffect(() => {
		const blockNumber = blockInfo.value.blockNumber
		if (!submissionStatus.value.active || provider.value === undefined || bundle.value === undefined) return
		void runBundleSubmission(blockNumber)
	})

	useEffect(() => {
		let stopFastBlockPolling: (() => void) | undefined
		const synchronizeFastBlockPolling = () => {
			stopFastBlockPolling?.()
			stopFastBlockPolling = undefined
			const providerStore = provider.peek()
			if (!submissionStatus.peek().active || providerStore === undefined) return
			stopFastBlockPolling = providerStore.startFastBlockPolling((error) => {
				if (submissionStatus.peek().active) setSubmissionError(error)
			})
		}
		const unsubscribeFromSubmissionStatus = submissionStatus.subscribe(synchronizeFastBlockPolling)
		const unsubscribeFromProvider = provider.subscribe(synchronizeFastBlockPolling)
		return () => {
			unsubscribeFromSubmissionStatus()
			unsubscribeFromProvider()
			stopFastBlockPolling?.()
		}
	}, [])

	function setSubmissionError(error: unknown) {
		const submissionError = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
			? new Error(error.message)
			: new Error('Unexpected error while processing bundle submission.')
		batch(() => {
			submissionStatus.value = { ...submissionStatus.peek(), active: false }
			outstandingBundles.value = { ...outstandingBundles.peek(), error: submissionError }
		})
	}

	async function runBundleSubmission(blockNumber: bigint) {
		if (!shouldSubmitForBlock({
			active: submissionStatus.peek().active,
			inProgress: submissionInProgress.peek(),
			lastBlock: submissionStatus.peek().lastBlock,
			currentBlock: blockNumber,
		})) return
		submissionInProgress.value = true
		try {
			await bundleSubmission(blockNumber)
		} catch (error) {
			setSubmissionError(error)
		} finally {
			submissionInProgress.value = false
		}
	}

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
						bundleHash: string,
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
						missedTargets: outstandingBundles.peek().missedTargets,
						success: Object.values(checkedBundles).find(x => x.included)
				}
				submissionStatus.value = { active: false, lastBlock: blockNumber, timesSubmited: 0 }
				simulationPromise.value = { ...simulationPromise.value, state: 'inactive' }
			})
		} else {
			if (bouquetNetwork.peek().relayMode === 'mempool' && submissionStatus.peek().timesSubmited > 0) return // don't resubmit on mempool mode
			// Remove old submissions
			const currentOutstandingBundles = outstandingBundles.peek()
			const expiredBundles = Object.values(currentOutstandingBundles.bundles).filter((pendingBundle) => hasTargetBlockBeenMined(blockNumber, pendingBundle.targetBlock))
			const missedTargets = new Map(currentOutstandingBundles.missedTargets.map((missedTarget) => [missedTarget.targetBlock, missedTarget]))
			for (const expiredBundle of expiredBundles) {
				missedTargets.set(expiredBundle.targetBlock, {
					targetBlock: expiredBundle.targetBlock,
					diagnostic: bouquetNetwork.peek().relayMode === 'relay' ? 'The relay accepted the bundle submission.' : '',
				})
			}
			outstandingBundles.value = {
				error: currentOutstandingBundles.error,
				success: currentOutstandingBundles.success,
				missedTargets: [...missedTargets.values()].sort((left, right) => left.targetBlock < right.targetBlock ? -1 : left.targetBlock > right.targetBlock ? 1 : 0).slice(-10),
				bundles: Object.keys(currentOutstandingBundles.bundles)
					.filter(tx => !hasTargetBlockBeenMined(blockNumber, currentOutstandingBundles.bundles[tx].targetBlock))
					.reduce((obj: {
						[bundleHash: string]: {
							bundleHash: string,
							targetBlock: bigint,
							gas: { priorityFee: bigint, baseFee: bigint }
							transactions: { signedTransaction: string, hash: string, account: string, nonce: bigint }[]
							included: boolean
						}
					}, bundleHash) => {
							obj[bundleHash] = currentOutstandingBundles.bundles[bundleHash]
						return obj
					}, {})
			}
			// Try Submit
			if (submissionStatus.value.active && !outstandingBundles.value.success) {
				submissionStatus.value = { ...submissionStatus.peek(), timesSubmited: submissionStatus.peek().timesSubmited + 1 }
				try {
					const network = bouquetNetwork.peek()
					const targetBlocks = getBundleTargetBlocks(blockNumber, network.blocksInFuture)
					const { priorityFee, baseFee } = getFutureFeeProjection(blockInfo.peek(), network)
					const gas = { priorityFee, baseFee }
					const bundleRequest = await sendBundle(
						bundle.value,
						targetBlocks,
						fundingAmountMin.peek(),
						provider.value,
						signers.peek(),
						blockInfo.peek(),
						bouquetNetwork.peek()
					)

					const nextBundles = { ...outstandingBundles.peek().bundles }
					for (const submission of bundleRequest.submissions) {
						const attemptIdentifier = `${submission.bundleIdentifier}:${submission.targetBlock.toString()}`
						if (!(attemptIdentifier in nextBundles)) nextBundles[attemptIdentifier] = { bundleHash: submission.bundleIdentifier, targetBlock: submission.targetBlock, gas, transactions: bundleRequest.bundleTransactions, included: false }
					}
					outstandingBundles.value = { ...outstandingBundles.peek(), bundles: nextBundles }
				} catch (err) {
					console.error('SendBundle error', err)
					setSubmissionError(err)
				}
			}
		}
	}

	async function toggleSubmission() {
		const activate = !submissionStatus.peek().active
		batch(() => {
			simulationPromise.value = { ...simulationPromise.value, state: 'inactive' }
			outstandingBundles.value = { bundles: {}, missedTargets: [], error: undefined, success: activate ? undefined : outstandingBundles.peek().success }
			submissionStatus.value = { active: activate, lastBlock: activate ? 0n : submissionStatus.peek().lastBlock, timesSubmited: 0 }
		})
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
						<p><span className='font-bold'>Current block:</span> {blockInfo.value.blockNumber.toString()}</p>
						{ bouquetNetwork.value.relayMode === 'mempool' ? <>
								<div style = 'padding-bottom: 10px;'>
									<SingleNotice variant = 'warn' title = 'Mempool mode is dangerous' description = { `You are currently using Mempool mode. Transactions are sent individually so some transactions may not make it onto the blockchain. This mode should only be used if a priate relay is unavailable for the network. Additionally, if a sweeper is active on your account there is a high risk that rescue attempts may fail, allowing the sweeper to steal your gas funds and other assets. Use this mode only as a last resort when no other options are available.`} />
								</div>
								<p><span className='font-bold'>Gas:</span> {formatUnits(futureFeeProjection.value.baseFee, 'gwei')} gwei + {formatUnits(futureFeeProjection.value.priorityFee, 'gwei')} gwei priority</p>
								<p><span className='font-bold'>Transaction Submit RPC:</span> { bouquetNetwork.value.mempoolSubmitRpcEndpoint }</p>
								<p><span className='font-bold'>Transaction Simulation RPC:</span> { bouquetNetwork.value.mempoolSimulationRpcEndpoint }</p>
							</> : <>
								<p><span className='font-bold'>Gas:</span> {formatUnits(futureFeeProjection.value.baseFee, 'gwei')} gwei + {formatUnits(futureFeeProjection.value.priorityFee, 'gwei')} gwei priority</p>
								<div class='grid gap-2 py-2 md:grid-cols-2'>
									<div class='flex min-w-0 flex-col gap-1 border border-white/20 bg-white/5 p-3'>
										<span class='text-xs font-semibold uppercase tracking-wide text-white/50'>Simulation relay</span>
										<span class='break-all font-mono text-xs text-white/80'>{bouquetNetwork.value.simulationRelayEndpoint}</span>
									</div>
									<div class='flex min-w-0 flex-col gap-1 border border-white/20 bg-white/5 p-3'>
										<span class='text-xs font-semibold uppercase tracking-wide text-white/50'>Submission relay</span>
										<span class='break-all font-mono text-xs text-white/80'>{bouquetNetwork.value.submissionRelayEndpoint}</span>
									</div>
								</div>
								<p>Transactions will be attempt to be included in the block {bouquetNetwork.value.blocksInFuture.toString()} blocks from current block.</p>
							</>
						}

						<p>You can edit these settings <button className='font-bold underline' onClick={() => showSettings.value = true}>here</button>.</p>
					</div>
					<div className='flex flex-row gap-6'>
						<Button onClick={() => waitForSimulation(simulateCallback)} disabled={simulationPromise.value.state === 'pending'} variant='secondary'>Simulate</Button>
						<Button onClick={toggleSubmission}>
							{submissionStatus.value.active ? (bouquetNetwork.value.relayMode === 'relay' ? `Stop submitting to relay` : `Stop tracking the transactions`) : (bouquetNetwork.value.relayMode === 'mempool' ? `Accept the Risks and Submit`: `Submit to ${ bouquetNetwork.value.relayMode }`)}</Button>
					</div>
					<SimulationResult state={simulationPromise} />
					<Bundles outstandingBundles={outstandingBundles} bouquetNetwork={bouquetNetwork} blockInfo={blockInfo}/>
				</div>
			)}
		</>
	)
}
