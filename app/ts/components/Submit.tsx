import { useState } from 'preact/hooks'
import { createProvider, sendBundle, simulate } from '../library/bundleUtils.js'
import { FlashbotsBundleProvider, SimulationResponse } from '../library/flashbots-ethers-provider.js'
import { Button } from './Button.js'

const PromiseBlock = ({
	state,
}: {
	state:
		| {
				status: 'pending' | 'resolved' | 'rejected'
				value?: SimulationResponse | Error
		  }
		| undefined
}) => {
	if (!state) return <></>
	switch (state.status) {
		case 'pending':
			return <main>pending</main>
		case 'rejected':
			return <main>Error: {JSON.stringify(state.value)}</main>
		case 'resolved':
			return <main>Result: {JSON.stringify(state.value)}</main>
	}
}

export const Submit = () => {
	const [result, setResult] = useState<
		| {
				status: 'pending' | 'resolved' | 'rejected'
				value?: SimulationResponse | Error
		  }
		| undefined
	>(undefined)

	let flashbotsProvider: FlashbotsBundleProvider

	async function simulateBundle() {
		if (!flashbotsProvider) {
			flashbotsProvider = await createProvider()
		}
		setResult({ status: 'pending' })
		simulate(flashbotsProvider)
			.then((value) => setResult({ status: 'resolved', value }))
			.catch((value) => setResult({ status: 'rejected', value }))
	}

	async function submitBundle() {
		if (!flashbotsProvider) {
			flashbotsProvider = await createProvider()
		}
		sendBundle(flashbotsProvider)
	}

	return (
		<>
			<h2 className='font-extrabold text-3xl'>Submit</h2>
			<div className='flex flex-col w-full gap-6'>
				<Button onClick={simulateBundle}>Simulate</Button>
				<PromiseBlock state={result} />
				<Button onClick={submitBundle}>Submit</Button>
				<p>Once bundle has been submitted and mined then state + localStorage should get cleaned up - for now manually clear Cookies + Site Data</p>
			</div>
		</>
	)
}
