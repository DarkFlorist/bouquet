import { Signal } from '@preact/signals'
import { providers } from 'ethers'
import { useState } from 'preact/hooks'
import { GetSimulationStackReply } from '../types.js'
import { Button } from './Button.js'

export async function importFromInterceptor(
	interceptorPayload: Signal<GetSimulationStackReply | undefined>,
	provider: Signal<providers.Web3Provider | undefined>,
) {
	if (!window.ethereum || !window.ethereum.request) throw Error('Import Error: No Ethereum wallet detected')

	await window.ethereum.request({ method: 'eth_requestAccounts' }).catch((err: { code: number }) => {
		if (err.code === 4001) {
			throw new Error('Import Error: Wallet connection rejected')
		} else {
			throw new Error(`Unknown Error: ${JSON.stringify(err)}`)
		}
	})

	provider.value = new providers.Web3Provider(window.ethereum)

	const { payload } = await window.ethereum
		.request({
			method: 'interceptor_getSimulationStack',
			params: ['1.0.0'],
		})
		.catch((err: { code: number }) => {
			if (err?.code === -32601) {
				throw new Error('Import Error: Wallet does not support returning simulations')
			} else {
				throw new Error(`Unknown Error: ${JSON.stringify(err)}`)
			}
		})

	const parsed = GetSimulationStackReply.parse(payload)
	if (parsed.length === 0) throw new Error('Import Error: You have no transactions on your simulation')

	localStorage.setItem('payload', JSON.stringify(GetSimulationStackReply.serialize(parsed)))
	interceptorPayload.value = parsed
}

export const Import = ({
	interceptorPayload,
	provider,
}: {
	interceptorPayload: Signal<GetSimulationStackReply | undefined>
	provider: Signal<providers.Web3Provider | undefined>
}) => {
	const [error, setError] = useState<string | undefined>(undefined)

	return (
		<>
			<h2 className='font-extrabold text-3xl'>Import Transaction Payload</h2>
			<div className='flex flex-col w-full gap-6'>
				<Button onClick={() => importFromInterceptor(interceptorPayload, provider).catch((err: Error) => setError(err.message))}>
					Import Payload from The Interceptor
				</Button>
				{error ? <span>{error}</span> : ''}
				{error && error === 'Import Error: Wallet does not support returning simulations' ? (
					<h3 className='text-xl'>
						Don't have The Interceptor Installed? Install it here{' '}
						<a className='font-bold hover:underline' href='https://dark.florist'>
							here
						</a>
						.
					</h3>
				) : (
					''
				)}
			</div>
		</>
	)
}
