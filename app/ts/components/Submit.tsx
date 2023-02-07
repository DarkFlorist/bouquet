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
import { ReadonlySignal, Signal, useSignal } from '@preact/signals'
import { AppSettings, AppStages, BlockInfo, BundleInfo, BundleState, PromiseState, Signers } from '../library/types.js'

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

export const Bundles = ({ pendingBundles }: { pendingBundles: BundleInfo[] }) => {
	return (
		<div class='flex flex-col gap-4'>
			{pendingBundles.map((bundle) => (
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
	stage: Signal<AppStages>
}) => {
	const [simulationResult, setSimulationResult] = useState<
		| {
				status: 'pending' | 'resolved' | 'rejected'
				value?: SimulationResponse
		  }
		| undefined
	>(undefined)

	const flashbotsProvider = useSignal<FlashbotsBundleProvider | undefined>(undefined)

	const bundleStatus = useSignal<{ cancel: (() => void) | undefined; pendingBundles: BundleInfo[] }>({
		cancel: undefined,
		pendingBundles: [],
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

	async function toggleSubmission() {
		if (!bundleStatus.value.cancel) {
			const relayProvider = flashbotsProvider.value ?? (await createProvider(provider))
			if (!flashbotsProvider.value) flashbotsProvider.value = relayProvider
			if (!provider.value) throw 'User not connected'
			if (!interceptorPayload.value) throw 'No imported bundle found'

			bundleStatus.value = {
				cancel: blockInfo.subscribe(async (newBlockInfo) => {
					if (!provider.value || !interceptorPayload.value) return
					const bundleSubmission = await sendBundle(
						relayProvider,
						provider.value,
						blockInfo.peek(),
						appSettings.peek().blocksInFuture,
						interceptorPayload.value,
						signers.peek(),
						fundingAmountMin.peek(),
					).catch((error) => {
						console.log('Error: ', error)
						bundleStatus.value = {
							cancel: bundleStatus.value.cancel,
							pendingBundles: [
								...bundleStatus.value.pendingBundles,
								{ hash: 'None', state: 'rejected', details: `RPC Error: ${newBlockInfo.blockNumber.toString()}` },
							],
						}
					})
					console.log(bundleSubmission)
					if (!bundleSubmission) return
					bundleStatus.value = {
						cancel: bundleStatus.value.cancel,
						pendingBundles: [
							...bundleStatus.value.pendingBundles,
							{ hash: bundleSubmission.bundleHash, state: 'pending', details: newBlockInfo.blockNumber.toString() },
						],
					}

					const status = await bundleSubmission.wait()
					console.log(`Status: ${FlashbotsBundleResolution[status]}`)

					if (status === FlashbotsBundleResolution.BundleIncluded) {
						const pendingBundles = bundleStatus.value.pendingBundles
						const index = pendingBundles.findIndex(({ hash }) => hash === bundleSubmission.bundleHash)
						pendingBundles[index] = { hash: bundleSubmission.bundleHash, state: 'resolved', details: `Bundle Minded` }
						if (bundleStatus.value.cancel) bundleStatus.value.cancel()
						bundleStatus.value = { cancel: undefined, pendingBundles }
					} else {
						const pendingBundles = bundleStatus.value.pendingBundles
						const index = pendingBundles.findIndex(({ hash }) => hash === bundleSubmission.bundleHash)
						pendingBundles[index] = { hash: bundleSubmission.bundleHash, state: 'resolved', details: `${FlashbotsBundleResolution[status]}` }
						bundleStatus.value = { cancel: bundleStatus.value.cancel, pendingBundles }
					}
				}),
				pendingBundles: [],
			}
		} else {
			bundleStatus.value.cancel()
			bundleStatus.value.cancel = undefined
		}
	}

	return (
		<>
			<h2 className='font-extrabold text-3xl'>Submit</h2>
			<div className='flex flex-col w-full gap-6'>
				<Button onClick={simulateBundle}>Simulate</Button>
				<PromiseBlock
					state={simulationResult}
					pending={() => <div>Pending...</div>}
					resolved={(value: SimulationResponse) => <div>Result: {JSON.stringify(value)}</div>}
					rejected={(value: RelayResponseError) => <div>Error: {value.error.message}</div>}
				/>
				<Button onClick={toggleSubmission}>{bundleStatus.value.cancel ? 'Stop' : 'Submit'}</Button>
				<Bundles pendingBundles={bundleStatus.value.pendingBundles} />
				{bundleStatus.value.pendingBundles.map((tx) => (
					<p>{JSON.stringify(tx)}</p>
				))}
				{JSON.stringify(bundleStatus.value)}
				{`Block: ${blockInfo.value.blockNumber.toString()} - BaseFee: ${blockInfo.value.baseFee.toString()}`}
			</div>
		</>
	)
}
