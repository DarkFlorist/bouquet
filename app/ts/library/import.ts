import { GetSimulationStackReply } from '../types.js'
import { interceptorPayload, provider } from '../store.js'
import { providers } from 'ethers'
import { blockCallback } from '../components/App.js'

export async function importFromInterceptor() {
	if (!window.ethereum || !window.ethereum.request)
		throw Error('Import Error: No Ethereum wallet detected')

	await window.ethereum
		.request({ method: 'eth_requestAccounts' })
		.catch((err: { code: number }) => {
			if (err.code === 4001) {
				throw new Error('Import Error: Wallet connection rejected')
			} else {
				throw new Error(`Unknown Error: ${JSON.stringify(err)}`)
			}
		})

	provider.value = new providers.Web3Provider(window.ethereum)
	if (provider.value && provider.value.listenerCount('block') === 0) {
		provider.value.on('block', blockCallback)
	}

	const { payload } = await window.ethereum
		.request({
			method: 'interceptor_getSimulationStack',
			params: ['1.0.0'],
		})
		.catch((err: { code: number }) => {
			if (err?.code === -32601) {
				throw new Error(
					'Import Error: Wallet does not support returning simulations',
				)
			} else {
				throw new Error(`Unknown Error: ${JSON.stringify(err)}`)
			}
		})

	const parsed = GetSimulationStackReply.parse(payload)
	if (parsed.length === 0)
		throw new Error('Import Error: You have no transactions on your simulation')

	localStorage.setItem(
		'payload',
		JSON.stringify(GetSimulationStackReply.serialize(parsed)),
	)
	interceptorPayload.value = parsed
}