import { batch, Signal } from '@preact/signals'
import { providers } from 'ethers'

export async function updateLatestBlock(
	blockNumber: number,
	provider: Signal<providers.Web3Provider | undefined>,
	latestBlock: Signal<{
		blockNumber: bigint
		baseFee: bigint
		priorityFee: bigint
	}>,
) {
	if (!provider.value) return
	const block = await provider.value.getBlock(blockNumber)
	const baseFee = block.baseFeePerGas?.toBigInt() ?? 0n
	if (!latestBlock.peek() || BigInt(blockNumber) > latestBlock.peek().blockNumber) {
		latestBlock.value = { blockNumber: BigInt(blockNumber), baseFee, priorityFee: latestBlock.peek().priorityFee }
	}
}

export async function connectWallet(provider: Signal<providers.Web3Provider | undefined>, blockCallback: (block: number) => void) {
	if (!window.ethereum || !window.ethereum.request) throw Error('Connect Wallet: No Ethereum wallet detected')

	await window.ethereum.request({ method: 'eth_requestAccounts' }).catch((err: { code: number }) => {
		if (err.code === 4001) {
			throw new Error('Connect Wallet: Wallet connection rejected')
		} else {
			throw new Error(`Connect Wallet: ${JSON.stringify(err)}`)
		}
	})

	const ethereumProvider = new providers.Web3Provider(window.ethereum, 'any')
	const { chainId } = await ethereumProvider.getNetwork()

	// We only support goerli right now
	if (chainId === 5) {
		console.log('helloooo')
		batch(() => {
			provider.value = ethereumProvider
			provider.value.on('block', blockCallback)
		})
	} else {
		ethereumProvider.send('wallet_switchEthereumChain', [{ chainId: '0x5' }])
	}
}
