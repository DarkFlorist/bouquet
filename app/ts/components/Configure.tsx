import { batch, computed, ReadonlySignal, Signal } from '@preact/signals'
import { Wallet, utils, providers } from 'ethers'
import { useState } from 'preact/hooks'
import { JSX } from 'preact/jsx-runtime'
import { AppStages, BlockInfo, BundleState, Signers } from '../library/types.js'
import { Button } from './Button.js'

export const Configure = ({
	provider,
	interceptorPayload,
	fundingAmountMin,
	signers,
	blockInfo,
	stage,
}: {
	provider: Signal<providers.Web3Provider | undefined>
	interceptorPayload: Signal<BundleState | undefined>
	signers: Signal<Signers>
	fundingAmountMin: ReadonlySignal<bigint>
	blockInfo: Signal<BlockInfo>
	stage: Signal<AppStages>
}) => {
	const [signerKeys, setSignerKeys] = useState<{
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

	const requirementsMet = computed(
		() => Object.values(signerKeys).filter(({ wallet }) => !wallet).length === 0 && signers.value.burnerBalance >= fundingAmountMin.value,
	)

	blockInfo.subscribe(() => {
		if (provider.value && signers.value.burner) {
			provider.value.getBalance(signers.value.burner.address).then((balance) => (signers.value.burnerBalance = balance.toBigInt()))
		}
	})

	const saveAndNext = () => {
		batch(() => {
			signers.value.bundleSigners = Object.values(signerKeys).reduce((acc: { [account: string]: Wallet }, wallet) => {
				if (wallet.wallet) {
					acc[wallet.wallet.address] = wallet.wallet
				}
				return acc
			}, {})
			stage.value = 'submit'
		})
	}

	return (
		<>
			<h2 className='font-extrabold text-3xl'>Configure Bundle</h2>
			<div className='flex flex-col w-full gap-4'>
				<h3 className='text-2xl font-semibold'>Enter Private Keys For Signing Accounts</h3>
				{interceptorPayload.value?.uniqueSigners.map((address) => (
					<>
						<span className='font-semibold -mb-2'>{address}</span>
						<input
							type='text'
							value={signerKeys[address].input}
							onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => {
								const target = e.currentTarget
								try {
									const wallet = new Wallet(target.value)
									setSignerKeys({
										...setSignerKeys,
										[address]: {
											wallet: wallet.address === utils.getAddress(address) ? wallet : null,
											input: target.value,
										},
									})
								} catch {
									setSignerKeys({
										...setSignerKeys,
										[address]: { wallet: null, input: target.value },
									})
								}
							}}
							className={`p-4 rounded bg-secondary border-4 ${signerKeys[address].wallet ? 'border-success' : 'border-error'}`}
							placeholder={`Private key for ${address}`}
						/>
					</>
				))}
			</div>
			{interceptorPayload.value?.containsFundingTx && signers.value.burner ? (
				<div className='flex flex-col w-full gap-4'>
					<h3 className='text-2xl font-semibold'>Deposit To Funding Account</h3>
					<span>{signers.value.burner.address}</span>
					<span>
						Wallet Balance: {utils.formatEther(signers.value.burnerBalance)} ETH / Needed:
						{utils.formatEther(fundingAmountMin.value)} ETH
					</span>
				</div>
			) : (
				''
			)}
			<Button disabled={!requirementsMet.value} onClick={saveAndNext}>
				Next
			</Button>
		</>
	)
}
