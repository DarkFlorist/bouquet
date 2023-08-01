import { batch, Signal, useSignal, useSignalEffect } from '@preact/signals'
import { Wallet } from 'ethers'
import { JSX } from 'preact/jsx-runtime'
import { ProviderStore } from '../library/provider.js'
import { BlockInfo, Bundle, Signers } from '../types/types.js'

export const ConfigureKeys = ({
	provider,
	bundle,
	signers,
	blockInfo,
}: {
	provider: Signal<ProviderStore | undefined>
	bundle: Signal<Bundle | undefined>
	signers: Signal<Signers>
	blockInfo: Signal<BlockInfo>
}) => {
	const signerKeys = useSignal<{
		[address: string]: { input: string; wallet: Wallet | null }
	}>({})

	useSignalEffect(() => {
		if (!bundle.value) signerKeys.value = {}
		if (bundle.value && bundle.value.uniqueSigners.join() !== Object.keys(signerKeys.value).join()) {
			signerKeys.value = bundle.value.uniqueSigners.reduce((
					curr: {
						[address: string]: { input: string; wallet: Wallet | null }
					},
					address,
				) => {
					curr[address] = { input: '', wallet: null }
					return curr
				},
				{},
			)
		}
	})

	blockInfo.subscribe(() => {
		if (provider.value && signers.value.burner) {
			provider.value.provider.getBalance(signers.value.burner.address).then((balance) => (signers.value.burnerBalance = balance))
		}
	})

	function tryUpdateSigners(address: string, privateKey: string) {
		batch(() => {
			try {
				const wallet = new Wallet(privateKey)

				signerKeys.value = {
					...signerKeys.peek(),
					[address]: {
						wallet: wallet.address === address ? wallet : null,
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

	return (
		<div className='flex flex-col w-full gap-4'>
			<h3 className='text-2xl font-semibold'>Enter Private Keys For Signing Accounts</h3>
			{Object.keys(signerKeys.value).map((address) => (
				<div className={`flex flex-col justify-center border h-16 outline-none px-4 ${signerKeys.value[address].wallet ? 'border-green-400 bg-green-200/10' : signerKeys.peek()[address].input ? 'bg-red-200/10 border-red-400' : 'border-white/50 focus-within:border-white/80 focus-within:bg-white/5 bg-transparent'}`}>
					<span className='text-sm text-gray-500'>{address}</span>
					<input onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => tryUpdateSigners(address, e.currentTarget.value)} value={signerKeys.value[address].input} type='text' className='bg-transparent outline-none placeholder:text-gray-600' placeholder={`Enter private key for account`} />
				</div>
			))}
		</div>
	)
}
