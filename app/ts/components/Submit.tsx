import { createBundleTransactions, createProvider, sendBundle, simulate } from '../library/bundleUtils.js'
import { latestBlock } from '../store.js'
import { useMemo, useState } from 'preact/hooks'
import { FlashbotsBundleProvider, SimulationResponse } from '../library/flashbots-ethers-provider.js'
import { Button } from './Button.js'

const PromiseBlock = ({ state }: { state: { status: 'pending' | 'resolved' | 'rejected'; value?: SimulationResponse | Error } | undefined }) => {
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
	const bundle = useMemo(() => createBundleTransactions(), [latestBlock.value])
	const [result, setResult] = useState<{ status: 'pending' | 'resolved' | 'rejected'; value?: SimulationResponse | Error } | undefined>(undefined)

	let flashbotsProvider: FlashbotsBundleProvider

	async function simulateBundle() {
		if (!flashbotsProvider) {
			flashbotsProvider = await createProvider()
		}
		setResult({ status: 'pending' })
		simulate(flashbotsProvider)
			.then(value => setResult({ status: 'resolved', value }))
			.catch(value => setResult({ status: 'rejected', value }))
	}

	async function submitBundle() {
		if (!flashbotsProvider) {
			flashbotsProvider = await createProvider()
		}
		sendBundle(flashbotsProvider)
	}

	return (
		<article class='p-6 max-w-screen-lg w-full flex flex-col gap-6'>
			<h2
				class='font-extrabold
		 text-3xl'
			>
				Review And Submit
			</h2>

			<div class='flex flex-col w-full gap-6'>
				<h3 class='text-xl'> @TODO: this section</h3>
				<div class='flex-col flex gap-4'>
					{bundle.map((tx: any, index: number) => (
						<ul class='rounded bg-secondary p-4'>
							<li>#{index}</li>
							<li>From: {tx.transaction.from}</li>
							<li>To: {tx.transaction.to}</li>
							<li>Value: {tx.transaction.value}</li>
							<li class='w-full break-all'>Input: {tx.transaction.data}</li>
						</ul>
					))}
				</div>
				<Button onClick={simulateBundle}>Simulate</Button>
				<PromiseBlock state={result} />
				<Button onClick={submitBundle}>Submit</Button>
				<p>Once bundle has been submitted and mined then state + localStorage should get cleaned up - for now manually clear Cookies + Site Data</p>
			</div>
		</article>
	)
}
