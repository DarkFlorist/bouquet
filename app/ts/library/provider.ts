import { batch, Signal } from '@preact/signals'
import { providers } from 'ethers'
import { Signers } from './types'

export async function updateLatestBlock(
	blockNumber: number,
	provider: Signal<providers.Web3Provider | undefined>,
	blockInfo: Signal<{
		blockNumber: bigint
		baseFee: bigint
		priorityFee: bigint
	}>,
) {
	if (!provider.value) return
	const block = await provider.value.getBlock(blockNumber)
	const baseFee = block.baseFeePerGas?.toBigInt() ?? 0n
	if (!blockInfo.peek() || BigInt(blockNumber) > blockInfo.peek().blockNumber) {
		blockInfo.value = { blockNumber: BigInt(blockNumber), baseFee, priorityFee: blockInfo.peek().priorityFee }
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
	if (chainId !== 5) {
		await ethereumProvider.send('wallet_switchEthereumChain', [{ chainId: '0x5' }])
	}

	if (signers && signers.value.burner) {
		ethereumProvider.getBalance(signers.value.burner.address).then((balance) => (signers.value.burnerBalance = balance.toBigInt()))
	}

	const blockCallback = (blockNumber: number) => {
		updateLatestBlock(blockNumber, provider, blockInfo)
	}

	batch(() => {
		provider.value = ethereumProvider
		provider.value.on('block', blockCallback)
	})
}
