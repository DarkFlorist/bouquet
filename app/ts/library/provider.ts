import { batch, Signal } from '@preact/signals'
import { Block, BrowserProvider, getAddress, Wallet } from 'ethers'
import { AddressParser, EthereumAddress } from '../types/ethereumTypes.js'
import { BlockInfo, Signers } from '../types/types.js'
import { fetchSettingsFromStorage } from '../stores.js'
import { BouquetSettings } from '../types/bouquetTypes.js'
import { getOrCreateRelayAuthSigner } from './relayAuth.js'

export type ProviderStore = {
	provider: BrowserProvider
	_clearEvents: () => unknown
	startFastBlockPolling: (onError: (error: unknown) => void) => () => void
	authSigner: Wallet,
	walletAddress: EthereumAddress
	chainId: bigint,
	isInterceptor: boolean
}

const addProvider = async (
	store: Signal<ProviderStore | undefined>,
	provider: BrowserProvider,
	clearEvents: () => unknown,
	startFastBlockPolling: (onError: (error: unknown) => void) => () => void,
	isInterceptor: boolean
) => {
	const [signer, network] = await Promise.all([provider.getSigner(), provider.getNetwork()])
	const address = await signer.getAddress()
	if (store.peek()) removeProvider(store)

	const parsedAddress = AddressParser.parse(getAddress(address))
	if (!parsedAddress.success) throw new Error('Provider provided invalid address!')

	store.value = {
		provider,
		authSigner: getOrCreateRelayAuthSigner(localStorage),
		walletAddress: parsedAddress.value,
		chainId: network.chainId,
		_clearEvents: clearEvents,
		startFastBlockPolling,
		isInterceptor
	}
}

const removeProvider = async (store: Signal<ProviderStore | undefined>) => {
	if (store.peek()) store.peek()?._clearEvents()
	store.value = undefined
}

export const connectBrowserProvider = async (
	store: Signal<ProviderStore | undefined>,
	blockInfo: Signal<{
		blockNumber: bigint
		baseFee: bigint
		priorityFee: bigint
	}>,
	signers: Signal<Signers> | undefined,
	bouquetSettings: Signal<BouquetSettings>,
	options: { detectInterceptor?: boolean } = {},
) => {
	if (!window.ethereum || !window.ethereum.request) throw new Error('No injected wallet detected')
	await window.ethereum.request({ method: 'eth_requestAccounts' }).catch((err: { code: number }) => {
		if (err.code === 4001) {
			throw new Error('Connect Wallet: Wallet connection rejected')
		} else {
			throw new Error(`Connect Wallet: ${JSON.stringify(err)}`)
		}
	})

	const provider = new BrowserProvider(window.ethereum, 'any')
	let fastBlockPollingTimer: ReturnType<typeof globalThis.setInterval> | undefined

	const stopFastBlockPolling = () => {
		if (fastBlockPollingTimer === undefined) return
		globalThis.clearInterval(fastBlockPollingTimer)
		fastBlockPollingTimer = undefined
	}

	const startFastBlockPolling = (onError: (error: unknown) => void) => {
		stopFastBlockPolling()
		fastBlockPollingTimer = globalThis.setInterval(() => {
			void provider.getBlock('latest')
				.then((latestBlock) => {
					if (latestBlock === null) throw new Error('Could not retrieve the latest block while submitting the bundle.')
					return updateLatestBlock(latestBlock, store, blockInfo, signers)
				})
				.catch(onError)
		}, 3_000)
		return stopFastBlockPolling
	}

	const blockCallback = async (blockNumber: number) => {
		const block = await provider.getBlock(blockNumber)
		if (block) updateLatestBlock(block, store, blockInfo, signers)
	}

	const disconnectEventCallback = () => {
		removeProvider(store)
	}
	const accountsChangedCallback = (accounts: string[]) => {
		if (accounts.length === 0) {
			removeProvider(store)
		} else {
			const parsedAddress = AddressParser.parse(getAddress(accounts[0]))
			if (!parsedAddress.success) throw new Error('Provider provided invalid address!')
			store.value = store.value ? { ...store.value, walletAddress: parsedAddress.value } : undefined
		}
	}
	const chainChangedCallback = async (chainId: string) => {
		batch(() => {
			bouquetSettings.value = fetchSettingsFromStorage()
			if (store.value) store.value = { ...store.value, chainId: BigInt(chainId) }
		})

		const [accounts, block] = await Promise.all([provider.listAccounts(), provider.getBlock('latest')])
		if (accounts.length > 0 && window.ethereum) {
			clearEvents()
			window.ethereum.on('disconnect', disconnectEventCallback)
			window.ethereum.on('accountsChanged', accountsChangedCallback)
			window.ethereum.on('chainChanged', chainChangedCallback)
			provider.on('block', blockCallback)
		}
		accountsChangedCallback(await Promise.all(accounts.map(account => account.getAddress())))
		if (block) updateLatestBlock(block, store, blockInfo, signers)
	}

	const block = await provider.getBlock('latest')
	if (block) await updateLatestBlock(block, store, blockInfo, signers)

	window.ethereum.on('disconnect', disconnectEventCallback)
	window.ethereum.on('accountsChanged', accountsChangedCallback)
	window.ethereum.on('chainChanged', chainChangedCallback)
	provider.on('block', blockCallback)

	const clearEvents = () => {
		stopFastBlockPolling()
		window.ethereum?.removeListener('disconnect', disconnectEventCallback)
		window.ethereum?.removeListener('accountsChanged', accountsChangedCallback)
		window.ethereum?.removeListener('chainChanged', chainChangedCallback)
		provider.removeListener('block', blockCallback)
	}

	const isInterceptor = options.detectInterceptor === false
		? false
		: (await Promise.allSettled([window.ethereum.request({ method: 'interceptor_getSimulationStack', params: ['1.0.1'] })]))[0].status === 'fulfilled'

	await addProvider(store, provider, clearEvents, startFastBlockPolling, isInterceptor)
}

export async function updateLatestBlock(
	block: Block,
	provider: Signal<ProviderStore | undefined>,
	blockInfo: Signal<BlockInfo>,
	signers: Signal<Signers> | undefined,
) {
	const baseFee = block.baseFeePerGas ? block.baseFeePerGas : 0n
	blockInfo.value = { ...blockInfo.value, blockNumber: BigInt(block.number ?? 0n), baseFee }
	const providerStore = provider.peek()
	const burner = signers?.peek().burner
	if (providerStore === undefined || signers === undefined || burner === undefined) return
	const burnerBalance = await providerStore.provider.getBalance(burner.address)
	if (provider.peek() !== providerStore || signers.peek().burner?.address !== burner.address) return
	signers.value = { ...signers.peek(), burnerBalance }
}
