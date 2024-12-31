import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "preact/jsx-runtime";
import { useComputed, useSignal } from '@preact/signals';
import { EthereumAddress } from '../types/ethereumTypes.js';
import { serialize } from '../types/types.js';
import { Blockie } from './Blockie.js';
import { SettingsIcon, SettingsModal } from './Settings.js';
import { Button } from './Button.js';
import { importFromInterceptor } from './Import.js';
import { getNetwork } from '../constants.js';
export const Navbar = ({ provider, bouquetSettings, blockInfo, bundle, signers }) => {
    const switchNetwork = async (e) => {
        const elm = e.target;
        provider.peek()?.provider.send('wallet_switchEthereumChain', [{ chainId: `0x${BigInt(elm.value).toString(16)}` }]);
    };
    const blockieScale = useSignal(5);
    const showSettings = useSignal(false);
    const walletAddress = useComputed(() => provider.value?.walletAddress ?? 0n);
    const bouquetNetwork = useComputed(() => getNetwork(bouquetSettings.value, provider.value?.chainId || 1n));
    return (_jsxs("div", { className: 'flex flex-col w-full sm:flex-row items-center justify-between gap-4 border-slate-400/30 h-12', children: [_jsx("h1", { className: 'font-extrabold text-4xl', children: "\uD83D\uDC90" }), _jsxs("div", { className: 'flex gap-4 items-center justify-center w-min max-w-full px-4 sm:px-0 text-sm sm:text-md', children: [provider.value ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: 'flex flex-col items-end justify-around h-full w-full', children: [_jsx("p", { className: 'font-bold text-right w-min max-w-full truncate', children: serialize(EthereumAddress, provider.value.walletAddress) }), _jsxs("span", { className: 'text-gray-500 text-md w-max flex gap-1 items-center', children: [_jsx("svg", { width: '1em', height: '1em', viewBox: '0 0 48 48', xmlns: 'http://www.w3.org/2000/svg', className: 'inline-block', children: _jsx("path", { fill: 'currentColor', d: 'M44 32h-2v-8a2 2 0 0 0-2-2H26v-6h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2v6H8a2 2 0 0 0-2 2v8H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2v-6h12v6h-2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2v-6h12v6h-2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-34 8H6v-4h4ZM22 8h4v4h-4Zm4 32h-4v-4h4Zm16 0h-4v-4h4Z', "data-name": 'icons Q2' }) }), _jsxs("select", { value: provider.value.chainId.toString(), onChange: switchNetwork, className: 'px-2 py-1 bg-black', children: [bouquetSettings.value.map((network) => _jsx("option", { value: network.chainId.toString(), children: network.networkName })), bouquetSettings.value.find((network) => network.chainId === provider.value?.chainId) === undefined ? _jsx("option", { value: provider.value?.chainId.toString(), children: `ChainId: ${provider.value.chainId}` }) : _jsx(_Fragment, {})] })] })] }), _jsx(Blockie, { address: walletAddress, scale: blockieScale })] })) : (!provider.value && bundle.value ? _jsx("p", { className: 'w-max', children: " No Wallet Connected " }) :
                        _jsx("div", { className: 'w-max', children: _jsx(Button, { onClick: () => importFromInterceptor(bundle, provider, blockInfo, signers, bouquetSettings), children: "Connect Wallet" }) })), _jsx("button", { class: 'hover:rotate-45 duration-200 ml-2', onClick: () => (showSettings.value = true), children: _jsx(SettingsIcon, {}) })] }), _jsx(SettingsModal, { display: showSettings, bouquetNetwork: bouquetNetwork, bouquetSettings: bouquetSettings })] }));
};
//# sourceMappingURL=Navbar.js.map