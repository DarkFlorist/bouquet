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
import { BundleInfo, GetSimulationStackReply, PromiseState } from '../types.js'
import { providers, Wallet } from 'ethers'
import { ReadonlySignal, Signal } from '@preact/signals'

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
	latestBlock,
	provider,
	interceptorPayload,
	signingAccounts,
	wallet,
	bundleContainsFundingTx,
	fundingAmountMin,
}: {
	latestBlock: Signal<{
		blockNumber: bigint
		baseFee: bigint
		priorityFee: bigint
	}>
	provider: Signal<providers.Web3Provider | undefined>
	interceptorPayload: Signal<GetSimulationStackReply | undefined>
	bundleContainsFundingTx: ReadonlySignal<boolean | undefined>
	fundingAmountMin: ReadonlySignal<bigint>
	fundingAccountBalance: Signal<bigint>
	signingAccounts: Signal<{ [account: string]: Wallet }>
	wallet: Signal<Wallet | undefined>
}) => {
	console.log('re remnderrr')
	const [simulationResult, setSimulationResult] = useState<
		| {
				status: 'pending' | 'resolved' | 'rejected'
				value?: SimulationResponse
		  }
		| undefined
	>(undefined)

	const [bundleStatus, setBundleStatus] = useState<{ active: boolean; pendingBundles: BundleInfo[] }>({
		active: false,
		pendingBundles: [],
	})

	const [flashbotsProvider, setFlashbotsProvider] = useState<FlashbotsBundleProvider | undefined>(undefined)

	// effect(() => {
	// 	if (bundleStatus.active && provider.peek() && flashbotsProvider)
	// 		submitBundle(bundleStatus, latestBlock.value, provider.peek() as Web3Provider, flashbotsProvider)
	// })

	async function simulateBundle() {
		const relayProvider = flashbotsProvider ?? (await createProvider(provider))
		if (!flashbotsProvider) setFlashbotsProvider(relayProvider)
		setSimulationResult({ status: 'pending' })
		simulate(
			relayProvider,
			provider.peek(),
			latestBlock.peek().blockNumber,
			2n,
			latestBlock.peek().baseFee,
			latestBlock.peek().priorityFee,
			interceptorPayload.peek(),
			bundleContainsFundingTx.peek() ?? false,
			wallet.peek(),
			signingAccounts.peek(),
			fundingAmountMin.peek(),
		)
			.then((value) => {
				if ((value as RelayResponseError).error) return setSimulationResult({ status: 'rejected', value })
				return setSimulationResult({ status: 'resolved', value })
			})
			.catch((err) => console.log('Unhandled Error: ', err))
	}

	async function submitBundle(
		bundleStatus: { active: boolean; pendingBundles: BundleInfo[] },
		{ blockNumber, baseFee, priorityFee }: { blockNumber: bigint; baseFee: bigint; priorityFee: bigint },
		provider: providers.Web3Provider,
		flashbotsProvider: FlashbotsBundleProvider,
	) {
		console.log('New block, creating new submission', blockNumber)

		const bundleSubmission = await sendBundle(
			flashbotsProvider,
			provider,
			blockNumber,
			2n,
			baseFee,
			priorityFee,
			interceptorPayload.peek(),
			bundleContainsFundingTx.peek() ?? false,
			wallet.peek(),
			signingAccounts.peek(),
			fundingAmountMin.peek(),
		).catch((error) => {
			console.log('Error: ', error)
			setBundleStatus({
				...bundleStatus,
				pendingBundles: [...bundleStatus.pendingBundles, { hash: 'None', state: 'rejected', details: `RPC Error: ${blockNumber.toString()}` }],
			})
		})
		console.log(bundleSubmission)
		if (!bundleSubmission) return
		setBundleStatus({
			...bundleStatus,
			pendingBundles: [...bundleStatus.pendingBundles, { hash: bundleSubmission.bundleHash, state: 'pending', details: blockNumber.toString() }],
		})

		const status = await bundleSubmission.wait()
		console.log(`Status: ${FlashbotsBundleResolution[status]}`)

		if (status === FlashbotsBundleResolution.BundleIncluded) {
			const index = bundleStatus.pendingBundles.findIndex(({ hash }) => hash === bundleSubmission.bundleHash)
			bundleStatus.pendingBundles[index] = { hash: bundleSubmission.bundleHash, state: 'resolved', details: `Bundle Minded` }
			setBundleStatus({ ...bundleStatus, active: false })
		} else {
			const index = bundleStatus.pendingBundles.findIndex(({ hash }) => hash === bundleSubmission.bundleHash)
			bundleStatus.pendingBundles[index] = { hash: bundleSubmission.bundleHash, state: 'rejected', details: `${FlashbotsBundleResolution[status]}` }
			setBundleStatus({ ...bundleStatus })
		}
	}

	async function toggleSubmission() {
		if (!bundleStatus.active) {
			const relayProvider = flashbotsProvider ?? (await createProvider(provider))
			if (!flashbotsProvider) setFlashbotsProvider(relayProvider)
			if (!provider.value) throw new Error('User not connected')

			submitBundle({ ...bundleStatus, active: true }, latestBlock.peek(), provider.value, relayProvider)
		}
		setBundleStatus({ ...bundleStatus, active: !bundleStatus.active })
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
				<Button onClick={toggleSubmission}>{bundleStatus.active ? 'Stop' : 'Submit'}</Button>
				<Bundles pendingBundles={bundleStatus.pendingBundles} />
				{bundleStatus.pendingBundles.map((tx) => (
					<p>{JSON.stringify(tx)}</p>
				))}
				{JSON.stringify(bundleStatus)}
				{`Block: ${latestBlock.peek().blockNumber.toString()} - BaseFee: ${latestBlock.peek().baseFee.toString()}`}
			</div>
		</>
	)
}
