import { batch, ReadonlySignal, Signal, useComputed, useSignal, useSignalEffect } from '@preact/signals'
import { EtherSymbol, formatEther, getAddress, id, Wallet } from 'ethers'
import { JSX } from 'preact/jsx-runtime'
import { useAsyncState } from '../library/asyncState.js'
import { getMaxBaseFeeInFutureBlock, signBundle } from '../library/bundleUtils.js'
import { ProviderStore } from '../library/provider.js'
import { addressString } from '../library/utils.js'
import { EthereumAddress } from '../types/ethereumTypes.js'
import { AppSettings, BlockInfo, Bundle, Signers } from '../types/types.js'
import { Button } from './Button.js'
import { SingleNotice } from './Warns.js'

export const ConfigureFunding = ({
	provider,
	appSettings,
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
	appSettings: Signal<AppSettings>
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

	const showWithdrawModal = useSignal<boolean>(false)
	const showResetModal = useSignal<boolean>(false)

	function openNewBurnerModal() {
		showResetModal.value = true
	}

	function openWithdrawModal() {
		showWithdrawModal.value = true
	}

	return (
		<>
			<WithdrawModal {...{ display: showWithdrawModal, blockInfo, signers, appSettings, provider }}/>
			{bundle.value && bundle.value.containsFundingTx && signers.value.burner ? (
				<div className='flex flex-col w-full gap-4'>
					<h3 className='text-2xl font-semibold'>Deposit To Funding Account</h3>
					<p className='text-orange-600 font-semibold'>This is a temporary account, send only enough needed plus a tiny bit to account for rising gas price changes.</p>
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
					<p className='font-semibold text-lg'>
						Wallet Balance: <span className='font-medium font-mono'>{EtherSymbol} {formatEther(signers.value.burnerBalance)}</span>
						<br />
						Minimum Required Balance: <span className='font-medium font-mono'>{EtherSymbol} {formatEther(fundingAmountMin.value)}</span>
					</p>
				</div>
			) : null}
		</>
	)
}

const WithdrawModal = ({ display, blockInfo, signers, appSettings, provider }: { display: Signal<boolean>, 	provider: Signal<ProviderStore | undefined>, appSettings: Signal<AppSettings>, signers: Signal<Signers>, blockInfo: Signal<BlockInfo> }) => {
	if (!display.value) return null

	const recipientAddress = useSignal<{ input: string, address?: EthereumAddress }>({ input: '' })
	const inputStyle = useComputed(() => `flex flex-col justify-center border h-16 outline-none px-4 focus-within:bg-white/5 bg-transparent ${recipientAddress.value.address ? 'border-green-400' : (recipientAddress.value.input ? 'border-red-400' : 'border-white/50 focus-within:border-white/80')}`)
	function parseInput(input: string) {
		const address = EthereumAddress.safeParse(input)
		recipientAddress.value = { input, address: address.success ? address.value : undefined }
	}

	const withdrawAmount = useComputed(() => {
		let fee = (blockInfo.value.baseFee + blockInfo.value.priorityFee) * 11n / 10n * 21000n
		let amount = signers.value.burnerBalance - fee
		return { amount, fee }
	})

	const { value: signedMessage, waitFor } = useAsyncState<string>()

	function withdraw() {
		waitFor(async () => {
			if (withdrawAmount.value.amount <= 0n) throw "Funding account's balance is to small to withdraw"
			if (!signers.value.burner) throw "No funding account found"
			if (!provider.value) throw "User not connected"
			if (!appSettings.value.relayEndpoint) throw "No Flashbots RPC provided"
			if (!recipientAddress.value.address) throw "No recipient provided"

			const [tx] = await signBundle([{ signer: signers.value.burner, transaction: { chainId: provider.value.chainId, from: signers.value.burner.address, to: addressString(recipientAddress.value.address), value: withdrawAmount.value.amount, gasLimit: 21000, type: 2 }}], provider.value.provider, blockInfo.value, getMaxBaseFeeInFutureBlock(blockInfo.value.baseFee, 10n))
			const payload = JSON.stringify({ jsonrpc: "2.0", method: "eth_sendPrivateTransaction", params: [{ tx }] })
			const flashbotsSig = `${await provider.value.authSigner.getAddress()}:${await provider.value.authSigner.signMessage(id(payload))}`
			const request = await fetch(appSettings.value.relayEndpoint, { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json', 'X-Flashbots-Signature': flashbotsSig } })
			const response = await request.json()
			if (response.error !== undefined && response.error !== null) {
				throw Error(response.error.message)
			}
			if ('result' in response && typeof response.result === 'string') return response.result
			else throw "Flashbots RPC returned invalid data"
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
				<p>{signedMessage.value.state === 'rejected' ? <SingleNotice variant='error' description={signedMessage.value.error.message} title="Error Withdrawing" /> : ''}</p>
				<p>{signedMessage.value.state === 'resolved' ? <SingleNotice variant='success' description={`Transaction submitted with TX Hash ${signedMessage.value.value}`} title="Transaction Submitted" /> : ''}</p>
			</div>
		</div>
	)
}

