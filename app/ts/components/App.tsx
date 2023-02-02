import { useState } from 'preact/hooks'
import { activeSession, completedSession, fundingAccountBalance, provider, wallet, latestBlock } from '../store.js'
import { Import } from './Import.js'
import { Configure } from './Configure.js'
import { Submit } from './Submit.js'
import { Button } from './Button.js'
import { providers } from 'ethers'
import { Transactions } from './Transactions.js'
import { createBundleTransactions } from '../library/bundleUtils.js'
import { computed } from '@preact/signals'

export async function blockCallback(blockNumber: number) {
	updateLatestBlock(blockNumber)
	if (wallet.value && provider.value) {
		const bal = await provider.value.getBalance(wallet.value.address)
		fundingAccountBalance.value = bal.toBigInt()
	}
}

async function updateLatestBlock(blockNumber: number) {
	if (!provider.value) return
	const block = await provider.value.getBlock(blockNumber)
	const baseFee = block.baseFeePerGas?.toBigInt() ?? 0n
	if (!latestBlock.peek() || BigInt(blockNumber) > latestBlock.peek().blockNumber) {
		latestBlock.value = { blockNumber: BigInt(blockNumber), baseFee }
	}
}

async function connectWallet() {
	if (!window.ethereum || !window.ethereum.request) throw Error('Connect Wallet: No Ethereum wallet detected')

	await window.ethereum.request({ method: 'eth_requestAccounts' }).catch((err: { code: number }) => {
		if (err.code === 4001) {
			throw new Error('Connect Wallet: Wallet connection rejected')
		} else {
			throw new Error(`Connect Wallet: ${JSON.stringify(err)}`)
		}
	})

	const ethereumProvider = new providers.Web3Provider(window.ethereum, 'any')
	const { chainId } = await ethereumProvider.getNetwork()

	// We only support goerli right now
	if (chainId === 5) {
		provider.value = ethereumProvider
		provider.value.on('block', blockCallback)
	} else {
		ethereumProvider.send('wallet_switchEthereumChain', [{ chainId: '0x5' }])
	}
}

export function App() {
	const [showConfig, setShowConfig] = useState<boolean>(!completedSession.value)

	const bundle = computed(() => createBundleTransactions(latestBlock.value))

	return (
		<main class='bg-background text-primary w-full min-h-screen px-6 font-serif flex flex-col items-center'>
			<article className='p-4 max-w-screen-lg w-full flex flex-col gap-8'>
				{activeSession.value ? (
					provider.value ? (
						<>
							<Transactions transactions={bundle} />
							{showConfig ? <Configure nextStage={() => setShowConfig(false)} /> : <Submit />}
						</>
					) : (
						<article className='text-center flex flex-col gap-4 py-8'>
							<h2 class='text-3xl font-extrabold'>Welcome Back</h2>
							<Button onClick={connectWallet}>Connect Wallet</Button>
						</article>
					)
				) : (
					<Import />
				)}
			</article>
		</main>
	)
}
