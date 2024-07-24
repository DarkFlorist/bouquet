import { batch, ReadonlySignal, Signal, useComputed, useSignal, useSignalEffect } from '@preact/signals'
import { EtherSymbol, formatEther, getAddress, JsonRpcProvider, Wallet } from 'ethers'
import { JSX } from 'preact/jsx-runtime'
import { useAsyncState } from '../library/asyncState.js'
import { getMaxBaseFeeInFutureBlock } from '../library/bundleUtils.js'
import { ProviderStore } from '../library/provider.js'
import { addressString } from '../library/utils.js'
import { EthereumAddress } from '../types/ethereumTypes.js'
import { BlockInfo, Bundle, Signers } from '../types/types.js'
import { Button } from './Button.js'
import { SingleNotice } from './Warns.js'
import { BouquetNetwork, BouquetSettings } from '../types/bouquetTypes.js'
import { getNetwork } from '../constants.js'

export const ConfigureFunding = ({
	provider,
	bouquetSettings,
	bundle,
	fundingAmountMin,
	signers,
	blockInfo,
}: {
	provider: Signal<ProviderStore | undefined>
	bundle: Signal<Bundle | undefined>
	signers: Signal<Signers>
	fundingAmountMin: ReadonlySignal<bigint>
	blockInfo: Signal<BlockInfo>,
	bouquetSettings: Signal<BouquetSettings>
}) => {
	const signerKeys = useSignal<{
		[address: string]: { input: string; wallet: Wallet | null }
	}>({})

	const bouquetNetwork = useComputed(() => getNetwork(bouquetSettings.value, provider.value?.chainId || 1n))

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

	const showWithdrawModal = useSignal<boolean>(false)

	function openWithdrawModal() {
		showWithdrawModal.value = true
	}

	return (
		<>
			<WithdrawModal {...{ display: showWithdrawModal, blockInfo, signers, bouquetNetwork, provider }}/>
			{bundle.value && bundle.value.containsFundingTx && signers.value.burner ? (
				<div className='flex flex-col w-full gap-4'>
					<h3 className='text-2xl font-semibold'>Deposit To Funding Account</h3>
					<p className='text-orange-600 font-semibold'>This is a temporary account, send only enough needed plus a tiny bit to account for possible rising gas price changes.</p>
					<div className='flex items-center gap-2 flex-wrap'>
						<Button variant='secondary' onClick={copyBurnerToClipboard}>
							<>
								<span className='text-xs sm:text-base'>{signers.value.burner.address}</span>
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
								<svg class='h-8 inline-block' aria-hidden='true' fill='none' stroke='currentColor' stroke-width='1.5' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
									<path d='M8.25 9.75h4.875a2.625 2.625 0 010 5.25H12M8.25 9.75L10.5 7.5M8.25 9.75L10.5 12m9-7.243V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z' stroke-linecap='round' stroke-linejoin='round'></path>
								</svg>
							</span>
						</Button>
					</div>
					<p className='font-semibold sm:text-lg'>
						Wallet Balance: <span className='font-medium font-mono'>{EtherSymbol}{formatEther(signers.value.burnerBalance)}</span>
						<br />
						Minimum Required Balance: <span className='font-medium font-mono'>{EtherSymbol}{formatEther(fundingAmountMin.value)}</span>
					</p>
				</div>
			) : null}
		</>
	)
}

