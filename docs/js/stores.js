import { useComputed, useSignal } from '@preact/signals';
import { Wallet } from 'ethers';
import { DEFAULT_NETWORKS, getNetwork } from './constants.js';
import { getFutureFeeProjection } from './library/bundleUtils.js';
import { BouquetSettings, TransactionList } from './types/bouquetTypes.js';
import { createBundle } from './library/bundle.js';
import { migrateBundleIfNeeded } from './library/bundleMigrations.js';
function fetchBurnerWalletFromStorage() {
    const burnerPrivateKey = localStorage.getItem('wallet');
    try {
        return burnerPrivateKey ? new Wallet(burnerPrivateKey) : new Wallet(Wallet.createRandom().privateKey);
    }
    catch {
        return new Wallet(Wallet.createRandom().privateKey);
    }
}
export function fetchBundleFromStorage() {
    const payload = JSON.parse(localStorage.getItem('payload') ?? 'null');
    if (!payload)
        return undefined;
    const tryParse = TransactionList.safeParse(payload);
    if (!tryParse.success) {
        localStorage.removeItem('payload');
        return undefined;
    }
    return createBundle(tryParse.value);
}
export function initializeBundleFromStorage() {
    const storedBundle = fetchBundleFromStorage();
    if (storedBundle === undefined)
        return undefined;
    const migratedBundle = migrateBundleIfNeeded(storedBundle);
    if (migratedBundle === storedBundle)
        return storedBundle;
    localStorage.setItem('payload', JSON.stringify(TransactionList.serialize(migratedBundle.transactions)));
    return migratedBundle;
}
export function fetchSettingsFromStorage() {
    const nonParsed = localStorage.getItem('bouquetSettings');
    if (nonParsed === null)
        return DEFAULT_NETWORKS;
    const settings = BouquetSettings.safeParse(JSON.parse(nonParsed));
    if (!settings.success)
        return DEFAULT_NETWORKS;
    return settings.value;
}
export function createGlobalState() {
    const bouquetSettings = useSignal(fetchSettingsFromStorage());
    const provider = useSignal(undefined);
    const blockInfo = useSignal({ blockNumber: 0n, baseFee: 0n, priorityFee: 10n ** 9n * 3n });
    const signers = useSignal({ burner: fetchBurnerWalletFromStorage(), burnerBalance: 0n, bundleSigners: {} });
    const bundle = useSignal(initializeBundleFromStorage());
    // Sync burnerWallet to localStorage
    signers.subscribe(({ burner }) => {
        if (burner)
            localStorage.setItem('wallet', burner.privateKey);
        else
            localStorage.removeItem('wallet');
    });
    const fundingAmountMin = useComputed(() => {
        if (!bundle.value)
            return 0n;
        if (!bundle.value.containsFundingTx)
            return 0n;
        const network = getNetwork(bouquetSettings.value, provider.value?.chainId || 1n);
        const maxFeePerGas = getFutureFeeProjection(blockInfo.value, network).maxFeePerGas;
        return bundle.value.totalGas * maxFeePerGas + bundle.value.inputValue;
    });
    return { provider, blockInfo, bundle, bouquetSettings, signers, fundingAmountMin };
}
//# sourceMappingURL=stores.js.map