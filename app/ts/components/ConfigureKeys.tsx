import { batch, Signal, useSignal, useSignalEffect } from '@preact/signals'
import { getAddress, Wallet } from 'ethers'
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

	function tryUpdateSigners(address: string, privateKey: string) {
		batch(() => {
			try {
				const wallet = new Wallet(privateKey)

				signerKeys.value = {
					...signerKeys.peek(),
					[address]: {
						wallet: wallet.address === getAddress(address) ? wallet : null,
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
		<>
			<div className='flex flex-col w-full gap-4'>
				<h3 className='text-2xl font-semibold'>Enter Private Keys For Signing Accounts</h3>
				{bundle.value && bundle.value.uniqueSigners.map((address) => (
					<>
						<span className='font-semibold -mb-2'>{address}</span>
						<input
							type='text'
							value={signerKeys.value[address].input}
							onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => tryUpdateSigners(address, e.currentTarget.value)}
							className={`p-4 text-lg rounded-xl border-slate-200/70 border-2 ${signerKeys.value[address].wallet ? 'bg-success/10' : signerKeys.peek()[address].input ? 'bg-error/10' : 'bg-background' }`}
							placeholder={`Private key for ${address}`}
						/>
					</>
				))}
			</div>
		</>
	)
}
