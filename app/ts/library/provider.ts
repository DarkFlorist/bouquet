import { batch, Signal } from '@preact/signals'
import { providers } from 'ethers'
import { MEV_RELAY_GOERLI, MEV_RELAY_MAINNET } from '../constants.js'
import { AppSettings, Signers } from './types.js'

export async function updateLatestBlock(
	blockNumber: number,
	provider: Signal<providers.Web3Provider | undefined>,
	blockInfo: Signal<{
		blockNumber: bigint
		baseFee: bigint
		priorityFee: bigint
	}>,
	signers: Signal<Signers> | undefined,
) {
	if (!provider.value) return
	const block = await provider.value.getBlock(blockNumber)
	const baseFee = block.baseFeePerGas?.toBigInt() ?? 0n
	blockInfo.value = { blockNumber: BigInt(blockNumber), baseFee, priorityFee: blockInfo.peek().priorityFee }
	if (signers && signers.value.burner) {
		provider.value.getBalance(signers.value.burner.address).then((balance) => (signers.value.burnerBalance = balance.toBigInt()))
	}
}

export async function connectWallet(
	provider: Signal<providers.Web3Provider | undefined>,
	blockInfo: Signal<{
		blockNumber: bigint
		baseFee: bigint
		priorityFee: bigint
	}>,
	signers: Signal<Signers> | undefined,
	appSettings: Signal<AppSettings>,
) {
	if (!window.ethereum || !window.ethereum.request) throw Error('Connect Wallet: No Ethereum wallet detected')

	await window.ethereum.request({ method: 'eth_requestAccounts' }).catch((err: { code: number }) => {
		if (err.code === 4001) {
			throw new Error('Connect Wallet: Wallet connection rejected')
		} else {
			throw new Error(`Connect Wallet: ${JSON.stringify(err)}`)
		}
	})

	// We only support goerli right now
	const ethereumProvider = new providers.Web3Provider(window.ethereum, 'any')
	const { chainId } = await ethereumProvider.getNetwork()
	if (![1, 5].includes(chainId)) {
		await ethereumProvider.send('wallet_switchEthereumChain', [{ chainId: appSettings.peek().relayEndpoint === MEV_RELAY_MAINNET ? '0x1' : '0x5' }])
	} else {
		appSettings.value = { ...appSettings.peek(), relayEndpoint: chainId === 1 ? MEV_RELAY_MAINNET : MEV_RELAY_GOERLI }
	}

	if (signers && signers.value.burner) {
		ethereumProvider.getBalance(signers.value.burner.address).then((balance) => (signers.value.burnerBalance = balance.toBigInt()))
	}

	const blockCallback = (blockNumber: number) => {
		updateLatestBlock(blockNumber, provider, blockInfo, signers)
	}

	batch(() => {
		provider.value = ethereumProvider
		provider.value.on('block', blockCallback)
	})
}
