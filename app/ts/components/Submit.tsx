import { useState } from 'preact/hooks'
import { JSX } from 'preact/jsx-runtime'
import { createBundleSubmission, createProvider, simulate } from '../library/bundleUtils.js'
import { FlashbotsBundleProvider, RelayResponseError, SimulationResponse, SimulationResponseSuccess } from '../library/flashbots-ethers-provider.js'
import { Button } from './Button.js'

const PromiseBlock = ({
	state,
	pending,
	resolved,
	rejected,
}: {
	state:
		| {
				status: 'pending' | 'resolved' | 'rejected'
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

export const Submit = () => {
	const [simulationResult, setSimulationResult] = useState<
		| {
				status: 'pending' | 'resolved' | 'rejected'
				value?: SimulationResponse
		  }
		| undefined
	>(undefined)

	let flashbotsProvider: FlashbotsBundleProvider

	async function simulateBundle() {
		if (!flashbotsProvider) {
			flashbotsProvider = await createProvider()
		}
		setSimulationResult({ status: 'pending' })
		simulate(flashbotsProvider)
			.then((value) => {
				if ((value as RelayResponseError).error) return setSimulationResult({ status: 'rejected', value })
				return setSimulationResult({ status: 'resolved', value })
			})
			.catch((err) => console.log('Unhandled Error: ', err))
	}

	async function submitBundle() {
		if (!flashbotsProvider) {
			flashbotsProvider = await createProvider()
		}
		createBundleSubmission(flashbotsProvider)
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
				<Button onClick={submitBundle}>Submit</Button>
			</div>
		</>
	)
}
