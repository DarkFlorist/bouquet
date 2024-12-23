import { batch } from '@preact/signals';
import { BrowserProvider, getAddress, Wallet } from 'ethers';
import { AddressParser } from '../types/ethereumTypes.js';
import { fetchSettingsFromStorage } from '../stores.js';
const addProvider = async (store, provider, clearEvents, isInterceptor) => {
    const [signer, network] = await Promise.all([provider.getSigner(), provider.getNetwork()]);
    const address = await signer.getAddress();
    if (store.peek())
        removeProvider(store);
    const parsedAddress = AddressParser.parse(getAddress(address));
    if (!parsedAddress.success)
        throw new Error('Provider provided invalid address!');
    store.value = {
        provider,
        authSigner: Wallet.createRandom(),
        walletAddress: parsedAddress.value,
        chainId: network.chainId,
        _clearEvents: clearEvents,
        isInterceptor
    };
};
const removeProvider = async (store) => {
    if (store.peek())
        store.peek()?._clearEvents();
    store.value = undefined;
};
export const connectBrowserProvider = async (store, blockInfo, signers, bouquetSettings) => {
    if (!window.ethereum || !window.ethereum.request)
        throw new Error('No injected wallet detected');
    await window.ethereum.request({ method: 'eth_requestAccounts' }).catch((err) => {
        if (err.code === 4001) {
            throw new Error('Connect Wallet: Wallet connection rejected');
        }
        else {
            throw new Error(`Connect Wallet: ${JSON.stringify(err)}`);
        }
    });
    const provider = new BrowserProvider(window.ethereum, 'any');
    const blockCallback = async (blockNumber) => {
        const block = await provider.getBlock(blockNumber);
        if (block)
            updateLatestBlock(block, store, blockInfo, signers);
    };
    const disconnectEventCallback = () => {
        removeProvider(store);
    };
    const accountsChangedCallback = (accounts) => {
        if (accounts.length === 0) {
            removeProvider(store);
        }
        else {
            const parsedAddress = AddressParser.parse(getAddress(accounts[0]));
            if (!parsedAddress.success)
                throw new Error('Provider provided invalid address!');
            store.value = store.value ? { ...store.value, walletAddress: parsedAddress.value } : undefined;
        }
    };
    const chainChangedCallback = async (chainId) => {
        batch(() => {
            bouquetSettings.value = fetchSettingsFromStorage();
            if (store.value)
                store.value = { ...store.value, chainId: BigInt(chainId) };
        });
        const [accounts, block] = await Promise.all([provider.listAccounts(), provider.getBlock('latest')]);
        if (accounts.length > 0 && window.ethereum) {
            clearEvents();
            window.ethereum.on('disconnect', disconnectEventCallback);
            window.ethereum.on('accountsChanged', accountsChangedCallback);
            window.ethereum.on('chainChanged', chainChangedCallback);
            provider.on('block', blockCallback);
        }
        accountsChangedCallback(await Promise.all(accounts.map(account => account.getAddress())));
        if (block)
            updateLatestBlock(block, store, blockInfo, signers);
    };
    const block = await provider.getBlock('latest');
    if (block)
        await updateLatestBlock(block, store, blockInfo, signers);
    window.ethereum.on('disconnect', disconnectEventCallback);
    window.ethereum.on('accountsChanged', accountsChangedCallback);
    window.ethereum.on('chainChanged', chainChangedCallback);
    provider.on('block', blockCallback);
    const clearEvents = () => {
        window.ethereum?.removeListener('disconnect', disconnectEventCallback);
        window.ethereum?.removeListener('accountsChanged', accountsChangedCallback);
        window.ethereum?.removeListener('chainChanged', chainChangedCallback);
        provider.removeListener('block', blockCallback);
    };
    const [getSimulationStack] = await Promise.allSettled([window.ethereum.request({ method: 'interceptor_getSimulationStack', params: ['1.0.0'] })]);
    const isInterceptor = getSimulationStack.status === 'fulfilled';
    addProvider(store, provider, clearEvents, isInterceptor);
};
export async function updateLatestBlock(block, provider, blockInfo, signers) {
    const baseFee = block.baseFeePerGas ? block.baseFeePerGas : 0n;
    blockInfo.value = { ...blockInfo.value, blockNumber: BigInt(block.number ?? 0n), baseFee };
    if (provider.value && signers && signers.value.burner) {
        provider.value.provider.getBalance(signers.value.burner.address).then((burnerBalance) => signers.value = { ...signers.value, burnerBalance });
    }
}
//# sourceMappingURL=provider.js.map