const WithdrawModal = ({ display, blockInfo, signers, provider, bouquetNetwork }: { display: Signal<boolean>, provider: Signal<ProviderStore | undefined>, signers: Signal<Signers>, blockInfo: Signal<BlockInfo>, bouquetNetwork: Signal<BouquetNetwork> }) => {
	if (!display.value) return null

	const recipientAddress = useSignal<{ input: string, address?: EthereumAddress }>({ input: '' })
	const inputStyle = useComputed(() => `flex flex-col justify-center border h-16 outline-none px-4 focus-within:bg-white/5 bg-transparent ${recipientAddress.value.address ? 'border-green-400' : (recipientAddress.value.input ? 'border-red-400' : 'border-white/50 focus-within:border-white/80')}`)
	function parseInput(input: string) {
		const address = EthereumAddress.safeParse(input)
		recipientAddress.value = { input, address: address.success ? address.value : undefined }
	}

	const withdrawAmount = useComputed(() => {
		let maxFeePerGas = getMaxBaseFeeInFutureBlock(blockInfo.value.baseFee, 5n) + blockInfo.value.priorityFee;
		let fee = maxFeePerGas * 21000n
		let amount = signers.value.burnerBalance - fee
		return { amount, fee, maxFeePerGas }
	})

	const { value: signedMessage, waitFor } = useAsyncState<string>()

	// Default check if we know the network, can also switch to true if sending to known RPC fails
	const useBrowserProvider = useSignal<boolean>(false)
	useSignalEffect(() => { useBrowserProvider.value = Boolean(provider.value && bouquetNetwork.value.rpcUrl) })

	function withdraw() {
		waitFor(async () => {
			if (withdrawAmount.value.amount <= 0n) throw 'Funding account\'s balance is to small to withdraw'
			if (!signers.value.burner) throw 'No funding account found'
			if (!provider.value) throw 'User not connected'
			if (!recipientAddress.value.address) throw 'No recipient provided'

			// Worst case scenario, attempt to send via browser wallet if no NETWORK config for chainId or previous error sending to known RPC
			if (useBrowserProvider.value === true) {
				try {
					const burnerWithBrowserProvider = signers.value.burner.connect(provider.value.provider)
					const txInput = await burnerWithBrowserProvider.populateTransaction({ chainId: provider.value.chainId, from: signers.value.burner.address, to: addressString(recipientAddress.value.address), gasLimit: 21000, type: 2, value: withdrawAmount.value.amount, maxFeePerGas: withdrawAmount.value.maxFeePerGas })
					const tx = await burnerWithBrowserProvider.signTransaction(txInput)
					const txHash = await provider.value.provider.send('eth_sendRawTransaction', [tx])
					return txHash as string
				} catch (error) {
					throw error
				}
			}
			if (bouquetNetwork.value.rpcUrl === undefined) throw new Error('No RPC URL set and not connected to wallet')
			const fundingWithProvider = signers.value.burner.connect(new JsonRpcProvider(bouquetNetwork.value.rpcUrl))
			try {
				const tx = await fundingWithProvider.sendTransaction({ chainId: provider.value.chainId, from: signers.value.burner.address, to: addressString(recipientAddress.value.address), gasLimit: 21000, type: 2, value: withdrawAmount.value.amount, maxFeePerGas: withdrawAmount.value.maxFeePerGas })
				fundingWithProvider.provider?.destroy()
				return tx.hash
			} catch (error) {
				console.warn('Error sending burner withdraw tx to known RPC:', error)
				fundingWithProvider.provider?.destroy()
				useBrowserProvider.value = true
				throw 'Unknown network! If you have Interceptor installed and simulation mode on please switch to signing mode and try again.'
			}
		})
	}

	function close() {
		batch(() => {
			display.value = false
			recipientAddress.value = { input: '' }
			signedMessage.value.state = 'inactive'
		})
	}

	return (
		<div onClick={close} className='bg-white/10 w-full h-full inset-0 fixed p-4 flex flex-col items-center md:pt-24'>
			<div class='h-max w-full max-w-xl px-8 py-4 flex flex-col gap-4 bg-black' onClick={(e) => e.stopPropagation()}>
				<h2 className='text-xl font-semibold'>Withdraw From Funding Account</h2>
				<div className={inputStyle.value}>
					<span className='text-sm text-gray-500'>ETH Recipient</span>
					<input onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => parseInput(e.currentTarget.value)} type='text' className='bg-transparent outline-none placeholder:text-gray-600' placeholder='0x...' />
				</div>
				{withdrawAmount.value.amount > 0n
					? (<p>Withdraw {EtherSymbol} {formatEther(withdrawAmount.value.amount)} + {EtherSymbol} {formatEther(withdrawAmount.value.fee)} fee</p>)
					: (<p>Transfer fee ({EtherSymbol} {formatEther(withdrawAmount.value.fee)}) is more than funding account balance</p>)}
				<div className='flex gap-2'>
					<Button onClick={withdraw} variant='primary'>Withdraw</Button>
				</div>
				<p>{signedMessage.value.state === 'rejected' ? <SingleNotice variant='error' description={signedMessage.value.error.message} title='Error Withdrawing' /> : ''}</p>
				<p>{signedMessage.value.state === 'resolved' ? <SingleNotice variant='success' description={bouquetNetwork.value.blockExplorer ? <span>Transaction submitted with TX Hash <a className='hover:underline' href={`${bouquetNetwork.value.blockExplorer}tx/${signedMessage.value.value}`} target='_blank'>{signedMessage.value.value}</a></span> : <span>Transaction submitted with TX Hash {signedMessage.value.value}</span>} title='Transaction Submitted' /> : ''}</p>
			</div>
		</div>
	)
}

