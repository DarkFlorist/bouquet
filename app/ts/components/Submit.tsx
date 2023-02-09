import { useState } from 'preact/hooks'
import { JSX } from 'preact/jsx-runtime'
import { createProvider, sendBundle, simulate } from '../library/bundleUtils.js'
import {
	FlashbotsBundleProvider,
	FlashbotsBundleResolution,
	RelayResponseError,
	SimulationResponse,
	SimulationResponseSuccess,
} from '../library/flashbots-ethers-provider.js'
import { Button } from './Button.js'
import { providers } from 'ethers'
import { ReadonlySignal, Signal, useComputed, useSignal, useSignalEffect } from '@preact/signals'
import { AppSettings, BlockInfo, BundleInfo, BundleState, PromiseState, Signers } from '../library/types.js'

const PromiseBlock = ({
	state,
	pending,
	resolved,
	rejected,
}: {
	state:
		| {
				status: PromiseState
				value?: SimulationResponse
		  }
		| undefined
	pending: () => JSX.Element
	resolved: (value: SimulationResponseSuccess) => JSX.Element
	rejected: (value: RelayResponseError) => JSX.Element
}) => {
	if (!state) return <></>
	if (!state.value || state.status === 'pending') return pending()
	if (state.status === 'resolved') return resolved(state.value as SimulationResponseSuccess)
	if (state.status === 'rejected') return rejected(state.value as RelayResponseError)
	return <></>
}

export const Bundles = ({ pendingBundles }: { pendingBundles: Signal<{ lastBlock: bigint; active: boolean; pendingBundles: BundleInfo[] }> }) => {
	return (
		<div class='flex flex-col gap-4'>
			{pendingBundles.value.pendingBundles.map((bundle) => (
				<div class='flex items-center font-semibold text-white'>
					<div class='w-8 h-8'>
						<span class='relative isolate inline-flex items-center justify-center'>
							<span class='animate-scale absolute z-0 h-8 w-8 rounded-full bg-accent/60'></span>
							<span class='animate-scale animation-delay-1000 absolute z-10 h-8 w-8 rounded-full bg-accent/60'></span>
						</span>
					</div>
					{bundle.details}
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
	provider: Signal<providers.Web3Provider | undefined>
	interceptorPayload: Signal<BundleState | undefined>
	signers: Signal<Signers>
	fundingAmountMin: ReadonlySignal<bigint>
	appSettings: Signal<AppSettings>
	blockInfo: Signal<BlockInfo>
}) => {
	const [simulationResult, setSimulationResult] = useState<
		| {
				status: 'pending' | 'resolved' | 'rejected'
				value?: SimulationResponse
		  }
		| undefined
	>(undefined)

	const flashbotsProvider = useSignal<FlashbotsBundleProvider | undefined>(undefined)

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

	async function simulateBundle() {
		const relayProvider = flashbotsProvider.value ?? (await createProvider(provider))
		if (!flashbotsProvider.value) flashbotsProvider.value = relayProvider
		if (!provider.value) throw 'User not connected'
		if (!interceptorPayload.value) throw 'No imported bundle found'
		setSimulationResult({ status: 'pending' })
		simulate(
			relayProvider,
			provider.value,
			blockInfo.peek(),
			appSettings.peek().blocksInFuture,
			interceptorPayload.value,
			signers.peek(),
			fundingAmountMin.peek(),
		)
			.then((value) => {
				if ((value as RelayResponseError).error) return setSimulationResult({ status: 'rejected', value })
				return setSimulationResult({ status: 'resolved', value })
			})
			.catch((err) => console.log('Unhandled Error: ', err))
	}

	async function bundleSubmission(blockNumber: bigint) {
		const relayProvider = flashbotsProvider.value ?? (await createProvider(provider))
		if (!flashbotsProvider.value) flashbotsProvider.value = relayProvider
		if (!provider.value) throw 'User not connected'
		if (!interceptorPayload.value) throw 'No imported bundle found'

		const bundleSubmission = await sendBundle(
			relayProvider,
			provider.value,
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
			const relayProvider = flashbotsProvider.value ?? (await createProvider(provider))
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
			bundleStatus.value.active = false
		}
	}

	return (
		<>
			<h2 className='font-bold text-2xl'>3. Submit</h2>
			{missingRequirements.value ? (
				<p>{missingRequirements.peek()}</p>
			) : (
				<div className='flex flex-col w-full gap-6'>
					<Button onClick={simulateBundle} variant='secondary'>
						Simulate
					</Button>
					<PromiseBlock
						state={simulationResult}
						pending={() => <div>Pending...</div>}
						resolved={(value: SimulationResponse) => <div>Result: {JSON.stringify(value)}</div>}
						rejected={(value: RelayResponseError) => <div>Error: {value.error.message}</div>}
					/>
					<Button onClick={toggleSubmission}>{bundleStatus.value.active ? 'Stop' : 'Submit'}</Button>
					<Bundles pendingBundles={bundleStatus} />
				</div>
			)}
		</>
	)
}
