import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "preact/jsx-runtime";
import { useState } from 'preact/hooks';
import { createProvider, sendBundle, simulate } from '../library/bundleUtils.js';
import { FlashbotsBundleResolution } from '../library/flashbots-ethers-provider.js';
import { Button } from './Button.js';
import { useComputed, useSignal, useSignalEffect } from '@preact/signals';
const SimulationPromiseBlock = ({ state, }) => {
    if (!state)
        return _jsx(_Fragment, {});
    if (!state.value || state.status === 'pending')
        return _jsx("div", { children: "Simulating..." });
    if (state.status === 'resolved')
        return (_jsx("div", { children: state.value.firstRevert ? (_jsxs(_Fragment, { children: [_jsx("h3", { class: 'font-semibold text-error mb-2', children: "Simulation Reverted" }), _jsxs("div", { class: 'flex w-full min-h-[96px] border-2 border-white rounded-xl', children: [_jsx("div", { class: 'flex w-24 flex-col items-center justify-center text-white border-r-2', children: _jsxs("span", { class: 'text-lg font-bold', children: ["#", state.value.results.findIndex((x) => 'error' in x)] }) }), _jsxs("div", { class: 'bg-card flex w-full justify-center flex-col gap-2 rounded-r-xl p-4 text-sm font-semibold', children: [_jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-10 text-right', children: "From" }), _jsx("span", { class: 'rounded bg-background px-2 py-1 font-mono font-medium', children: state.value.firstRevert.fromAddress })] }), _jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-10 text-right', children: "To" }), _jsx("span", { class: 'rounded bg-background px-2 py-1 font-mono font-medium', children: state.value.firstRevert.toAddress })] }), _jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-10 text-right', children: "Error" }), _jsx("span", { class: 'rounded bg-background px-2 py-1 font-mono font-medium', children: 'revert' in state.value.firstRevert ? String(state.value.firstRevert.revert) : 'Unknown' })] })] })] })] })) : (_jsx("h3", { class: 'font-semibold text-success', children: "Simulation Succeeded" })) }));
    if (state.status === 'rejected')
        return (_jsx("div", { children: _jsxs("p", { children: ["Error Simulating: ", state.error?.error.message] }) }));
    return _jsx(_Fragment, {});
};
export const Bundles = ({ pendingBundles, appSettings, }) => {
    return (_jsx("div", { class: 'flex flex-col-reverse gap-4', children: pendingBundles.value.pendingBundles.map((bundle, index) => (_jsxs("div", { class: 'flex items-center font-semibold gap-2 text-white', children: [_jsxs("p", { children: ["Attempt ", index + 1, ":"] }), bundle.state === 'pending' ? (_jsxs("span", { class: 'font-normal text-orange-400', children: ["Trying to be included in block ", (BigInt(bundle.details) + appSettings.peek().blocksInFuture).toString()] })) : null, bundle.state === 'rejected' ? _jsx("span", { class: 'font-normal text-error', children: "Error submitting bundle to node" }) : null, bundle.details === 'BlockPassedWithoutInclusion' ? _jsx("span", { class: 'font-normal text-error', children: "Bundle was not included in target block" }) : null, bundle.details === 'AccountNonceTooHigh' ? _jsx("span", { class: 'font-normal text-error', children: "Nonces in bundle already used" }) : null, bundle.state === 'resolved' && bundle.details !== 'AccountNonceTooHigh' && bundle.details !== 'BlockPassedWithoutInclusion' ? (_jsx("span", { class: 'font-bold text-lg text-success', children: "Bundle Included!" })) : null] }))) }));
};
export const Submit = ({ provider, interceptorPayload, fundingAmountMin, signers, appSettings, blockInfo, }) => {
    const [simulationResult, setSimulationResult] = useState(undefined);
    const flashbotsProvider = useSignal(undefined);
    const bundleStatus = useSignal({
        active: false,
        lastBlock: blockInfo.peek().blockNumber,
        pendingBundles: [],
    });
    useSignalEffect(() => {
        blockInfo.value.blockNumber; // trigger effect
        if (bundleStatus.peek().active && blockInfo.value.blockNumber > bundleStatus.peek().lastBlock) {
            bundleSubmission(blockInfo.value.blockNumber);
        }
    });
    const missingRequirements = useComputed(() => {
        if (!interceptorPayload.value)
            return 'No transactions imported yet.';
        const missingSigners = interceptorPayload.value.uniqueSigners.length !== Object.keys(signers.value.bundleSigners).length;
        const insufficientBalance = signers.value.burnerBalance < fundingAmountMin.value;
        if (missingSigners && insufficientBalance)
            return 'Missing private keys for signing accounts and funding wallet has insufficent balance.';
        if (missingSigners)
            return 'Missing private keys for signing accounts.';
        if (insufficientBalance)
            return 'Funding wallet has insufficent balance.';
        return false;
    });
    async function simulateBundle() {
        const relayProvider = flashbotsProvider.value ?? (await createProvider(provider));
        if (!flashbotsProvider.value)
            flashbotsProvider.value = relayProvider;
        if (!provider.value)
            throw 'User not connected';
        if (!interceptorPayload.value)
            throw 'No imported bundle found';
        setSimulationResult({ status: 'pending' });
        simulate(relayProvider, provider.value.provider, blockInfo.peek(), appSettings.peek().blocksInFuture, interceptorPayload.value, signers.peek(), fundingAmountMin.peek())
            .then((value) => {
            if (value.error)
                setSimulationResult({ status: 'rejected', error: value });
            else
                setSimulationResult({ status: 'resolved', value: value });
        })
            .catch((err) => setSimulationResult({ status: 'rejected', error: { error: { code: 0, message: `Unhandled Error: ${err}` } } }));
    }
    async function bundleSubmission(blockNumber) {
        const relayProvider = flashbotsProvider.value ?? (await createProvider(provider));
        if (!flashbotsProvider.value)
            flashbotsProvider.value = relayProvider;
        if (!provider.value)
            throw 'User not connected';
        if (!interceptorPayload.value)
            throw 'No imported bundle found';
        const bundleSubmission = await sendBundle(relayProvider, provider.value.provider, { ...blockInfo.peek(), blockNumber }, appSettings.peek().blocksInFuture, interceptorPayload.value, signers.peek(), fundingAmountMin.peek()).catch(() => {
            bundleStatus.value = {
                active: bundleStatus.value.active,
                lastBlock: blockNumber,
                pendingBundles: [...bundleStatus.value.pendingBundles, { hash: '', state: 'rejected', details: `RPC Error: ${blockNumber.toString()}` }],
            };
        });
        if (bundleSubmission) {
            bundleStatus.value = {
                active: bundleStatus.value.active,
                lastBlock: blockNumber,
                pendingBundles: [...bundleStatus.value.pendingBundles, { hash: bundleSubmission.bundleHash, state: 'pending', details: blockNumber.toString() }],
            };
            const status = await bundleSubmission.wait();
            console.log(`Status for ${bundleSubmission.bundleHash}: ${FlashbotsBundleResolution[status]}`);
            if (status === FlashbotsBundleResolution.BundleIncluded) {
                const pendingBundles = bundleStatus.value.pendingBundles;
                const index = pendingBundles.findIndex(({ hash }) => hash === bundleSubmission.bundleHash);
                pendingBundles[index] = { hash: bundleSubmission.bundleHash, state: 'resolved', details: `Bundle Included` };
                bundleStatus.value = { ...bundleStatus.value, active: false, pendingBundles };
            }
            else {
                const pendingBundles = bundleStatus.value.pendingBundles;
                const index = pendingBundles.findIndex(({ hash }) => hash === bundleSubmission.bundleHash);
                pendingBundles[index] = { hash: bundleSubmission.bundleHash, state: 'resolved', details: `${FlashbotsBundleResolution[status]}` };
                bundleStatus.value = { ...bundleStatus.value, pendingBundles };
            }
        }
    }
    async function toggleSubmission() {
        if (!bundleStatus.peek().active) {
            const relayProvider = flashbotsProvider.value ?? (await createProvider(provider));
            if (!flashbotsProvider.value)
                flashbotsProvider.value = relayProvider;
            if (!provider.value)
                throw 'User not connected';
            if (!interceptorPayload.value)
                throw 'No imported bundle found';
            bundleStatus.value = {
                active: true,
                lastBlock: bundleStatus.value.lastBlock,
                pendingBundles: bundleStatus.value.pendingBundles.filter((x) => x.state === 'pending'),
            };
            bundleSubmission(blockInfo.value.blockNumber);
        }
        else {
            bundleStatus.value = { ...bundleStatus.value, active: false };
        }
    }
    return (_jsxs(_Fragment, { children: [_jsx("h2", { className: 'font-bold text-2xl', children: "3. Submit" }), missingRequirements.value ? (_jsx("p", { children: missingRequirements.peek() })) : (_jsxs("div", { className: 'flex flex-col w-full gap-6', children: [_jsx(Button, { onClick: simulateBundle, variant: 'secondary', children: "Simulate" }), _jsx(SimulationPromiseBlock, { state: simulationResult }), _jsx(Button, { onClick: toggleSubmission, children: bundleStatus.value.active ? 'Stop' : 'Submit' }), _jsx(Bundles, { pendingBundles: bundleStatus, appSettings: appSettings })] }))] }));
};
//# sourceMappingURL=Submit.js.map