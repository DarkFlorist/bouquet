import { computed, ReadonlySignal, Signal } from '@preact/signals'
import { Wallet, utils } from 'ethers'
import { useState } from 'preact/hooks'
import { JSX } from 'preact/jsx-runtime'
import { EthereumAddress, GetSimulationStackReply } from '../types.js'
import { Button } from './Button.js'

export const Configure = ({
	nextStage,
	interceptorPayload,
	bundleContainsFundingTx,
	fundingAmountMin,
	fundingAccountBalance,
	signingAccounts,
	wallet,
}: {
	nextStage: () => void
	interceptorPayload: Signal<GetSimulationStackReply | undefined>
	bundleContainsFundingTx: ReadonlySignal<boolean | undefined>
	fundingAmountMin: ReadonlySignal<bigint>
	fundingAccountBalance: Signal<bigint>
	signingAccounts: Signal<{ [account: string]: Wallet }>
	wallet: Signal<Wallet | undefined>
}) => {
	const uniqueSigners = computed(() => {
		if (interceptorPayload.value) {
			const addresses = [...new Set(interceptorPayload.value.map((x) => utils.getAddress(EthereumAddress.serialize(x.from) as string)))]
			if (bundleContainsFundingTx.value) addresses.shift()
			return addresses
		}
		return []
	})

	const [signerKeys, setSignerKeys] = useState<{
		[address: string]: { input: string; wallet: Wallet | null }
	}>(
		uniqueSigners.peek().reduce(
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
		),
	)

	const requirementsMet = computed(
		() => Object.values(signerKeys).filter(({ wallet }) => !wallet).length === 0 && fundingAccountBalance.value >= fundingAmountMin.value,
	)

	const saveAndNext = () => {
		signingAccounts.value = Object.values(signerKeys).reduce((acc: { [account: string]: Wallet }, wallet) => {
			if (wallet.wallet) {
				acc[wallet.wallet.address] = wallet.wallet
			}
			return acc
		}, {})
		nextStage()
	}

	return (
		<>
			<h2 className='font-extrabold text-3xl'>Configure Bundle</h2>
			<div className='flex flex-col w-full gap-4'>
				<h3 className='text-2xl font-semibold'>Enter Private Keys For Signing Accounts</h3>
				{uniqueSigners.value.map((address) => (
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
			{bundleContainsFundingTx.value && wallet.value ? (
				<div className='flex flex-col w-full gap-4'>
					<h3 className='text-2xl font-semibold'>Deposit To Funding Account</h3>
					<span>{wallet.value.address}</span>
					<span>
						Wallet Balance: {utils.formatEther(fundingAccountBalance.value)} ETH / Needed:
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
