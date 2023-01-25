import { GetSimulationStackReply } from '$lib/types'
import { interceptorPayload } from '$lib/state'

export async function importFromInterceptor() {
	if (!window.ethereum || !window.ethereum.request)
		throw Error('Import Error: No Ethereum wallet detected')

	await window.ethereum
		.request({ method: 'eth_requestAccounts' })
		.catch((err: { code: number }) => {
			if (err.code === 4001) {
				throw Error('Import Error: Wallet connection rejected')
			} else if (err?.code === -32601) {
				throw Error(
					'Import Error: Wallet does not support returning simulations',
				)
			} else {
				throw Error(`Unknown Error: ${JSON.stringify(err)}`)
			}
		})

	const { payload } = await window.ethereum.request({
		method: 'interceptor_getSimulationStack',
		params: ['1.0.0'],
	})

	const parsed = GetSimulationStackReply.parse(payload)
	if (parsed.length === 0)
		throw Error('Import Error: You have no transactions on your simulation')

	localStorage.setItem(
		'payload',
		JSON.stringify(GetSimulationStackReply.serialize(parsed)),
	)
	interceptorPayload.set(parsed)
}
