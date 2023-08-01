import { ReadonlySignal, Signal, useSignal, useSignalEffect } from '@preact/signals'
import { formatEther, getAddress, Wallet } from 'ethers'
import { ProviderStore } from '../library/provider.js'
import { BlockInfo, Bundle, Signers } from '../types/types.js'

export const ConfigureFunding = ({
	provider,
	bundle,
	fundingAmountMin,
	signers,
	blockInfo,
}: {
	provider: Signal<ProviderStore | undefined>
	bundle: Signal<Bundle | undefined>
	signers: Signal<Signers>
	fundingAmountMin: ReadonlySignal<bigint>
	blockInfo: Signal<BlockInfo>
}) => {
	const signerKeys = useSignal<{
		[address: string]: { input: string; wallet: Wallet | null }
	}>({})

	useSignalEffect(() => {
		if (!bundle.value) signerKeys.value = {}
	})

	if (bundle.peek() && Object.keys(signerKeys.peek()).length === 0) {
		signerKeys.value =
			bundle.value && Object.keys(signerKeys.peek()).length === 0
				? bundle.value.uniqueSigners.reduce(
					(
						curr: {
							[address: string]: { input: string; wallet: Wallet | null }
						},
						address,
					) => {
						curr[getAddress(address)] = { input: '', wallet: null }
						return curr
					},
					{},
				)
				: {}
	}

	blockInfo.subscribe(() => {
		if (provider.value && signers.value.burner) {
			provider.value.provider.getBalance(signers.value.burner.address).then((balance) => (signers.value.burnerBalance = balance))
		}
	})

	function copyBurnerToClipboard() {
		if (!signers.value.burner) return
		navigator.clipboard.writeText(signers.value.burner.address)
	}

	return (
		<>
			{bundle.value && bundle.value.containsFundingTx && signers.value.burner ? (
				<div className='flex flex-col w-full gap-4'>
					<h3 className='text-2xl font-semibold'>Deposit To Funding Account</h3>
					<p>This is a temporary account, send only enough needed plus a tiny bit to account for rising gas price changes.</p>
					<span className='p-4 flex items-center gap-4 w-max rounded-xl text-lg bg-white text-background font-bold font-mono'>
						{signers.value.burner.address}
						<button onClick={copyBurnerToClipboard} className='active:text-background/70'>
							<svg
								className='h-8 inline-block'
								aria-hidden='true'
								fill='none'
								stroke='currentColor'
								stroke-width='1.5'
								viewBox='0 0 24 24'
								xmlns='http://www.w3.org/2000/svg'
							>
								<path
									d='M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 00-2.25 2.25v6'
									stroke-linecap='round'
									stroke-linejoin='round'
								></path>
							</svg>
						</button>
					</span>
					<p className='font-semibold'>
						Wallet Balance: <span className='font-medium font-mono'>{formatEther(signers.value.burnerBalance)}</span> ETH
						<br />
						Minimum Required Balance: <span className='font-medium font-mono'>{formatEther(fundingAmountMin.value)}</span> ETH
					</p>
				</div>
			) : null}
		</>
	)
}
