import { Wallet } from 'ethers'
import { GetSimulationStackReply } from './interceptor-types.js'

interface Eip1193Provider {
	request(request: { method: string; params?: Array<any> | Record<string, any> }): Promise<any>
	request(request: { method: string; params?: Array<any> | Record<string, any> }): Promise<any>
	on(eventName: string | symbol, listener: (...args: any[]) => void): this
	removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this
}

declare global {
	interface Window {
		ethereum?: Eip1193Provider
	}
}

export type BlockInfo = { blockNumber: bigint; baseFee: bigint; priorityFee: bigint }
export type BundleState = { payload: GetSimulationStackReply; containsFundingTx: boolean; totalGas: bigint; inputValue: bigint; uniqueSigners: string[] }
export type AppSettings = { blocksInFuture: bigint; priorityFee: bigint; relayEndpoint: string }
export type Signers = { burner: Wallet | undefined; burnerBalance: bigint; bundleSigners: { [account: string]: Wallet } }

export type PromiseState = 'pending' | 'resolved' | 'rejected'
export type BundleInfo = { hash: string; state: PromiseState; details: string }
