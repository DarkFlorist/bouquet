import { Signal, useComputed, useSignal } from '@preact/signals'
import { getAddress } from 'ethers'
import { JSX } from 'preact/jsx-runtime'
import { getTransactionCountBeforeSimulation } from '../library/bundleUtils.js'
import { ProviderStore } from '../library/provider.js'
import { createClearDelegationTransaction, createRescueBundle } from '../library/rescue.js'
import { addressString } from '../library/utils.js'
import { Bundle, Signers } from '../types/types.js'
import { TransactionList } from '../types/bouquetTypes.js'
import { Button } from './Button.js'
import { SingleNotice } from './Warns.js'

const getSingleChainId = (bundle: Bundle) => {
	const chainIds = [...new Set(bundle.transactions.map((transaction) => transaction.chainId))]
	if (chainIds.length !== 1 || chainIds[0] === undefined) throw new Error('All rescue transactions must use one chain before adding the delegation-clearing transaction.')
	return chainIds[0]
}

const getChainIdLabel = (bundle: Bundle) => {
	try {
		return getSingleChainId(bundle).toString()
	} catch {
		return 'multiple chains detected'
	}
}

const getSuggestedAuthority = (bundle: Bundle) => {
	const fundingRecipient = bundle.transactions.find((transaction) => transaction.from === 'FUNDING')?.to
	if (fundingRecipient !== undefined && fundingRecipient !== null) return addressString(fundingRecipient)
	const sweepSender = bundle.transactions.find((transaction) => transaction.from !== 'FUNDING')?.from
	return sweepSender === undefined || sweepSender === 'FUNDING' ? '' : addressString(sweepSender)
}

export const CreateClearDelegation = ({ bundle, provider, signers }: {
	bundle: Signal<Bundle | undefined>
	provider: Signal<ProviderStore | undefined>
	signers: Signal<Signers>
}) => {
	const isOpen = useSignal(false)
	const authority = useSignal('')
	const sponsor = useSignal('')
	const authorizationNonce = useSignal('')
	const error = useSignal<string | undefined>(undefined)
	const loadingNonce = useSignal(false)
	const activeBundle = useComputed(() => bundle.value)

	const open = () => {
		const currentBundle = bundle.peek()
		if (currentBundle === undefined) return
		authority.value = getSuggestedAuthority(currentBundle)
		sponsor.value = ''
		authorizationNonce.value = ''
		error.value = undefined
		isOpen.value = true
	}

	const lookupNonce = async () => {
		const activeProvider = provider.peek()
		if (activeProvider === undefined) {
			error.value = 'Connect Interceptor before looking up the current authorization nonce.'
			return
		}
		loadingNonce.value = true
		error.value = undefined
		try {
			const normalizedAuthority = getAddress(authority.peek())
			authorizationNonce.value = (await getTransactionCountBeforeSimulation(activeProvider.provider, normalizedAuthority)).toString()
		} catch (caught) {
			error.value = caught instanceof Error ? caught.message : 'Could not retrieve the current authorization nonce.'
		} finally {
			loadingNonce.value = false
		}
	}

	const addTransaction = () => {
		const currentBundle = bundle.peek()
		if (currentBundle === undefined) return
		try {
			if (currentBundle.rescueMode) throw new Error('This bundle already contains a delegation-clearing transaction.')
			const nonce = BigInt(authorizationNonce.peek())
			const transaction = createClearDelegationTransaction({
				sponsor: sponsor.peek(),
				authority: authority.peek(),
				chainId: getSingleChainId(currentBundle),
				authorizationNonce: nonce,
			})
			const nextBundle = createRescueBundle([...currentBundle.transactions, transaction])
			localStorage.setItem('payload', JSON.stringify(TransactionList.serialize(nextBundle.transactions)))
			bundle.value = nextBundle
			signers.value = { ...signers.peek(), bundleSigners: {} }
			error.value = undefined
			isOpen.value = false
		} catch (caught) {
			error.value = caught instanceof Error ? caught.message : 'Could not create the delegation-clearing transaction.'
		}
	}

	if (activeBundle.value === undefined || activeBundle.value.rescueMode) return null
	return (
		<div className='flex flex-col gap-4'>
			<Button onClick={open} variant='secondary'>Add EIP-7702 Delegation Clear</Button>
			{isOpen.value ? <div className='border border-orange-400/50 bg-orange-400/10 p-4 flex flex-col gap-4'>
				<h3 className='text-xl font-semibold'>Create Delegation-Clearing Transaction</h3>
				<p className='text-sm text-white/75'>Bouquet will add a sponsored type-4 transaction whose authorization target is the zero address. It will be ordered before funding and sweep transactions.</p>
				<label className='flex flex-col gap-1'>
					<span className='text-sm text-gray-400'>Compromised account</span>
					<input aria-label='Compromised account' value={authority.value} onInput={(event: JSX.TargetedEvent<HTMLInputElement>) => authority.value = event.currentTarget.value} className='h-12 border border-white/50 bg-transparent px-4 outline-none focus:border-white/90' placeholder='0x…' />
				</label>
				<label className='flex flex-col gap-1'>
					<span className='text-sm text-gray-400'>Clean funded sponsor</span>
					<input aria-label='Clean funded sponsor' value={sponsor.value} onInput={(event: JSX.TargetedEvent<HTMLInputElement>) => sponsor.value = event.currentTarget.value} className='h-12 border border-white/50 bg-transparent px-4 outline-none focus:border-white/90' placeholder='0x…' />
				</label>
				<div className='flex flex-col gap-1'>
					<span className='text-sm text-gray-400'>Current authorization nonce</span>
					<div className='flex flex-col sm:flex-row gap-2'>
						<input aria-label='Current authorization nonce' value={authorizationNonce.value} onInput={(event: JSX.TargetedEvent<HTMLInputElement>) => authorizationNonce.value = event.currentTarget.value} className='h-12 border border-white/50 bg-transparent px-4 outline-none focus:border-white/90 flex-grow' placeholder='Load from Interceptor or enter manually' />
						<Button onClick={() => void lookupNonce()} disabled={loadingNonce.value}>{loadingNonce.value ? 'Loading…' : 'Load Current Nonce'}</Button>
					</div>
				</div>
				<p className='text-sm text-white/75'>Chain ID: {getChainIdLabel(activeBundle.value)}. The sponsor and compromised-account keys are entered later in Configure.</p>
				{error.value === undefined ? null : <SingleNotice variant='error' title='Could Not Add Delegation Clear' description={error.value} />}
				<div className='flex gap-2'>
					<Button onClick={addTransaction}>Add Delegation Clear</Button>
					<Button onClick={() => isOpen.value = false} variant='secondary'>Cancel</Button>
				</div>
			</div> : null}
		</div>
	)
}
