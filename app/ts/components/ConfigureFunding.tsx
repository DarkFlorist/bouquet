import { ReadonlySignal, Signal, useSignal, useSignalEffect } from '@preact/signals'
import { formatEther, getAddress, Wallet } from 'ethers'
import { ProviderStore } from '../library/provider.js'
import { BlockInfo, Bundle, Signers } from '../types/types.js'
import { Button } from './Button.js'

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

	function openNewBurnerModal() {

	}

	function openWithdrawModal() {

	}

	return (
		<>
			{bundle.value && bundle.value.containsFundingTx && signers.value.burner ? (
				<div className='flex flex-col w-full gap-4'>
					<h3 className='text-2xl font-semibold'>Deposit To Funding Account</h3>
					<p>This is a temporary account, send only enough needed plus a tiny bit to account for rising gas price changes.</p>

					<div className='flex items-center gap-2'>
						<Button variant='secondary' onClick={copyBurnerToClipboard}>
							<>
								{signers.value.burner.address}
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
							</>
						</Button>
						<Button variant='primary' onClick={openWithdrawModal}>
							<span className='flex gap-2 text-sm items-center'>
								Withdraw ETH
								<svg class='h-8 inline-block' aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
									<path d="M8.25 9.75h4.875a2.625 2.625 0 010 5.25H12M8.25 9.75L10.5 7.5M8.25 9.75L10.5 12m9-7.243V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" stroke-linecap="round" stroke-linejoin="round"></path>
								</svg>
							</span>
						</Button>
						<Button variant='primary' onClick={openNewBurnerModal}>
							<span className='flex gap-2 text-sm items-center'>
								New Temp Account
								<svg aria-hidden="true" class='h-8 inline-block' fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
									<path d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" stroke-linecap="round" stroke-linejoin="round"></path>
								</svg>
							</span>
						</Button>

					</div>
					<p className='font-semibold'>
						Wallet Balance: <span className='font-medium font-mono'>{formatEther(signers.value.burnerBalance)} ETH</span>
						<br />
						Minimum Required Balance: <span className='font-medium font-mono'>{formatEther(fundingAmountMin.value)} ETH</span>
					</p>
				</div>
			) : null}
		</>
	)
}
