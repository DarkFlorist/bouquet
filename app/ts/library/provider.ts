import { batch, Signal } from '@preact/signals'
import { Block, BrowserProvider, getAddress, HDNodeWallet, Wallet } from 'ethers'
import { MEV_RELAY_GOERLI, MEV_RELAY_MAINNET } from '../constants.js'
import { AddressParser, EthereumAddress } from '../types/ethereumTypes.js'
import { AppSettings, BlockInfo, Signers } from '../types/types.js'

export type ProviderStore = {
	provider: BrowserProvider
	_clearEvents: () => unknown
	authSigner: HDNodeWallet,
	walletAddress: EthereumAddress
	chainId: bigint
}

const addProvider = async (
	store: Signal<ProviderStore | undefined>,
	provider: BrowserProvider,
	clearEvents: () => unknown,
	appSettings: Signal<AppSettings>
) => {
	const [signer, network] = await Promise.all([provider.getSigner(), provider.getNetwork()])
	const address = await signer.getAddress()
	if (store.peek()) removeProvider(store)

	const parsedAddress = AddressParser.parse(getAddress(address))
	if (!parsedAddress.success) throw new Error("Provider provided invalid address!")

	if (![1n, 5n].includes(network.chainId)) {
		await provider.send('wallet_switchEthereumChain', [{ chainId: appSettings.peek().relayEndpoint === MEV_RELAY_MAINNET ? '0x1' : '0x5' }])
	} else {
		appSettings.value = { ...appSettings.peek(), relayEndpoint: network.chainId === 1n ? MEV_RELAY_MAINNET : MEV_RELAY_GOERLI }
	}

	store.value = {
		provider,
		authSigner: Wallet.createRandom(),
		walletAddress: parsedAddress.value,
		chainId: network.chainId,
		_clearEvents: clearEvents,
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
	appSettings: Signal<AppSettings>
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

	const disconnectEventCallback = () => {
		removeProvider(store)
	}
	const accountsChangedCallback = (accounts: string[]) => {
		if (accounts.length === 0) {
			removeProvider(store)
		} else {
			const parsedAddress = AddressParser.parse(getAddress(accounts[0]))
			if (!parsedAddress.success) throw new Error("Provider provided invalid address!")
			store.value = store.value ? { ...store.value, walletAddress: parsedAddress.value } : undefined
		}
	}
	const chainChangedCallback = async (chainId: string) => {
		if ([1n, 5n].includes(BigInt(chainId))) {
			batch(() => {
				appSettings.value = { ...appSettings.peek(), relayEndpoint: BigInt(chainId) === 1n ? MEV_RELAY_MAINNET : MEV_RELAY_GOERLI }
				store.value = store.value ? { ...store.value, chainId: BigInt(chainId) } : undefined
			})
		} else {
			store.value = store.value ? { ...store.value, chainId: BigInt(chainId) } : undefined
		}

		const [accounts, block] = await Promise.all([provider.listAccounts(), provider.getBlock('latest')])
		if (accounts.length > 0 && window.ethereum) {
			clearEvents()
			window.ethereum.on('disconnect', disconnectEventCallback)
			window.ethereum.on('accountsChanged', accountsChangedCallback)
			window.ethereum.on('chainChanged', chainChangedCallback)
			provider.on('block', blockCallback)
		}
		accountsChangedCallback(await Promise.all(accounts.map(account => account.getAddress())))
		if (block) blockCallback(block)
	}
	const blockCallback = (block: Block | null) => {
		if (block) updateLatestBlock(block, store, blockInfo, signers)
	}

	provider.getBlock('latest').then((block) => {
		if (block) updateLatestBlock(block, store, blockInfo, signers)
	})

	window.ethereum.on('disconnect', disconnectEventCallback)
	window.ethereum.on('accountsChanged', accountsChangedCallback)
	window.ethereum.on('chainChanged', chainChangedCallback)
	provider.on('block', blockCallback)

	const clearEvents = () => {
		window.ethereum?.removeListener('disconnect', disconnectEventCallback)
		window.ethereum?.removeListener('accountsChanged', accountsChangedCallback)
		window.ethereum?.removeListener('chainChanged', chainChangedCallback)
		provider.removeListener('block', blockCallback)
	}

	addProvider(store, provider, clearEvents, appSettings)
}

export async function updateLatestBlock(
	block: Block,
	provider: Signal<ProviderStore | undefined>,
	blockInfo: Signal<BlockInfo>,
	signers: Signal<Signers> | undefined,
) {
	const baseFee = block.baseFeePerGas ? block.baseFeePerGas : 0n
	blockInfo.value = { ...blockInfo.value, blockNumber: BigInt(block.number ?? 0n), baseFee }
	if (provider.value && signers && signers.value.burner) {
		provider.value.provider.getBalance(signers.value.burner.address).then((balance) => (signers.value.burnerBalance = balance))
	}
}
