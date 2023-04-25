import { utils } from 'ethers'
import { createProvider, getMaxBaseFeeInFutureBlock, sendBundle, simulate } from '../library/bundleUtils.js'
import { FlashbotsBundleProvider, FlashbotsBundleResolution, RelayResponseError, SimulationResponseSuccess } from '../library/flashbots-ethers-provider.js'
import { Button } from './Button.js'
import { ReadonlySignal, Signal, useComputed, useSignal, useSignalEffect } from '@preact/signals'
import { AppSettings, BlockInfo, BundleInfo, BundleState, Signers } from '../library/types.js'
import { ProviderStore } from '../library/provider.js'
import { SettingsModal } from './Settings.js'
import { useAsyncState, AsyncProperty } from '../library/asyncState.js'

const SimulationResult = ({
	state
}: {
	state: Signal<AsyncProperty<SimulationResponseSuccess>>
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
		console.log(state.value)
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
	interceptorPayload,
	fundingAmountMin,
	signers,
	appSettings,
	blockInfo,
}: {
	provider: Signal<ProviderStore | undefined>
	interceptorPayload: Signal<BundleState | undefined>
	signers: Signal<Signers>
	fundingAmountMin: ReadonlySignal<bigint>
	appSettings: Signal<AppSettings>
	blockInfo: Signal<BlockInfo>
}) => {
	const { value: simulationPromise, waitFor: waitForSimulation } = useAsyncState<SimulationResponseSuccess>()

	const flashbotsProvider = useSignal<FlashbotsBundleProvider | undefined>(undefined)
	const showSettings = useSignal<boolean>(false)

	const bundleStatus = useSignal<{ lastBlock: bigint; active: boolean; pendingBundles: BundleInfo[] }>({
		active: false,
		lastBlock: blockInfo.peek().blockNumber,
		pendingBundles: [],
	})

	useSignalEffect(() => {
		blockInfo.value.blockNumber // trigger effect
		if (bundleStatus.peek().active && blockInfo.value.blockNumber > bundleStatus.peek().lastBlock) {
			bundleSubmission(blockInfo.value.blockNumber)
		}
	})

	const missingRequirements = useComputed(() => {
		if (!interceptorPayload.value) return 'No transactions imported yet.'
		const missingSigners = interceptorPayload.value.uniqueSigners.length !== Object.keys(signers.value.bundleSigners).length
		const insufficientBalance = signers.value.burnerBalance < fundingAmountMin.value
		if (missingSigners && insufficientBalance) return 'Missing private keys for signing accounts and funding wallet has insufficent balance.'
		if (missingSigners) return 'Missing private keys for signing accounts.'
		if (insufficientBalance) return 'Funding wallet has insufficent balance.'
		return false
	})

	async function ensureRelayProvider() {
		const relay = appSettings.peek().relayEndpoint
		return flashbotsProvider.value && flashbotsProvider.value.connection.url === relay ? flashbotsProvider.value : await createProvider(provider, relay)
	}

	async function simulateBundle() {
		try {
			const relayProvider = await ensureRelayProvider()
			if (!flashbotsProvider.value) flashbotsProvider.value = relayProvider
			if (!provider.value) throw 'User not connected'
			if (!interceptorPayload.value) throw 'No imported bundle found'
			const simulationResult = await simulate(
				relayProvider,
				provider.value.provider,
				blockInfo.peek(),
				appSettings.peek().blocksInFuture,
				interceptorPayload.value,
				signers.peek(),
				fundingAmountMin.peek(),
			)
			if ('error' in simulationResult) throw new Error((simulationResult as RelayResponseError).error.message)
			else return simulationResult
		} catch (error) {
			console.error({ error })
			throw error
		}

	}

	async function bundleSubmission(blockNumber: bigint) {
		const relayProvider = await ensureRelayProvider()
		if (!flashbotsProvider.value) flashbotsProvider.value = relayProvider
		if (!provider.value) throw 'User not connected'
		if (!interceptorPayload.value) throw 'No imported bundle found'

		const bundleSubmission = await sendBundle(
			relayProvider,
			provider.value.provider,
			{ ...blockInfo.peek(), blockNumber },
			appSettings.peek().blocksInFuture,
			interceptorPayload.value,
			signers.peek(),
			fundingAmountMin.peek(),
		).catch(() => {
			bundleStatus.value = {
				active: bundleStatus.value.active,
				lastBlock: blockNumber,
				pendingBundles: [...bundleStatus.value.pendingBundles, { hash: '', state: 'rejected', details: `RPC Error: ${blockNumber.toString()}` }],
			}
		})

		if (bundleSubmission) {
			bundleStatus.value = {
				active: bundleStatus.value.active,
				lastBlock: blockNumber,
				pendingBundles: [...bundleStatus.value.pendingBundles, { hash: bundleSubmission.bundleHash, state: 'pending', details: blockNumber.toString() }],
			}

			const status = await bundleSubmission.wait()
			console.log(`Status for ${bundleSubmission.bundleHash}: ${FlashbotsBundleResolution[status]}`)

			if (status === FlashbotsBundleResolution.BundleIncluded) {
				const pendingBundles = bundleStatus.value.pendingBundles
				const index = pendingBundles.findIndex(({ hash }) => hash === bundleSubmission.bundleHash)
				pendingBundles[index] = { hash: bundleSubmission.bundleHash, state: 'resolved', details: `Bundle Included` }
				bundleStatus.value = { ...bundleStatus.value, active: false, pendingBundles }
			} else {
				const pendingBundles = bundleStatus.value.pendingBundles
				const index = pendingBundles.findIndex(({ hash }) => hash === bundleSubmission.bundleHash)
				pendingBundles[index] = { hash: bundleSubmission.bundleHash, state: 'resolved', details: `${FlashbotsBundleResolution[status]}` }
				bundleStatus.value = { ...bundleStatus.value, pendingBundles }
			}
		}
	}

	async function toggleSubmission() {
		if (!bundleStatus.peek().active) {
			const relayProvider = await ensureRelayProvider()
			if (!flashbotsProvider.value) flashbotsProvider.value = relayProvider
			if (!provider.value) throw 'User not connected'
			if (!interceptorPayload.value) throw 'No imported bundle found'
			bundleStatus.value = {
				active: true,
				lastBlock: bundleStatus.value.lastBlock,
				pendingBundles: bundleStatus.value.pendingBundles.filter((x) => x.state === 'pending'),
			}
			bundleSubmission(blockInfo.value.blockNumber)
		} else {
			bundleStatus.value = { ...bundleStatus.value, active: false }
		}
	}

	function showSettingsModal() {
		showSettings.value = true
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
						<p>You can edit these settings <button className='font-bold underline' onClick={showSettingsModal}>here</button>.</p>
					</div>
					<div className='flex flex-row gap-6'>
						<Button onClick={() => waitForSimulation(simulateBundle)} disabled={simulationPromise.value.state === 'pending'} variant='secondary'>Simulate</Button>
						<Button onClick={toggleSubmission}>{bundleStatus.value.active ? 'Stop' : 'Submit'}</Button>
					</div>
					<SimulationResult state={simulationPromise} />
					<Bundles pendingBundles={bundleStatus} appSettings={appSettings} />
				</div>
			)}
		</>
	)
}
