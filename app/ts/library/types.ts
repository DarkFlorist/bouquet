import { providers, Wallet } from 'ethers'
import { GetSimulationStackReply } from './interceptor-types.js'

declare global {
	interface Window {
		ethereum?: providers.ExternalProvider
	}
}

export type BlockInfo = { blockNumber: bigint; baseFee: bigint; priorityFee: bigint }
export type BundleState = { payload: GetSimulationStackReply; containsFundingTx: boolean; totalGas: bigint; inputValue: bigint; uniqueSigners: string[] }
export type AppSettings = { blocksInFuture: bigint; priorityFee: bigint; relayEndpoint: string }
export type Signers = { burner: Wallet | undefined; burnerBalance: bigint; bundleSigners: { [account: string]: Wallet } }

export type PromiseState = 'pending' | 'resolved' | 'rejected'
export type BundleInfo = { hash: string; state: PromiseState; details: string }
