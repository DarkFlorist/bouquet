import { utils } from 'ethers'
import { ReadonlySignal, Signal, useComputed, useSignal, useSignalEffect } from '@preact/signals'
import { getMaxBaseFeeInFutureBlock } from '../library/bundleUtils.js'
import { Button } from './Button.js'
import { AppSettings, BlockInfo, BundleInfo, Bundle, Signers } from '../types/types.js'
import { ProviderStore } from '../library/provider.js'
import { SettingsModal } from './Settings.js'
import { useAsyncState, AsyncProperty } from '../library/asyncState.js'
import { simulateBundle, sendBundle, checkBundleInclusion, SimulationResponse, RelayResponseError } from '../library/flashbots.js'

type PendingBundle = {
	targetBlock: bigint,
	gas: { priorityFee: bigint, baseFee: bigint }
	transactions: { signedTransaction: string, hash: string, account: string, nonce: bigint }[]
}

const SimulationResult = ({
	state
}: {
	state: Signal<AsyncProperty<SimulationResponse>>
}) => {
	if (state.value.state === 'pending') return <div>Simulating...</div>
	if (state.value.state === 'resolved')
		return (
			<div>
				{state.value.value.firstRevert ? (
					<>
						<h3 class='font-semibold text-error mb-2'>A Transaction Reverted During Simulation</h3>
						<div class='flex w-full min-h-[96px] border-2 border-white rounded-xl'>
							<div class='flex w-24 flex-col items-center justify-center text-white border-r-2'>
								<span class='text-lg font-bold'>#{state.value.value.results.findIndex((x) => 'error' in x)}</span>
							</div>
							<div class='bg-card flex w-full justify-center flex-col gap-2 rounded-r-xl p-4 text-sm font-semibold'>
								<div class='flex gap-2 items-center'>
									<span class='w-16 text-right'>From</span>
									<span class='rounded bg-background px-2 py-1 font-mono font-medium'>{state.value.value.firstRevert.fromAddress}</span>
								</div>
								<div class='flex gap-2 items-center'>
									<span class='w-16 text-right'>To</span>
									<span class='rounded bg-background px-2 py-1 font-mono font-medium'>{state.value.value.firstRevert.toAddress}</span>
								</div>
								<div class='flex gap-2 items-center'>
									<span class='w-16 text-right'>Gas Used</span>
									<span class='rounded bg-background px-2 py-1 font-mono font-medium'>{state.value.value.firstRevert.gasUsed} gas</span>
								</div>
								<div class='flex gap-2 items-center'>
									<span class='w-16 text-right'>Error</span>
									<span class='rounded bg-background px-2 py-1 font-mono font-medium'>
										{'error' in state.value.value.firstRevert ? String(state.value.value.firstRevert.error) : 'Unknown'}
									</span>
								</div>
							</div>
						</div>
					</>
				) : (
					<h3 class='font-semibold text-success'>Simulation Succeeded</h3>
				)}
			</div>
		)
	if (state.value.state === 'rejected') {
		return (
			<div>
				<h3 class='font-semibold text-error mb-2'>Simulation Failed</h3>
				<p class='rounded bg-background font-mono font-medium w-full break-all'>{state.value.error.message}</p>
			</div>
		)
	}
	return <></>
}

export const Bundles = ({
	pendingBundles,
	appSettings,
}: {
	pendingBundles: Signal<{ lastBlock: bigint; active: boolean; pendingBundles: BundleInfo[] }>
	appSettings: Signal<AppSettings>
}) => {
	return (
		<div class='flex flex-col-reverse gap-4'>
			{pendingBundles.value.pendingBundles.map((bundle, index) => (
				<div class='flex items-center font-semibold gap-2 text-white'>
					<p>Attempt {index + 1}:</p>
					{bundle.state === 'pending' ? (
						<span class='font-normal text-orange-400'>
							Trying to be included in block {(BigInt(bundle.details) + appSettings.peek().blocksInFuture).toString()}
						</span>
					) : null}
					{bundle.state === 'rejected' ? <span class='font-normal text-error'>Error submitting bundle to node</span> : null}
					{bundle.details === 'BlockPassedWithoutInclusion' ? <span class='font-normal text-error'>Bundle was not included in target block</span> : null}
					{bundle.details === 'AccountNonceTooHigh' ? <span class='font-normal text-error'>Nonces in bundle already used</span> : null}
					{bundle.state === 'resolved' && bundle.details !== 'AccountNonceTooHigh' && bundle.details !== 'BlockPassedWithoutInclusion' ? (
						<span class='font-bold text-lg text-success'>Bundle Included!</span>
					) : null}
				</div>
			))}
		</div>
	)
}

