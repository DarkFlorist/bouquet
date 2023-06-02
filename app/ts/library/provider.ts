import { batch, Signal } from '@preact/signals'
import { providers, Signer, utils, Wallet } from 'ethers'
import { MEV_RELAY_GOERLI, MEV_RELAY_MAINNET } from '../constants.js'
import { AppSettings, Signers } from '../types/types.js'

export type ProviderStore = {
	provider: providers.Web3Provider
	authSigner: Signer,
	_clearEvents: () => unknown
	walletAddress: string
	chainId: number
}

const addProvider = async (
	store: Signal<ProviderStore | undefined>,
	appSettings: Signal<AppSettings>,
	provider: providers.Web3Provider,
	clearEvents: () => unknown,
) => {
	const [signer, network] = await Promise.all([provider.getSigner(), provider.getNetwork()])
	const address = await signer.getAddress()
	if (store.peek()) removeProvider(store)

	if (![1, 5].includes(network.chainId)) {
		await provider.send('wallet_switchEthereumChain', [{ chainId: appSettings.peek().relayEndpoint === MEV_RELAY_MAINNET ? '0x1' : '0x5' }])
	} else {
		appSettings.value = { ...appSettings.peek(), relayEndpoint: network.chainId === 1 ? MEV_RELAY_MAINNET : MEV_RELAY_GOERLI }
	}



	store.value = {
		provider,
		authSigner: Wallet.createRandom().connect(provider),
		walletAddress: utils.getAddress(address),
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
	appSettings: Signal<AppSettings>,
	blockInfo: Signal<{
		blockNumber: bigint
		baseFee: bigint
		priorityFee: bigint
	}>,
	signers: Signal<Signers> | undefined,
) => {
	if (!window.ethereum || !window.ethereum.request) throw new Error('No injected wallet detected')
	await window.ethereum.request({ method: 'eth_requestAccounts' }).catch((err: { code: number }) => {
		if (err.code === 4001) {
			throw new Error('Connect Wallet: Wallet connection rejected')
		} else {
			throw new Error(`Connect Wallet: ${JSON.stringify(err)}`)
		}
	})

	const provider = new providers.Web3Provider(window.ethereum, 'any')

	const disconnectEventCallback = () => {
		removeProvider(store)
	}
	const accountsChangedCallback = (accounts: string[]) => {
		if (accounts.length === 0) {
			removeProvider(store)
		} else {
			store.value = store.value ? { ...store.value, walletAddress: utils.getAddress(accounts[0]) } : undefined
		}
	}
	const chainChangedCallback = async (chainId: string) => {
		if ([1, 5].includes(Number(chainId))) {
			batch(() => {
				appSettings.value = { ...appSettings.peek(), relayEndpoint: Number(chainId) === 1 ? MEV_RELAY_MAINNET : MEV_RELAY_GOERLI }
				store.value = store.value ? { ...store.value, chainId: Number(chainId) } : undefined
			})
		} else {
			store.value = store.value ? { ...store.value, chainId: Number(chainId) } : undefined
		}
		const [accounts, blockNumber] = await Promise.all([provider.listAccounts(), provider.getBlockNumber()])
		accountsChangedCallback(accounts)
		blockCallback(blockNumber)
	}
	const blockCallback = (blockNumber: number) => {
		updateLatestBlock(blockNumber, store, blockInfo, signers)
	}

	provider.getBlock('latest').then((block) => {
		updateLatestBlock(block.number, store, blockInfo, signers)
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

	addProvider(store, appSettings, provider, clearEvents)
}

export async function updateLatestBlock(
	blockNumber: number,
	provider: Signal<ProviderStore | undefined>,
	blockInfo: Signal<{
		blockNumber: bigint
		baseFee: bigint
		priorityFee: bigint
	}>,
	signers: Signal<Signers> | undefined,
) {
	if (!provider.value) return
	const block = await provider.value.provider.getBlock(blockNumber)
	const baseFee = block.baseFeePerGas?.toBigInt() ?? 0n
	blockInfo.value = { blockNumber: BigInt(blockNumber), baseFee, priorityFee: blockInfo.peek().priorityFee }
	if (signers && signers.value.burner) {
		provider.value.provider.getBalance(signers.value.burner.address).then((balance) => (signers.value.burnerBalance = balance.toBigInt()))
	}
}
