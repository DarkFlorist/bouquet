import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "preact/jsx-runtime";
import { utils } from 'ethers';
import { MEV_RELAY_GOERLI, MEV_RELAY_MAINNET } from '../constants.js';
export const NetworkDetails = ({ blockInfo, provider, appSettings, }) => {
    const switchNetwork = async (e) => {
        const elm = e.target;
        const relayEndpoint = elm.value;
        if (!provider.value) {
            appSettings.value = { ...appSettings.peek(), relayEndpoint };
        }
        else {
            provider.peek()?.provider.send('wallet_switchEthereumChain', [{ chainId: relayEndpoint === MEV_RELAY_MAINNET ? '0x1' : '0x5' }]);
        }
    };
    return (_jsxs("div", { className: 'flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-slate-400/30', children: [_jsx("h1", { className: 'font-extrabold text-4xl', children: "\uD83D\uDC90" }), _jsxs("div", { class: 'flex flex-col sm:flex-row items-center gap-4', children: [_jsx("div", { className: 'flex flex-col sm:flex-row gap-4', children: provider.value ? (_jsxs(_Fragment, { children: [_jsxs("span", { className: 'flex items-center gap-2', children: [_jsx("svg", { className: 'inline-block h-6', "aria-hidden": 'true', fill: 'none', stroke: 'currentColor', "stroke-width": '1.5', viewBox: '0 0 24 24', xmlns: 'http://www.w3.org/2000/svg', children: _jsx("path", { d: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9', "stroke-linecap": 'round', "stroke-linejoin": 'round' }) }), ' ', Number(blockInfo.value.blockNumber.toString()).toLocaleString('en-us')] }), _jsxs("span", { className: 'flex items-center gap-2', children: [_jsxs("svg", { className: 'h-6', "aria-hidden": 'true', fill: 'none', stroke: 'currentColor', "stroke-width": '1.5', viewBox: '0 0 24 24', xmlns: 'http://www.w3.org/2000/svg', children: [_jsx("path", { d: 'M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z', "stroke-linecap": 'round', "stroke-linejoin": 'round' }), _jsx("path", { d: 'M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z', "stroke-linecap": 'round', "stroke-linejoin": 'round' })] }), "Base ", Number(utils.formatUnits(blockInfo.value.baseFee, 'gwei')).toLocaleString('en-us'), " gwei"] })] })) : (_jsx("p", { children: "No Wallet Connected" })) }), _jsx("div", { children: _jsxs("select", { value: appSettings.value.relayEndpoint, onChange: switchNetwork, className: 'px-4 py-2 rounded-xl border border-slate-200/70 border-2 bg-background', children: [_jsx("option", { value: MEV_RELAY_MAINNET, children: "Ethereum" }), _jsx("option", { value: MEV_RELAY_GOERLI, children: "Goerli" })] }) })] })] }));
};
//# sourceMappingURL=NetworkDetails.js.map