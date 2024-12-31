import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "preact/jsx-runtime";
import { EtherSymbol, formatEther, formatUnits } from 'ethers';
import { batch, useComputed, useSignal, useSignalEffect } from '@preact/signals';
import { getMaxBaseFeeInFutureBlock } from '../library/bundleUtils.js';
import { Button } from './Button.js';
import { SettingsModal } from './Settings.js';
import { useAsyncState } from '../library/asyncState.js';
import { simulateBundle, sendBundle, checkBundleInclusion } from '../library/flashbots.js';
import { SingleNotice } from './Warns.js';
import { getNetwork } from '../constants.js';
const SimulationResult = ({ state }) => {
    if (state.value.state === 'pending')
        return _jsx("div", { children: "Simulating..." });
    if (state.value.state === 'resolved') {
        return state.value.value.firstRevert ?
            _jsx(SingleNotice, { variant: 'error', title: 'A Transaction Reverted During Simulation', description: _jsxs("div", { class: 'flex w-full min-h-[96px] border border-white/90 mt-4', children: [_jsx("div", { class: 'flex w-16 flex-col items-center justify-center text-white', children: _jsxs("span", { class: 'text-lg font-bold', children: ["#", state.value.value.results.findIndex((x) => 'error' in x)] }) }), _jsxs("div", { class: 'bg-gray-500/30 flex w-full justify-center flex-col gap-2 p-4 text-sm font-semibold', children: [_jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-16 text-right', children: "From" }), _jsx("span", { class: 'bg-black px-2 py-1 font-mono font-medium', children: state.value.value.firstRevert.fromAddress })] }), _jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-16 text-right', children: "To" }), _jsx("span", { class: 'bg-black px-2 py-1 font-mono font-medium', children: state.value.value.firstRevert.toAddress })] }), _jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-16 text-right', children: "Gas Used" }), _jsxs("span", { class: 'bg-black px-2 py-1 font-mono font-medium', children: [state.value.value.firstRevert.gasUsed, " gas"] })] }), _jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-16 text-right', children: "Error" }), _jsx("span", { class: 'bg-black px-2 py-1 font-mono font-medium', children: 'error' in state.value.value.firstRevert ? JSON.stringify(state.value.value.firstRevert.error) : 'Unknown' })] })] })] }) })
            : _jsx(SingleNotice, { variant: 'success', title: 'Simulation Succeeded', description: _jsxs("p", { children: [_jsx("b", { children: state.value.value.results.length }), " Transactions succeeded, consuming ", _jsx("b", { children: state.value.value.totalGasUsed }), " gas with a total fee of ", _jsxs("b", { children: [EtherSymbol, formatEther(state.value.value.gasFees)] }), "."] }) });
    }
    if (state.value.state === 'rejected') {
        return _jsx(SingleNotice, { variant: 'error', title: 'Simulation Failed', description: _jsx("p", { class: 'font-medium w-full break-all', children: state.value.error.message }) });
    }
    return _jsx(_Fragment, {});
};
export const Bundles = ({ outstandingBundles, bouquetNetwork, }) => {
    if (outstandingBundles.value.error)
        return _jsx(SingleNotice, { variant: 'error', title: 'Error Sending Bundle', description: _jsx("p", { class: 'font-medium w-full break-all', children: outstandingBundles.value.error.message }) });
    const blockExplorerBaseUrl = bouquetNetwork.value !== undefined ? bouquetNetwork.value.blockExplorer : undefined;
    return (_jsx("div", { class: 'flex flex-col-reverse gap-4', children: outstandingBundles.value.success
            ? _jsx(SingleNotice, { variant: 'success', title: bouquetNetwork.value.relayMode === 'mempool' ? 'Transactions included!' : 'Bundle Included!', description: _jsxs("div", { children: [_jsxs("h3", { class: 'text-md', children: [_jsx("b", { children: outstandingBundles.value.success.transactions.length }), " ", `transactions were included in block${outstandingBundles.value.success.includedInBlocks.length > 1 ? 's' : ''}`, " ", _jsx("b", { children: outstandingBundles.value.success.includedInBlocks.join(',') })] }), _jsx("div", { class: 'flex flex-col gap-1 py-1', children: outstandingBundles.value.success.transactions.map((tx, index) => blockExplorerBaseUrl
                                ? _jsxs("p", { class: 'flex items-center gap-2', children: [_jsxs("b", { children: ["#", index] }), _jsxs("a", { class: 'underline text-white/50 flex items-center gap-2', href: `${blockExplorerBaseUrl}tx/${tx.hash}`, target: "_blank", children: [tx.hash, _jsxs("svg", { "aria-hidden": "true", class: 'h-6', fill: "none", stroke: "currentColor", "stroke-width": "1.5", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: [" ", _jsx("path", { d: "M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25", "stroke-linecap": "round", "stroke-linejoin": "round" })] })] })] })
                                : _jsxs("p", { children: [_jsxs("b", { children: ["#", index] }), " ", _jsx("span", { class: 'semibold text-white/50', children: tx.hash })] })) })] }) })
            : Object.values(outstandingBundles.value.bundles).map((bundle) => _jsxs("div", { class: 'flex items-center gap-2 text-white', children: [_jsxs("svg", { class: 'animate-spin h-4 w-4 text-white', xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', children: [_jsx("circle", { class: 'opacity-25', cx: '12', cy: '12', r: '10', stroke: 'currentColor', "stroke-width": '4' }), _jsx("path", { class: 'opacity-75', fill: 'currentColor', d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' })] }), _jsxs("p", { children: ["Attempting to get ", bouquetNetwork.value.relayMode === 'mempool' ? 'transactions' : 'bundle', " included before block ", bundle.targetBlock.toString(10), " with max fee of ", Number(formatUnits(bundle.gas.baseFee + bundle.gas.priorityFee, 'gwei')).toPrecision(3), " gwei per gas"] })] })) }));
};
export const Submit = ({ provider, bundle, fundingAmountMin, signers, bouquetSettings, blockInfo, }) => {
    const bouquetNetwork = useComputed(() => getNetwork(bouquetSettings.value, provider.value?.chainId || 1n));
    // General component state
    const showSettings = useSignal(false);
    const missingRequirements = useComputed(() => {
        if (!bundle.value)
            return 'No transactions imported yet.';
        const missingSigners = bundle.value.uniqueSigners.length !== Object.keys(signers.value.bundleSigners).length;
        const insufficientBalance = signers.value.burnerBalance < fundingAmountMin.value;
        if (missingSigners && insufficientBalance)
            return 'Missing private keys for signing accounts and funding wallet has insufficent balance.';
        if (missingSigners)
            return 'Missing private keys for signing accounts.';
        if (insufficientBalance)
            return 'Funding wallet has insufficent balance.';
        return false;
    });
    // Simulations
    const { value: simulationPromise, waitFor: waitForSimulation } = useAsyncState();
    async function simulateCallback() {
        if (!provider.value)
            throw 'User not connected';
        if (!bundle.value)
            throw 'No imported bundle found';
        const simulationResult = await simulateBundle(bundle.value, fundingAmountMin.peek(), provider.value, signers.peek(), blockInfo.peek(), getNetwork(bouquetSettings.peek(), provider.value.chainId));
        if ('error' in simulationResult)
            throw new Error(simulationResult.error.message);
        else
            return simulationResult;
    }
    // Submissions
    const submissionStatus = useSignal({ active: false, lastBlock: 0n, timesSubmited: 0 });
    const outstandingBundles = useSignal({ bundles: {} });
    useSignalEffect(() => {
        if (blockInfo.value.blockNumber > submissionStatus.value.lastBlock) {
            bundleSubmission(blockInfo.value.blockNumber);
        }
    });
    async function bundleSubmission(blockNumber) {
        submissionStatus.value = { ...submissionStatus.peek(), lastBlock: blockNumber };
        if (!provider.value)
            throw new Error('User not connected');
        if (!bundle.value)
            throw new Error('No imported bundle found');
        const providerStore = provider.value;
        // Check status of current bundles
        const checkedPending = await Promise.all(Object.keys(outstandingBundles.peek().bundles).map(bundleHash => checkBundleInclusion(outstandingBundles.peek().bundles[bundleHash].transactions, providerStore)));
        const included = checkedPending.filter(checkedPending => checkedPending.included);
        if (included.length > 0) {
            // We done!
            batch(() => {
                const checkedBundles = Object.keys(outstandingBundles.peek().bundles).reduce((checked, current, index) => {
                    if (checkedPending[index].included) {
                        checked[current] = { ...outstandingBundles.peek().bundles[current], includedInBlocks: checkedPending[index].includedInBlocks };
                        checked[current].included = checkedPending[index].included;
                    }
                    return checked;
                }, {});
                outstandingBundles.value = {
                    error: outstandingBundles.peek().error,
                    bundles: checkedBundles,
                    success: Object.values(checkedBundles).find(x => x.included)
                };
                submissionStatus.value = { active: false, lastBlock: blockNumber, timesSubmited: 0 };
                simulationPromise.value = { ...simulationPromise.value, state: 'inactive' };
            });
        }
        else {
            if (bouquetNetwork.peek().relayMode === 'mempool' && submissionStatus.peek().timesSubmited > 0)
                return; // don't resubmit on mempool mode
            // Remove old submissions
            outstandingBundles.value = {
                error: outstandingBundles.peek().error,
                success: outstandingBundles.peek().success,
                bundles: Object.keys(outstandingBundles.peek().bundles)
                    .filter(tx => outstandingBundles.peek().bundles[tx].targetBlock + 1n > blockNumber)
                    .reduce((obj, bundleHash) => {
                    obj[bundleHash] = outstandingBundles.peek().bundles[bundleHash];
                    return obj;
                }, {})
            };
            // Try Submit
            if (submissionStatus.value.active && !outstandingBundles.value.success) {
                submissionStatus.value = { ...submissionStatus.peek(), timesSubmited: submissionStatus.peek().timesSubmited + 1 };
                try {
                    const targetBlock = blockNumber + bouquetNetwork.peek().blocksInFuture;
                    const gas = blockInfo.peek();
                    gas.priorityFee = bouquetNetwork.value.priorityFee;
                    const bundleRequest = await sendBundle(bundle.value, targetBlock, fundingAmountMin.peek(), provider.value, signers.peek(), blockInfo.peek(), bouquetNetwork.peek());
                    if (!(bundleRequest.bundleIdentifier in outstandingBundles.peek().bundles)) {
                        outstandingBundles.value = { ...outstandingBundles.peek(), bundles: { ...outstandingBundles.peek().bundles, [bundleRequest.bundleIdentifier]: { targetBlock, gas, transactions: bundleRequest.bundleTransactions, included: false } } };
                    }
                }
                catch (err) {
                    console.error('SendBundle error', err);
                    const error = err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' ? new Error(err.message) : new Error('Unknown Error');
                    batch(() => {
                        submissionStatus.value = { active: false, lastBlock: blockNumber, timesSubmited: submissionStatus.peek().timesSubmited };
                        outstandingBundles.value = { ...outstandingBundles.peek(), error };
                    });
                }
            }
        }
    }
    async function toggleSubmission() {
        batch(() => {
            simulationPromise.value = { ...simulationPromise.value, state: 'inactive' };
            outstandingBundles.value = { bundles: !outstandingBundles.peek().success ? outstandingBundles.peek().bundles : {}, error: undefined, success: submissionStatus.peek().active ? outstandingBundles.peek().success : undefined };
            submissionStatus.value = { ...submissionStatus.peek(), active: !submissionStatus.peek().active };
        });
        bundleSubmission(blockInfo.peek().blockNumber);
    }
    return (_jsxs(_Fragment, { children: [_jsxs("h2", { className: 'font-bold text-2xl', children: [_jsx("span", { class: 'text-gray-500', children: "3." }), " Submit"] }), _jsx(SettingsModal, { display: showSettings, bouquetNetwork: bouquetNetwork, bouquetSettings: bouquetSettings }), !outstandingBundles.value.success && missingRequirements.value ? (_jsx("p", { children: missingRequirements.peek() })) : (_jsxs("div", { className: 'flex flex-col w-full gap-4', children: [_jsxs("div", { children: [bouquetNetwork.value.relayMode === 'mempool' ? _jsxs(_Fragment, { children: [_jsx("div", { style: 'padding-bottom: 10px;', children: _jsx(SingleNotice, { variant: 'warn', title: 'Mempool mode is dangerous', description: `You are currently using Mempool mode. Transactions are sent individually so some transactions may not make it onto the blockchain. This mode should only be used if a priate relay is unavailable for the network. Additionally, if a sweeper is active on your account there is a high risk that rescue attempts may fail, allowing the sweeper to steal your gas funds and other assets. Use this mode only as a last resort when no other options are available.` }) }), _jsxs("p", { children: [_jsx("span", { className: 'font-bold', children: "Gas:" }), " ", formatUnits(getMaxBaseFeeInFutureBlock(blockInfo.value.baseFee, bouquetNetwork.value.blocksInFuture), 'gwei'), " gwei + ", formatUnits(bouquetNetwork.value.priorityFee.toString(), 'gwei'), " gwei priority"] }), _jsxs("p", { children: [_jsx("span", { className: 'font-bold', children: "Transaction Submit RPC:" }), " ", bouquetNetwork.value.mempoolSubmitRpcEndpoint] }), _jsxs("p", { children: [_jsx("span", { className: 'font-bold', children: "Transaction Simulation RPC:" }), " ", bouquetNetwork.value.mempoolSimulationRpcEndpoint] })] }) : _jsxs(_Fragment, { children: [_jsxs("p", { children: [_jsx("span", { className: 'font-bold', children: "Gas:" }), " ", formatUnits(getMaxBaseFeeInFutureBlock(blockInfo.value.baseFee, bouquetNetwork.value.blocksInFuture), 'gwei'), " gwei + ", formatUnits(bouquetNetwork.value.priorityFee.toString(), 'gwei'), " gwei priority"] }), _jsxs("p", { children: [_jsx("span", { className: 'font-bold', children: "Relays:" }), " simulation:", bouquetNetwork.value.simulationRelayEndpoint, ", submit:", bouquetNetwork.value.submissionRelayEndpoint, " (Block ", blockInfo.value.blockNumber.toString(), ")"] }), _jsxs("p", { children: ["Transactions will be attempt to be included in the block ", bouquetNetwork.value.blocksInFuture.toString(), " blocks from now."] })] }), _jsxs("p", { children: ["You can edit these settings ", _jsx("button", { className: 'font-bold underline', onClick: () => showSettings.value = true, children: "here" }), "."] })] }), _jsxs("div", { className: 'flex flex-row gap-6', children: [_jsx(Button, { onClick: () => waitForSimulation(simulateCallback), disabled: simulationPromise.value.state === 'pending', variant: 'secondary', children: "Simulate" }), _jsx(Button, { onClick: toggleSubmission, children: submissionStatus.value.active ? (bouquetNetwork.value.relayMode === 'relay' ? `Stop submitting to relay` : `Stop tracking the transactions`) : (bouquetNetwork.value.relayMode === 'mempool' ? `Accept the Risks and Submit` : `Submit to ${bouquetNetwork.value.relayMode}`) })] }), _jsx(SimulationResult, { state: simulationPromise }), _jsx(Bundles, { outstandingBundles: outstandingBundles, bouquetNetwork: bouquetNetwork })] }))] }));
};
//# sourceMappingURL=Submit.js.map