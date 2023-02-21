import { Import } from './Import.js'
import { Configure } from './Configure.js'
import { Submit } from './Submit.js'
import { Button } from './Button.js'
import { providers, utils, Wallet } from 'ethers'
import { Transactions } from './Transactions.js'
import { useComputed, useSignal } from '@preact/signals'
import { EthereumAddress, GetSimulationStackReply, serialize } from '../library/interceptor-types.js'
import { connectWallet } from '../library/provider.js'
import { AppSettings, BlockInfo, BundleState, Signers } from '../library/types.js'
import { MEV_RELAY_MAINNET } from '../constants.js'
import { getMaxBaseFeeInFutureBlock } from '../library/bundleUtils.js'
import { NetworkDetails } from './NetworkDetails.js'

function fetchBurnerWalletFromStorage() {
	const burnerPrivateKey = localStorage.getItem('wallet')
	return burnerPrivateKey ? new Wallet(burnerPrivateKey) : undefined
}

function fetchPayloadFromStorage() {
	const payload = JSON.parse(localStorage.getItem('payload') ?? 'null')
	if (!payload) return undefined
	const parsed = GetSimulationStackReply.parse(payload)

	const containsFundingTx = parsed.length > 1 && parsed[0].to === parsed[1].from
	const uniqueSigners = [...new Set(parsed.map((x) => utils.getAddress(serialize(EthereumAddress, x.from))))].filter(
		(_, index) => !(index === 0 && containsFundingTx),
	)
	const totalGas = parsed.reduce((sum, tx, index) => (index === 0 && containsFundingTx ? 21000n : BigInt(tx.gasLimit.toString()) + sum), 0n)
	// @TODO: Change this to track minimum amount of ETH needed to deposit
	const inputValue = parsed.reduce((sum, tx, index) => (index === 0 && containsFundingTx ? 0n : BigInt(tx.value.toString()) + sum), 0n)

	return { payload: parsed, containsFundingTx, uniqueSigners, totalGas, inputValue }
}

function fetchSettingsFromStorage() {
	// @TODO: add ability to manage settings
	return { blocksInFuture: 2n, priorityFee: 10n ** 9n * 3n, relayEndpoint: MEV_RELAY_MAINNET }
}

export function App() {
	// Global State
	const provider = useSignal<providers.Web3Provider | undefined>(undefined)
	const blockInfo = useSignal<BlockInfo>({ blockNumber: 0n, baseFee: 0n, priorityFee: 10n ** 9n * 3n })
	const interceptorPayload = useSignal<BundleState | undefined>(fetchPayloadFromStorage())
	const appSettings = useSignal<AppSettings>(fetchSettingsFromStorage())
	const signers = useSignal<Signers>({ burner: fetchBurnerWalletFromStorage(), burnerBalance: 0n, bundleSigners: {} })

	// Sync burnerWallet to localStorage
	signers.subscribe(({ burner }) => {
		if (burner) localStorage.setItem('wallet', burner.privateKey)
		else localStorage.removeItem('wallet')
	})

	const fundingAmountMin = useComputed(() => {
		if (!interceptorPayload.value) return 0n
		if (!interceptorPayload.value.containsFundingTx) return 0n
		const maxBaseFee = getMaxBaseFeeInFutureBlock(blockInfo.value.baseFee, appSettings.value.blocksInFuture)
		return interceptorPayload.value.totalGas * (blockInfo.value.priorityFee + maxBaseFee) + interceptorPayload.value.inputValue
	})

	return (
		<main class='bg-background text-primary w-full min-h-screen px-6 font-serif flex flex-col items-center'>
			<article className='p-4 max-w-screen-lg w-full'>
				<NetworkDetails {...{ blockInfo, provider, appSettings }} />
				<div className='p-4 mt-4 flex flex-col gap-8'>
					{!provider.value && interceptorPayload.value ? (
						<article className='items-center flex flex-col gap-4 py-8'>
							<h2 class='text-2xl font-bold'>Welcome Back</h2>
							<Button onClick={() => connectWallet(provider, blockInfo, interceptorPayload.peek()?.containsFundingTx ? signers : undefined, appSettings)}>
								Connect Wallet
							</Button>
						</article>
					) : (
						<>
							<Import {...{ provider, interceptorPayload, blockInfo, signers, appSettings }} />
							{interceptorPayload.value ? <Transactions {...{ interceptorPayload, signers, blockInfo, fundingAmountMin, appSettings }} /> : null}
							<Configure {...{ provider, interceptorPayload, fundingAmountMin, appSettings, signers, blockInfo }} />
							<Submit {...{ provider, interceptorPayload, fundingAmountMin, signers, appSettings, blockInfo }} />
						</>
					)}
				</div>
			</article>
		</main>
	)
}
