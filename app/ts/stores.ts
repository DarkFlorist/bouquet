import { useComputed, useSignal } from '@preact/signals'
import { utils, Wallet } from 'ethers'
import { MEV_RELAY_MAINNET } from './constants.js'
import { getMaxBaseFeeInFutureBlock } from './library/bundleUtils.js'
import { EthereumAddress } from './types/ethereumTypes.js'
import { ProviderStore } from './library/provider.js'
import { AppSettings, BlockInfo, Bundle, serialize, Signers } from './types/types.js'
import { TransactionList } from './types/bouquetTypes.js'

function fetchBurnerWalletFromStorage() {
	const burnerPrivateKey = localStorage.getItem('wallet')
	try {
		return burnerPrivateKey ? new Wallet(burnerPrivateKey) : Wallet.createRandom()
	} catch {
		return Wallet.createRandom()
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

	const containsFundingTx = parsed.length > 1 && parsed[0].to === parsed[1].from
	const uniqueSigners = [...new Set(parsed.map((x) => utils.getAddress(serialize(EthereumAddress, x.from))))].filter(
		(_, index) => !(index === 0 && containsFundingTx),
	)
	const totalGas = parsed.reduce((sum, tx, index) => (index === 0 && containsFundingTx ? 21000n : BigInt(tx.gasLimit.toString()) + sum), 0n)
	// @TODO: Change this to track minimum amount of ETH needed to deposit
	const inputValue = parsed.reduce((sum, tx, index) => (index === 0 && containsFundingTx ? 0n : BigInt(tx.value.toString()) + sum), 0n)

	return { transactions: parsed, containsFundingTx, uniqueSigners, totalGas, inputValue }
}

function fetchSettingsFromStorage() {
	const defaultValues: AppSettings = { blocksInFuture: 3n, priorityFee: 10n ** 9n * 3n, relayEndpoint: MEV_RELAY_MAINNET };
	const custom = localStorage.getItem('bouquetSettings')
	if (!custom) {
		return defaultValues
	} else {
		try {
			const parsed = JSON.parse(custom)
			if ('relayEndpoint' in parsed) defaultValues.relayEndpoint = parsed.relayEndpoint
			if ('priorityFee' in parsed) defaultValues.priorityFee = BigInt(parsed.priorityFee)
			if ('blocksInFuture' in parsed) defaultValues.blocksInFuture = BigInt(parsed.blocksInFuture)
			return defaultValues
		} catch {
			return defaultValues
		}
	}
}

export function createGlobalState() {
	const appSettings = useSignal<AppSettings>(fetchSettingsFromStorage())
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
		const maxBaseFee = getMaxBaseFeeInFutureBlock(blockInfo.value.baseFee, appSettings.value.blocksInFuture)
		return bundle.value.totalGas * (blockInfo.value.priorityFee + maxBaseFee) + bundle.value.inputValue
	})

	return { provider, blockInfo, bundle, appSettings, signers, fundingAmountMin }
}
