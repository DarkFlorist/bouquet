import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "preact/jsx-runtime";
import { batch, useComputed, useSignal } from '@preact/signals';
import { formatUnits, parseUnits } from 'ethers';
import { DEFAULT_NETWORKS } from '../constants.js';
import { Button } from './Button.js';
import { SingleNotice } from './Warns.js';
import { BouquetSettings } from '../types/bouquetTypes.js';
import { fetchSettingsFromStorage } from '../stores.js';
import { useEffect } from 'preact/hooks';
export const SettingsIcon = () => {
    return (_jsxs("svg", { class: 'text-white h-8 w-8', "aria-hidden": 'true', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, viewBox: '0 0 24 24', xmlns: 'http://www.w3.org/2000/svg', children: [_jsx("path", { d: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z', strokeLinecap: 'round', strokeLinejoin: 'round' }), _jsx("path", { d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z', strokeLinecap: 'round', strokeLinejoin: 'round' })] }));
};
export const SettingsModal = ({ display, bouquetNetwork, bouquetSettings }) => {
    const chainId = useSignal({ value: bouquetNetwork.peek().chainId, valid: true });
    const simulationRelayEndpointInput = useSignal({ value: bouquetNetwork.peek().simulationRelayEndpoint, valid: true });
    const submissionRelayEndpointInput = useSignal({ value: bouquetNetwork.peek().submissionRelayEndpoint, valid: true });
    const priorityFeeInput = useSignal({ value: formatUnits(bouquetNetwork.peek().priorityFee, 'gwei'), valid: true });
    const blocksInFutureInput = useSignal({ value: bouquetNetwork.peek().blocksInFuture.toString(10), valid: true });
    const mempoolSubmitRpcEndpoint = useSignal({ value: bouquetNetwork.peek().mempoolSubmitRpcEndpoint, valid: true });
    const mempoolSimulationRpcEndpoint = useSignal({ value: bouquetNetwork.peek().mempoolSimulationRpcEndpoint, valid: true });
    const relayMode = useSignal({ value: bouquetNetwork.peek().relayMode, valid: true });
    const loaded = useSignal(false);
    useEffect(() => {
        bringSettingsValues();
        loaded.value = display.value;
    }, [display.value]);
    const allValidInputs = useComputed(() => submissionRelayEndpointInput.value.valid && simulationRelayEndpointInput.value.valid && priorityFeeInput.value.valid && blocksInFutureInput.value.valid && mempoolSimulationRpcEndpoint.value.valid && mempoolSubmitRpcEndpoint.value.valid && mempoolSubmitRpcEndpoint.value.valid);
    // https://urlregex.com/
    const uriMatcher = new RegExp('^(https?):\\/\\/' + // protocol
        '((?:(?:[a-z\\d](?:[a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '(?:(?:\\d{1,3}\\.){3}\\d{1,3}))' + // OR IP (v4) address
        '(?:\\:(\\d+))?' + // port
        '((?:\\/[-a-z\\d%_.~+]*)*)' + // path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$' // fragment locator
    );
    function validateSimulationRelayEndpointInput(value) {
        simulationRelayEndpointInput.value = { value, valid: uriMatcher.test(value) };
    }
    function validateMempoolSubmitRpcEndpoint(value) {
        mempoolSubmitRpcEndpoint.value = { value, valid: uriMatcher.test(value) };
    }
    function validateMempoolSimulationRpcEndpointInput(value) {
        mempoolSimulationRpcEndpoint.value = { value, valid: uriMatcher.test(value) };
    }
    function validateAndSetSubmissionRelayEndpointInput(value) {
        submissionRelayEndpointInput.value = { value, valid: uriMatcher.test(value) };
    }
    function validateAndSetPriorityFeeInput(value) {
        if (!value)
            return priorityFeeInput.value = { value, valid: false };
        try {
            parseUnits(String(Number(value)), 'gwei');
            return priorityFeeInput.value = { value, valid: true };
        }
        catch {
            return priorityFeeInput.value = { value, valid: false };
        }
    }
    function validateAndSetBlocksInFutureInput(value) {
        if (!value)
            return blocksInFutureInput.value = { value, valid: false };
        try {
            BigInt(value);
            return blocksInFutureInput.value = { value, valid: true };
        }
        catch {
            return blocksInFutureInput.value = { value, valid: false };
        }
    }
    function saveSettings() {
        if (!allValidInputs.value)
            return;
        const newSettings = {
            submissionRelayEndpoint: submissionRelayEndpointInput.value.value,
            simulationRelayEndpoint: simulationRelayEndpointInput.value.value,
            priorityFee: parseUnits(String(Number(priorityFeeInput.value.value)), 'gwei'),
            blocksInFuture: BigInt(blocksInFutureInput.value.value),
            mempoolSubmitRpcEndpoint: mempoolSubmitRpcEndpoint.value.value,
            mempoolSimulationRpcEndpoint: mempoolSimulationRpcEndpoint.value.value,
            relayMode: relayMode.value.value,
        };
        const oldSettings = fetchSettingsFromStorage();
        const index = oldSettings.findIndex((item) => item.chainId === chainId.value.value);
        if (index >= 0) {
            localStorage.setItem('bouquetSettings', JSON.stringify(BouquetSettings.serialize(oldSettings.map((oldSetting) => {
                if (oldSetting.chainId !== chainId.value.value)
                    return oldSetting;
                return { ...oldSetting, ...newSettings };
            }))));
        }
        else {
            localStorage.setItem('bouquetSettings', JSON.stringify(BouquetSettings.serialize([
                ...oldSettings,
                {
                    ...newSettings,
                    chainId: chainId.value.value,
                    networkName: `ChainId: ${chainId.value.value}`,
                    blockExplorerApi: '',
                    blockExplorer: '',
                }
            ])));
        }
        display.value = false;
        bouquetSettings.value = fetchSettingsFromStorage();
    }
    function bringSettingsValues() {
        batch(() => {
            chainId.value = { value: bouquetNetwork.peek().chainId, valid: true };
            simulationRelayEndpointInput.value = { value: bouquetNetwork.peek().simulationRelayEndpoint, valid: true };
            submissionRelayEndpointInput.value = { value: bouquetNetwork.peek().submissionRelayEndpoint, valid: true };
            priorityFeeInput.value = { value: formatUnits(bouquetNetwork.peek().priorityFee, 'gwei'), valid: true };
            blocksInFutureInput.value = { value: bouquetNetwork.peek().blocksInFuture.toString(10), valid: true };
            mempoolSimulationRpcEndpoint.value = { value: bouquetNetwork.peek().mempoolSimulationRpcEndpoint, valid: true };
            mempoolSubmitRpcEndpoint.value = { value: bouquetNetwork.peek().mempoolSubmitRpcEndpoint, valid: true };
            relayMode.value = { value: bouquetNetwork.peek().relayMode, valid: true };
        });
    }
    function resetSettings() {
        localStorage.setItem('bouquetSettings', JSON.stringify(BouquetSettings.serialize(DEFAULT_NETWORKS)));
        bouquetSettings.value = fetchSettingsFromStorage();
        bringSettingsValues();
    }
    function close() {
        display.value = false;
    }
    return display.value && loaded.value ? (_jsx("div", { onClick: close, className: 'bg-white/10 w-full h-full inset-0 fixed p-4 flex flex-col items-center md:pt-24', children: _jsxs("div", { class: 'h-max px-8 py-4 w-full max-w-xl flex flex-col gap-4 bg-black', onClick: (e) => e.stopPropagation(), children: [_jsx("h2", { className: 'text-xl font-semibold', children: "App Settings" }), _jsxs("label", { class: 'toggle-switch', children: [_jsx("input", { type: 'checkbox', checked: relayMode.value.value === 'relay' ? false : true, onChange: (e) => { relayMode.value = { value: e.currentTarget.checked ? 'mempool' : 'relay', valid: true }; } }), _jsx("a", {}), _jsxs("span", { children: [_jsx("span", { class: 'left-span', children: "Relay" }), _jsx("span", { class: 'right-span', children: "Mempool" })] })] }), relayMode.value.value === 'mempool' ? _jsxs(_Fragment, { children: [_jsx(SingleNotice, { variant: 'warn', title: 'Mempool mode is dangerous', description: `When mempool mode is enabled, transactions are sent individually to the RPC URL specified below. As a result, some transactions may not make it onto the blockchain. This mode should only be used if a private relay is unavailable for the network. Additionally, if a sweeper is active on your account there is a high risk that rescue attempts may fail, allowing the sweeper to steal your gas funds and other assets. Use this mode only as a last resort when no other options are available.` }), _jsxs("div", { className: `flex flex-col justify-center border h-16 outline-none px-4 focus-within:bg-white/5 bg-transparent ${!mempoolSimulationRpcEndpoint.value.valid ? 'border-red-400' : 'border-white/50 focus-within:border-white/80'}`, children: [_jsx("span", { className: 'text-sm text-gray-500', children: "Mempool Simulation RPC URL (an RPC with eth_simulateV1 support)" }), _jsx("input", { onInput: (e) => validateMempoolSimulationRpcEndpointInput(e.currentTarget.value), value: mempoolSimulationRpcEndpoint.value.value, type: 'text', className: 'bg-transparent outline-none placeholder:text-gray-600', placeholder: 'https://' })] }, 'mempoolSimulationRpcEndpoint'), _jsxs("div", { className: `flex flex-col justify-center border h-16 outline-none px-4 focus-within:bg-white/5 bg-transparent ${!mempoolSubmitRpcEndpoint.value.valid ? 'border-red-400' : 'border-white/50 focus-within:border-white/80'}`, children: [_jsx("span", { className: 'text-sm text-gray-500', children: "Mempool Submit RPC URL (a sequencer or similar)" }), _jsx("input", { onInput: (e) => validateMempoolSubmitRpcEndpoint(e.currentTarget.value), value: mempoolSubmitRpcEndpoint.value.value, type: 'text', className: 'bg-transparent outline-none placeholder:text-gray-600', placeholder: 'https://' })] }, 'mempoolSubmitRpcEndpoint')] }) : _jsxs(_Fragment, { children: [_jsxs("div", { className: `flex flex-col justify-center border h-16 outline-none px-4 focus-within:bg-white/5 bg-transparent ${!simulationRelayEndpointInput.value.valid ? 'border-red-400' : 'border-white/50 focus-within:border-white/80'}`, children: [_jsx("span", { className: 'text-sm text-gray-500', children: "Bundle Simulation Relay URL" }), _jsx("input", { onInput: (e) => validateSimulationRelayEndpointInput(e.currentTarget.value), value: simulationRelayEndpointInput.value.value, type: 'text', className: 'bg-transparent outline-none placeholder:text-gray-600', placeholder: 'https://' })] }, 'simulationRelayEndpointInput'), _jsxs("div", { className: `flex flex-col justify-center border h-16 outline-none px-4 focus-within:bg-white/5 bg-transparent ${!submissionRelayEndpointInput.value.valid ? 'border-red-400' : 'border-white/50 focus-within:border-white/80'}`, children: [_jsx("span", { className: 'text-sm text-gray-500', children: "Bundle Submission Relay URL" }), _jsx("input", { onInput: (e) => validateAndSetSubmissionRelayEndpointInput(e.currentTarget.value), value: submissionRelayEndpointInput.value.value, type: 'text', className: 'bg-transparent outline-none placeholder:text-gray-600', placeholder: 'https://' })] }, 'submissionRelayEndpointInput'), _jsxs("div", { className: `flex flex-col justify-center border h-16 outline-none px-4 focus-within:bg-white/5 bg-transparent ${!blocksInFutureInput.value.valid ? 'border-red-400' : 'border-white/50 focus-within:border-white/80'}`, children: [_jsx("span", { className: 'text-sm text-gray-500', children: "Target Blocks In Future For Bundle Confirmation" }), _jsx("input", { onInput: (e) => validateAndSetBlocksInFutureInput(e.currentTarget.value), value: blocksInFutureInput.value.value, type: 'number', className: 'bg-transparent outline-none placeholder:text-gray-600' })] }, 'blocksInFutureInput')] }), _jsxs("div", { className: `flex flex-col justify-center border h-16 outline-none px-4 focus-within:bg-white/5 bg-transparent ${!priorityFeeInput.value.valid ? 'border-red-400' : 'border-white/50 focus-within:border-white/80'}`, children: [_jsx("span", { className: 'text-sm text-gray-500', children: "Priority Fee (GWEI)" }), _jsx("input", { onInput: (e) => validateAndSetPriorityFeeInput(e.currentTarget.value), value: priorityFeeInput.value.value, type: 'number', className: 'bg-transparent outline-none placeholder:text-gray-600', placeholder: '0.1' })] }), _jsxs("div", { className: 'flex gap-2', children: [_jsx(Button, { onClick: saveSettings, disabled: !allValidInputs.value, variant: 'primary', children: "Save" }), _jsx(Button, { onClick: resetSettings, variant: 'secondary', children: "Reset" })] })] }) })) : null;
};
//# sourceMappingURL=Settings.js.map