export const Submit = ({
	provider,
	bundle,
	fundingAmountMin,
	signers,
	appSettings,
	blockInfo,
}: {
	provider: Signal<ProviderStore | undefined>
	bundle: Signal<Bundle | undefined>
	signers: Signal<Signers>
	fundingAmountMin: ReadonlySignal<bigint>
	appSettings: Signal<AppSettings>
	blockInfo: Signal<BlockInfo>
}) => {
	const showSettings = useSignal<boolean>(false)

	const submissionStatus = useSignal<{ active: boolean, lastBlock: bigint }>({ active: false, lastBlock: 0n })
	const { value: simulationPromise, waitFor: waitForSimulation } = useAsyncState<SimulationResponse>()

	useSignalEffect(() => {
		if (submissionStatus.value.active && blockInfo.value.blockNumber > submissionStatus.value.lastBlock) {
			bundleSubmission(blockInfo.value.blockNumber)
		}
	})

	const missingRequirements = useComputed(() => {
		if (!bundle.value) return 'No transactions imported yet.'
		const missingSigners = bundle.value.uniqueSigners.length !== Object.keys(signers.value.bundleSigners).length
		const insufficientBalance = signers.value.burnerBalance < fundingAmountMin.value
		if (missingSigners && insufficientBalance) return 'Missing private keys for signing accounts and funding wallet has insufficent balance.'
		if (missingSigners) return 'Missing private keys for signing accounts.'
		if (insufficientBalance) return 'Funding wallet has insufficent balance.'
		return false
	})

	async function simulateCallback() {
		if (!provider.value) throw 'User not connected'
		if (!bundle.value) throw 'No imported bundle found'
		const simulationResult = await simulateBundle(
			bundle.value,
			fundingAmountMin.peek(),
			provider.value,
			signers.peek(),
			blockInfo.peek(),
			appSettings.peek()
		)
		if ('error' in simulationResult) throw new Error((simulationResult as RelayResponseError).error.message)
		else return simulationResult
	}

	const outstandingBundles = useSignal<{ [bundleHash: string]: PendingBundle }>({})

	async function bundleSubmission(blockNumber: bigint) {
		submissionStatus.value = { ...submissionStatus.peek(), lastBlock: blockNumber }

		if (!provider.value) throw new Error('User not connected')
		if (!bundle.value) throw new Error('No imported bundle found')

		// Check status of current bundles
		// @DEV: Checked provider.value above, but LSP thinks it can still be undefined, so we cast it
		const checkedPending = await Promise.all(Object.keys(outstandingBundles.peek()).map(bundleHash => checkBundleInclusion(outstandingBundles.peek()[bundleHash].transactions, provider.value as ProviderStore)))
		const included = checkedPending.filter(checkedPending => checkedPending.included)
		if (included.length > 0) {
			// We done!
			console.log('Included!!!', included)
			submissionStatus.value = { active: false, lastBlock: blockNumber }
		} else {
			// Remove old submissions
			outstandingBundles.value = Object.keys(outstandingBundles.peek())
				.filter(tx => outstandingBundles.peek()[tx].targetBlock >= blockNumber)
				.reduce((obj: { [bundleHash: string]: PendingBundle }, bundleHash) => {
					obj[bundleHash] = outstandingBundles.peek()[bundleHash]
					return obj
				}, {})

			// Try Submit
			try {
				const targetBlock = blockNumber + appSettings.peek().blocksInFuture
				const gas = blockInfo.peek()

				const bundleRequest = await sendBundle(
					bundle.value,
					targetBlock,
					fundingAmountMin.peek(),
					provider.value,
					signers.peek(),
					blockInfo.peek(),
					appSettings.peek()
				)

				if (!(bundleRequest.bundleHash in outstandingBundles.peek())) {
					outstandingBundles.value = { ...outstandingBundles.peek(), [bundleRequest.bundleHash]: { targetBlock, gas, transactions: bundleRequest.bundleTransactions } }
				}
			} catch (error) {
				console.error("sendBundle error", error)
				submissionStatus.value = { active: false, lastBlock: blockNumber }
				throw { message: "Error submitting bundle", error }
			}
		}
	}

	async function toggleSubmission() {
		submissionStatus.value = { ...submissionStatus.peek(), active: !submissionStatus.peek().active }
	}

	return (
		<>
			<h2 className='font-bold text-2xl'>3. Submit</h2>
			<SettingsModal display={showSettings} appSettings={appSettings} />
			{missingRequirements.value ? (
				<p>{missingRequirements.peek()}</p>
			) : (
				<div className='flex flex-col w-full gap-4'>
					<div>
						<p><span className='font-bold'>Gas:</span> {utils.formatUnits(getMaxBaseFeeInFutureBlock(blockInfo.value.baseFee, appSettings.value.blocksInFuture), 'gwei')} gwei + {utils.formatUnits(appSettings.value.priorityFee.toString(), 'gwei')} gwei priority</p>
						<p><span className='font-bold'>Network:</span> {appSettings.value.relayEndpoint}</p>
						<p>Transactions will be attempt to be included in the block {appSettings.value.blocksInFuture.toString()} blocks from now.</p>
						<p>You can edit these settings <button className='font-bold underline' onClick={() => showSettings.value = true}>here</button>.</p>
					</div>
					<div className='flex flex-row gap-6'>
						<Button onClick={() => waitForSimulation(simulateCallback)} disabled={simulationPromise.value.state === 'pending'} variant='secondary'>Simulate</Button>
						<Button onClick={toggleSubmission}>{submissionStatus.value.active ? 'Stop' : 'Submit'}</Button>
					</div>
					<SimulationResult state={simulationPromise} />
					{/* <Bundles pendingBundles={bundleStatus} appSettings={appSettings} /> */}
				</div>
			)}
		</>
	)
}
