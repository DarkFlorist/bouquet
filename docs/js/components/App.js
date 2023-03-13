import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "preact/jsx-runtime";
import { Import } from './Import.js';
import { Configure } from './Configure.js';
import { Submit } from './Submit.js';
import { Button } from './Button.js';
import { utils, Wallet } from 'ethers';
import { Transactions } from './Transactions.js';
import { useComputed, useSignal } from '@preact/signals';
import { EthereumAddress, GetSimulationStackReply, serialize } from '../library/interceptor-types.js';
import { connectBrowserProvider } from '../library/provider.js';
import { MEV_RELAY_MAINNET } from '../constants.js';
import { getMaxBaseFeeInFutureBlock } from '../library/bundleUtils.js';
import { NetworkDetails } from './NetworkDetails.js';
function fetchBurnerWalletFromStorage() {
    const burnerPrivateKey = localStorage.getItem('wallet');
    try {
        return burnerPrivateKey ? new Wallet(burnerPrivateKey) : Wallet.createRandom();
    }
    catch {
        return Wallet.createRandom();
    }
}
function fetchPayloadFromStorage() {
    const payload = JSON.parse(localStorage.getItem('payload') ?? 'null');
    if (!payload)
        return undefined;
    const parsed = GetSimulationStackReply.parse(payload);
    const containsFundingTx = parsed.length > 1 && parsed[0].to === parsed[1].from;
    const uniqueSigners = [...new Set(parsed.map((x) => utils.getAddress(serialize(EthereumAddress, x.from))))].filter((_, index) => !(index === 0 && containsFundingTx));
    const totalGas = parsed.reduce((sum, tx, index) => (index === 0 && containsFundingTx ? 21000n : BigInt(tx.gasLimit.toString()) + sum), 0n);
    // @TODO: Change this to track minimum amount of ETH needed to deposit
    const inputValue = parsed.reduce((sum, tx, index) => (index === 0 && containsFundingTx ? 0n : BigInt(tx.value.toString()) + sum), 0n);
    return { payload: parsed, containsFundingTx, uniqueSigners, totalGas, inputValue };
}
function fetchSettingsFromStorage() {
    // @TODO: add ability to manage settings
    return { blocksInFuture: 3n, priorityFee: 10n ** 9n * 3n, relayEndpoint: MEV_RELAY_MAINNET };
}
export function App() {
    // Global State
    const provider = useSignal(undefined);
    const blockInfo = useSignal({ blockNumber: 0n, baseFee: 0n, priorityFee: 10n ** 9n * 3n });
    const interceptorPayload = useSignal(fetchPayloadFromStorage());
    const appSettings = useSignal(fetchSettingsFromStorage());
    const signers = useSignal({ burner: fetchBurnerWalletFromStorage(), burnerBalance: 0n, bundleSigners: {} });
    // Sync burnerWallet to localStorage
    signers.subscribe(({ burner }) => {
        if (burner)
            localStorage.setItem('wallet', burner.privateKey);
        else
            localStorage.removeItem('wallet');
    });
    const fundingAmountMin = useComputed(() => {
        if (!interceptorPayload.value)
            return 0n;
        if (!interceptorPayload.value.containsFundingTx)
            return 0n;
        const maxBaseFee = getMaxBaseFeeInFutureBlock(blockInfo.value.baseFee, appSettings.value.blocksInFuture);
        return interceptorPayload.value.totalGas * (blockInfo.value.priorityFee + maxBaseFee) + interceptorPayload.value.inputValue;
    });
    return (_jsx("main", { class: 'bg-background text-primary w-full min-h-screen sm:px-6 font-serif flex flex-col items-center', children: _jsxs("article", { className: 'p-4 max-w-screen-lg w-full', children: [_jsx(NetworkDetails, { ...{ blockInfo, provider, appSettings } }), _jsx("div", { className: 'p-4 mt-4 flex flex-col gap-8', children: !provider.value && interceptorPayload.value ? (_jsxs("article", { className: 'items-center flex flex-col gap-4 py-8', children: [_jsx("h2", { class: 'text-2xl font-bold', children: "Welcome Back" }), _jsx(Button, { onClick: () => connectBrowserProvider(provider, appSettings, blockInfo, interceptorPayload.peek()?.containsFundingTx ? signers : undefined), children: "Connect Wallet" })] })) : (_jsxs(_Fragment, { children: [_jsx(Import, { ...{ provider, interceptorPayload, blockInfo, signers, appSettings } }), interceptorPayload.value ? _jsx(Transactions, { ...{ interceptorPayload, signers, blockInfo, fundingAmountMin, appSettings } }) : null, _jsx(Configure, { ...{ provider, interceptorPayload, fundingAmountMin, appSettings, signers, blockInfo } }), _jsx(Submit, { ...{ provider, interceptorPayload, fundingAmountMin, signers, appSettings, blockInfo } })] })) })] }) }));
}
//# sourceMappingURL=App.js.map