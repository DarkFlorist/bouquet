import { useState } from 'preact/hooks'
import { activeSession, completedSession, fundingAccountBalance, provider, wallet, latestBlock } from '../store.js'
import { Import } from './Import.js'
import { Configure } from './Configure.js'
import { Submit } from './Submit.js'

async function blockCallback(blockNumber: number) {
	updateLatestBlock(blockNumber)
	if (wallet.value) {
		const bal = await provider.peek().getBalance(wallet.value.address)
		fundingAccountBalance.value = bal.toBigInt()
	}
}

async function updateLatestBlock(blockNumber: number) {
	const block = await provider.peek().getBlock(blockNumber)
	const baseFee = block.baseFeePerGas?.toBigInt() ?? 0n
	if (!latestBlock.peek() || BigInt(blockNumber) > latestBlock.peek().blockNumber) {
		latestBlock.value = { blockNumber: BigInt(blockNumber), baseFee }
	}
}

if (provider.peek().listenerCount('block') === 0) {
	provider.peek().on('block', blockCallback)
}

export function App() {
	const [showConfig, setShowConfig] = useState(!completedSession.value)
	return <main class='bg-background text-primary w-full min-h-screen px-6 font-serif flex flex-col items-center'>{activeSession.value ? showConfig ? <Configure nextStage={() => setShowConfig(false)} /> : <Submit /> : <Import />}</main>
}
