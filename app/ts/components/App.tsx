import { Import } from './Import.js'
import { Configure } from './Configure.js'
import { Submit } from './Submit.js'
import { Button } from './Button.js'
import { providers, Wallet } from 'ethers'
import { Transactions } from './Transactions.js'
import { createBundleTransactions, getMaxBaseFeeInFutureBlock } from '../library/bundleUtils.js'
import { computed, effect, signal } from '@preact/signals'
import { GetSimulationStackReply } from '../types.js'
import { connectWallet, updateLatestBlock } from '../library/provider.js'

function getDefaultBurnerWallet() {
	const burnerPrivateKey = localStorage.getItem('wallet')
	return burnerPrivateKey ? new Wallet(burnerPrivateKey) : undefined
}

export function App() {
	// Global State
	const provider = signal<providers.Web3Provider | undefined>(undefined)
	const latestBlock = signal<{
		blockNumber: bigint
		baseFee: bigint
		priorityFee: bigint
	}>({ blockNumber: 0n, baseFee: 0n, priorityFee: 10n ** 9n * 3n })
	const wallet = signal<Wallet | undefined>(getDefaultBurnerWallet())
	const interceptorPayload = signal<GetSimulationStackReply | undefined>(undefined)
	const completedSession = signal<boolean>(false)
	const fundingAccountBalance = signal<bigint>(0n)
	const signingAccounts = signal<{ [account: string]: Wallet }>({})
	const showConfig = signal<boolean>(!completedSession.value)

	// Sync localStorage
	wallet.subscribe((w) => {
		if (w) localStorage.setItem('wallet', w.privateKey)
		else localStorage.removeItem('wallet')
	})
	const payload = JSON.parse(localStorage.getItem('payload') ?? 'null')
	if (payload) interceptorPayload.value = GetSimulationStackReply.parse(payload)

	// Computed state
	async function blockCallback(blockNumber: number) {
		updateLatestBlock(blockNumber, provider, latestBlock)
		if (wallet.value && provider.value) {
			const bal = await provider.value.getBalance(wallet.value.address)
			fundingAccountBalance.value = bal.toBigInt()
		}
	}
	effect(() => {
		if (provider.value && provider.value.listenerCount('block') === 0) {
			provider.value.on('block', blockCallback)
		}
	})

	const bundle = computed(() =>
		createBundleTransactions(
			interceptorPayload.value,
			signingAccounts.value,
			wallet.value,
			bundleContainsFundingTx.value,
			2n, // blocks in future
			latestBlock.value.priorityFee,
			latestBlock.value.baseFee,
			fundingAmountMin.value,
		),
	)
	const activeSession = computed(() => completedSession.value || interceptorPayload.value)
	const bundleContainsFundingTx = computed(
		() => interceptorPayload.value && interceptorPayload.value.length > 1 && interceptorPayload.value[0].to === interceptorPayload.value[1].from,
	)
	bundleContainsFundingTx.subscribe((x) => {
		if (x && !wallet.value) wallet.value = Wallet.createRandom()
	})
	const totalGas = computed(() => {
		if (interceptorPayload.value) {
			return interceptorPayload.value.reduce(
				(sum, tx, index) => (index === 0 && bundleContainsFundingTx.value ? 21000n : BigInt(tx.gasLimit.toString()) + sum),
				0n,
			)
		}
		return 0n
	})
	// @TODO: Change this to track minimum amount of ETH needed to deposit
	const totalValue = computed(() => {
		if (interceptorPayload.value) {
			return interceptorPayload.value.reduce((sum, tx, index) => (index === 0 && bundleContainsFundingTx.value ? 0n : BigInt(tx.value.toString()) + sum), 0n)
		}
		return 0n
	})
	const fundingAmountMin = computed(() => {
		if (!bundleContainsFundingTx.value) return 0n
		const maxBaseFee = getMaxBaseFeeInFutureBlock(latestBlock.value.baseFee, 2n)
		return totalGas.value * (latestBlock.value.priorityFee + maxBaseFee) + totalValue.value
	})

	return (
		<main class='bg-background text-primary w-full min-h-screen px-6 font-serif flex flex-col items-center'>
			<article className='p-4 max-w-screen-lg w-full flex flex-col gap-8'>
				{activeSession.value ? (
					provider.value ? (
						<>
							<Transactions {...{ transactions: bundle, interceptorPayload, wallet, signingAccounts, fundingAccountBalance, bundleContainsFundingTx }} />
							{showConfig ? (
								<Configure
									{...{
										nextStage: () => (showConfig.value = false),
										interceptorPayload,
										bundleContainsFundingTx,
										fundingAmountMin,
										fundingAccountBalance,
										signingAccounts,
										wallet,
									}}
								/>
							) : (
								<Submit
									{...{ latestBlock, provider, interceptorPayload, signingAccounts, wallet, bundleContainsFundingTx, fundingAmountMin, fundingAccountBalance }}
								/>
							)}
						</>
					) : (
						<article className='text-center flex flex-col gap-4 py-8'>
							<h2 class='text-3xl font-extrabold'>Welcome Back</h2>
							<Button onClick={() => connectWallet(provider, blockCallback)}>Connect Wallet</Button>
						</article>
					)
				) : (
					<Import {...{ provider, interceptorPayload }} />
				)}
			</article>
		</main>
	)
}
