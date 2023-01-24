import { Payload } from '$lib/types'
import { interceptorPayload } from '$lib/state'

export async function importFromInterceptor() {
	try {
		if (window.ethereum === undefined) throw 'No Wallet'

		// @ts-ignore
		await window.ethereum.request({ method: 'eth_requestAccounts' })

		// @ts-ignore
		const { payload } = await window.ethereum.request({
			method: 'interceptor_getSimulationStack',
			params: ['1.0.0'],
		})

		const parsed = Payload.parse(payload)
		if (parsed.length === 0) throw 'Empty Stack'

		localStorage.setItem('payload', JSON.stringify(parsed))
		interceptorPayload.set(parsed)
	} catch (err: any) {
		if (err === 'No Wallet') {
			return 'Import Error: No Ethereum wallet detected'
		} else if (err === 'Empty Stack') {
			return 'Import Error: You have no transactions on your simulation'
		} else if (err?.code === 4001) {
			return 'Import Error: Wallet connection rejected'
		} else if (err?.code === -32601) {
			return 'Import Error: Wallet does not support returning simulations'
		} else {
			return `Unknown Error: ${JSON.stringify(err)}`
		}
	}
}
