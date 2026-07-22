import { useComputed, useSignal } from '@preact/signals'
import { Wallet } from 'ethers'
import { DEFAULT_NETWORKS, getNetwork } from './constants.js'
import { getMaxBaseFeeInFutureBlock } from './library/bundleUtils.js'
import { ProviderStore } from './library/provider.js'
import { BlockInfo, Bundle, Signers } from './types/types.js'
import { BouquetSettings, TransactionList } from './types/bouquetTypes.js'
import { createBundle } from './library/bundle.js'
import { createRescueBundle, ensureDelegationClearFunding } from './library/rescue.js'

function fetchBurnerWalletFromStorage(): Wallet {
	const burnerPrivateKey = localStorage.getItem('wallet')
	try {
		return burnerPrivateKey ? new Wallet(burnerPrivateKey) : new Wallet(Wallet.createRandom().privateKey)
	} catch {
		return new Wallet(Wallet.createRandom().privateKey)
	}
}

export function fetchBundleFromStorage(): Bundle | undefined {
	const payload = JSON.parse(localStorage.getItem('payload') ?? 'null')
	if (!payload) return undefined
	const tryParse = TransactionList.safeParse(payload)
	if (!tryParse.success) {
		localStorage.removeItem('payload')
		return undefined
	}
	const transactionsWithFunding = ensureDelegationClearFunding(tryParse.value)
	if (transactionsWithFunding === tryParse.value) return createBundle(tryParse.value)
	const migratedBundle = createRescueBundle(transactionsWithFunding)
	localStorage.setItem('payload', JSON.stringify(TransactionList.serialize(migratedBundle.transactions)))
	return migratedBundle
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
		return bundle.value.totalGas * (network.priorityFee + maxBaseFee) + bundle.value.inputValue
	})

	return { provider, blockInfo, bundle, bouquetSettings, signers, fundingAmountMin }
}
