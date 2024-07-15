import { useComputed, useSignal } from '@preact/signals'
import { Wallet } from 'ethers'
import { DEFAULT_NETWORKS, getNetwork } from './constants.js'
import { getMaxBaseFeeInFutureBlock } from './library/bundleUtils.js'
import { EthereumAddress } from './types/ethereumTypes.js'
import { ProviderStore } from './library/provider.js'
import { BlockInfo, Bundle, Signers } from './types/types.js'
import { BouquetSettings, TransactionList } from './types/bouquetTypes.js'
import { addressString } from './library/utils.js'

function fetchBurnerWalletFromStorage(): Wallet {
	const burnerPrivateKey = localStorage.getItem('wallet')
	try {
		return burnerPrivateKey ? new Wallet(burnerPrivateKey) : new Wallet(Wallet.createRandom().privateKey)
	} catch {
		return new Wallet(Wallet.createRandom().privateKey)
	}
}

function fetchBundleFromStorage(): Bundle | undefined {
	const payload = JSON.parse(localStorage.getItem('payload') ?? 'null')
	if (!payload) return undefined
	const tryParse = TransactionList.safeParse(payload)
	if (!tryParse.success) {
		localStorage.removeItem('payload')
		return undefined
	}
	const parsed = tryParse.value

	const uniqueToAddresses = [...new Set(parsed.map(({ from }) => from))]
	const containsFundingTx = uniqueToAddresses.includes('FUNDING')
	const uniqueSigners = uniqueToAddresses.filter((address): address is EthereumAddress => address !== 'FUNDING').map(address => addressString(address))

	const totalGas = parsed.reduce((sum, tx) => tx.gasLimit + sum, 0n)
	const inputValue = parsed.reduce((sum, tx) => tx.from === 'FUNDING' ? tx.value + sum : sum, 0n)

	return { transactions: parsed, containsFundingTx, uniqueSigners, totalGas, inputValue }
}

export function fetchSettingsFromStorage() {
	const nonParsed = localStorage.getItem('bouquetSettings')
	if (nonParsed === null) return DEFAULT_NETWORKS
	const settings = BouquetSettings.safeParse(JSON.parse(nonParsed))
	if (!settings.success) return DEFAULT_NETWORKS
	return settings.value
}

export function createGlobalState() {
	const bouquetSettings = useSignal<BouquetSettings>(fetchSettingsFromStorage())
	const provider = useSignal<ProviderStore | undefined>(undefined)
	const blockInfo = useSignal<BlockInfo>({ blockNumber: 0n, baseFee: 0n, priorityFee: 10n ** 9n * 3n })
	const signers = useSignal<Signers>({ burner: fetchBurnerWalletFromStorage(), burnerBalance: 0n, bundleSigners: {} })
	const bundle = useSignal<Bundle | undefined>(fetchBundleFromStorage())

	// Sync burnerWallet to localStorage
	signers.subscribe(({ burner }) => {
		if (burner) localStorage.setItem('wallet', burner.privateKey)
		else localStorage.removeItem('wallet')
	})
	
	const fundingAmountMin = useComputed(() => {
		if (!bundle.value) return 0n
		if (!bundle.value.containsFundingTx) return 0n
		const network = getNetwork(bouquetSettings.value, provider.value?.chainId || 1n)
		const maxBaseFee = getMaxBaseFeeInFutureBlock(blockInfo.value.baseFee, network.blocksInFuture)
		return bundle.value.totalGas * (blockInfo.value.priorityFee + maxBaseFee) + bundle.value.inputValue
	})

	return { provider, blockInfo, bundle, bouquetSettings, signers, fundingAmountMin }
}
