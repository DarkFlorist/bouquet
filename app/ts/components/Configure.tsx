import { computed } from '@preact/signals'
import { Wallet, utils } from 'ethers'
import { useState } from 'preact/hooks'
import { JSX } from 'preact/jsx-runtime'
import { bundleContainsFundingTx, uniqueSigners, wallet, fundingAccountBalance, signingAccounts, fundingAmountMin } from '../store.js'
import { Button } from './Button.js'

export const Configure = (props: { nextStage: () => void }) => {
	const [signerKeys, setSignerKeys] = useState<{
		[address: string]: { input: string; wallet: Wallet | null }
	}>(
		uniqueSigners.peek().reduce(
			(
				curr: {
					[address: string]: { input: string; wallet: Wallet | null }
				},
				address
			) => {
				curr[utils.getAddress(address)] = { input: '', wallet: null }
				return curr
			},
			{}
		)
	)

	const requirementsMet = computed(() => Object.values(signerKeys).filter(({ wallet }) => !wallet).length === 0 && fundingAccountBalance.value >= fundingAmountMin.value)

	const saveAndNext = () => {
		signingAccounts.value = Object.values(signerKeys).reduce((acc: { [account: string]: Wallet }, wallet) => {
			if (wallet.wallet) {
				acc[wallet.wallet.address] = wallet.wallet
			}
			return acc
		}, {})
		props.nextStage()
	}

	return (
		<article class='p-6 max-w-screen-lg w-full flex flex-col gap-6'>
			<h2 class='font-extrabold text-3xl'>Configure Bundle</h2>
			<div class='flex flex-col w-full gap-6'>
				<h3 class='text-2xl font-semibold'>
					Found {uniqueSigners.value.length} Signers {bundleContainsFundingTx.value ? ' + A Funding Transaction' : ''}
				</h3>
				{uniqueSigners.value.map(address => (
					<>
						<span class='font-semibold -mb-4'>{address}</span>
						<input
							type='text'
							value={signerKeys[address].input}
							onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => {
								const target = e.currentTarget
								try {
									const wallet = new Wallet(target.value)
									setSignerKeys({ ...setSignerKeys, [address]: { wallet: wallet.address === utils.getAddress(address) ? wallet : null, input: target.value } })
								} catch {
									setSignerKeys({ ...setSignerKeys, [address]: { wallet: null, input: target.value } })
								}
							}}
							class={`p-3 bg-secondary ring ring-offset-2 ${signerKeys[address].wallet ? 'ring-success' : 'ring-error'}`}
							placeholder={`Private key for ${address}`}
						/>
					</>
				))}

				{bundleContainsFundingTx.value && wallet.value ? (
					<>
						<h3 class='text-2xl font-semibold'>Deposit To Funding Account</h3>
						<span>{wallet.value.address}</span>
						<span>
							Wallet Balance: {utils.formatEther(fundingAccountBalance.value)} ETH / Needed:
							{utils.formatEther(fundingAmountMin.value)} ETH
						</span>
					</>
				) : (
					''
				)}
				<Button disabled={!requirementsMet.value} onClick={saveAndNext}>
					Next
				</Button>
			</div>
		</article>
	)
}
