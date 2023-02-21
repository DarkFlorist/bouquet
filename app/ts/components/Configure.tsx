import { batch, ReadonlySignal, Signal, useSignal } from '@preact/signals'
import { Wallet, utils, providers } from 'ethers'
import { JSX } from 'preact/jsx-runtime'
import { BlockInfo, BundleState, Signers } from '../library/types.js'

export const Configure = ({
	provider,
	interceptorPayload,
	fundingAmountMin,
	signers,
	blockInfo,
}: {
	provider: Signal<providers.Web3Provider | undefined>
	interceptorPayload: Signal<BundleState | undefined>
	signers: Signal<Signers>
	fundingAmountMin: ReadonlySignal<bigint>
	blockInfo: Signal<BlockInfo>
}) => {
	const signerKeys = useSignal<{
		[address: string]: { input: string; wallet: Wallet | null }
	}>(
		interceptorPayload.value
			? interceptorPayload.value.uniqueSigners.reduce(
					(
						curr: {
							[address: string]: { input: string; wallet: Wallet | null }
						},
						address,
					) => {
						curr[utils.getAddress(address)] = { input: '', wallet: null }
						return curr
					},
					{},
			  )
			: {},
	)

	blockInfo.subscribe(() => {
		if (provider.value && signers.value.burner) {
			provider.value.getBalance(signers.value.burner.address).then((balance) => (signers.value.burnerBalance = balance.toBigInt()))
		}
	})

	function tryUpdateSigners(address: string, privateKey: string) {
		batch(() => {
			try {
				const wallet = new Wallet(privateKey)

				signerKeys.value = {
					...signerKeys.peek(),
					[address]: {
						wallet: wallet.address === utils.getAddress(address) ? wallet : null,
						input: privateKey,
					},
				}
			} catch {
				signerKeys.value = {
					...signerKeys.peek(),
					[address]: { wallet: null, input: privateKey },
				}
			}
			if (Object.values(signerKeys.value).filter(({ wallet }) => !wallet).length === 0) {
				signers.value = {
					...signers.peek(),
					bundleSigners: Object.values(signerKeys.peek()).reduce((acc: { [account: string]: Wallet }, wallet) => {
						if (wallet.wallet) {
							acc[wallet.wallet.address] = wallet.wallet
						}
						return acc
					}, {}),
				}
			}
		})
	}

	function copyBurnerToClipboard() {
		if (!signers.value.burner) return
		navigator.clipboard.writeText(signers.value.burner.address)
	}

	return (
		<>
			<h2 className='font-bold text-2xl'>2. Configure</h2>
			{interceptorPayload.value ? (
				<>
					<div className='flex flex-col w-full gap-4'>
						<h3 className='text-2xl font-semibold'>Enter Private Keys For Signing Accounts</h3>
						{interceptorPayload.value.uniqueSigners.map((address) => (
							<>
								<span className='font-semibold -mb-2'>{address}</span>
								<input
									type='text'
									value={signerKeys.value[address].input}
									onKeyUp={(e: JSX.TargetedEvent<HTMLInputElement>) => tryUpdateSigners(address, e.currentTarget.value)}
									className={`p-4 text-lg rounded-xl border-slate-200/70 border-2 ${
										signerKeys.value[address].wallet ? 'bg-success/10' : signerKeys.peek()[address].input ? 'bg-error/10' : 'bg-background'
									}`}
									placeholder={`Private key for ${address}`}
								/>
							</>
						))}
					</div>
					{interceptorPayload.value?.containsFundingTx && signers.value.burner ? (
						<div className='flex flex-col w-full gap-4'>
							<h3 className='text-2xl font-semibold'>Deposit To Funding Account</h3>
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
							<p className='font-semibold text-lg'>
								Wallet Balance: <span className='font-medium font-mono'>{utils.formatEther(signers.value.burnerBalance)}</span> ETH
								<br />
								Minimum Required Balance: <span className='font-medium font-mono'>{utils.formatEther(fundingAmountMin.value)}</span> ETH
							</p>
						</div>
					) : (
						''
					)}
				</>
			) : (
				<p>No transactions imported yet.</p>
			)}
		</>
	)
}
