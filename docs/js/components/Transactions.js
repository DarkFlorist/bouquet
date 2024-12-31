import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "preact/jsx-runtime";
import { useSignal, useSignalEffect } from '@preact/signals';
import { EtherSymbol, formatEther, getAddress, Interface, parseEther } from 'ethers';
import { serialize } from '../types/types.js';
import { Button } from './Button.js';
import { useAsyncState } from '../library/asyncState.js';
import { TransactionList } from '../types/bouquetTypes.js';
import { SingleNotice } from './Warns.js';
import { GetSimulationStackReply } from '../types/interceptorTypes.js';
import { addressString } from '../library/utils.js';
import { importFromInterceptor } from './Import.js';
import { EtherscanGetABIResult, EtherscanSourceCodeResult, SourcifyMetadataResult } from '../types/apiTypes.js';
import { getNetwork } from '../constants.js';
function formatTransactionDescription(tx) {
    if (tx.fragment.inputs.length === 0)
        return _jsx(_Fragment, { children: `${tx.name}()` });
    const params = tx.fragment.inputs.map((y, index) => _jsx("p", { class: 'pl-4', children: `${y.name}: ${tx.args[index].toString()}` }));
    return (_jsxs(_Fragment, { children: [_jsx("p", { children: `${tx.name}(` }), params, _jsx("p", { children: ")" })] }));
}
const etherScanAbiKey = 'PSW8C433Q667DVEX5BCRMGNAH9FSGFZ7Q8';
export const Transactions = ({ provider, bundle, blockInfo, bouquetSettings, signers, }) => {
    const interfaces = useSignal({});
    const decodedTransactions = useSignal([]);
    const interceptorComparison = useSignal({ different: true });
    function copyTransactions() {
        if (!bundle.value)
            return;
        const parsedList = TransactionList.safeSerialize(bundle.value.transactions);
        if ('success' in parsedList && parsedList.success)
            navigator.clipboard.writeText(JSON.stringify(parsedList.value, null, 2));
    }
    const fetchingAbis = useAsyncState();
    async function fetchAbi(network, address) {
        const normalizedAddressString = getAddress(address.toLowerCase());
        try {
            try {
                if (network.blockExplorerApi !== undefined && network.blockExplorerApi.length > 0) {
                    const result = await fetch(`${network.blockExplorerApi}/api?module=contract&action=getsourcecode&address=${normalizedAddressString}&apiKey=${etherScanAbiKey}`);
                    return EtherscanSourceCodeResult.safeParse(await result.json());
                }
            }
            catch (error) {
                console.error(error);
            }
            const result = await fetch(`https://repo.sourcify.dev/contracts/full_match/${network.chainId.toString(10)}/${normalizedAddressString}/metadata.json`);
            const parsed = SourcifyMetadataResult.safeParse(await result.json());
            if (parsed.success) {
                return { success: true, value: { status: '1', result: [{
                                ABI: JSON.stringify(parsed.value.output.abi),
                                Proxy: '0' //sourcify does not identify this
                            }] } };
            }
        }
        catch (error) {
            console.error(error);
            return { success: false, value: { status: '0' } };
        }
        return { success: false, value: { status: '0' } };
    }
    async function fetchAbis() {
        if (!bundle.value || !bundle.value.transactions)
            return;
        try {
            const uniqueAddresses = [...new Set(bundle.value.transactions.map((tx) => tx.to ? addressString(tx.to) : null).filter(addr => addr))];
            const abis = [];
            const network = getNetwork(bouquetSettings.value, provider.value?.chainId || 1n);
            const parsedSourceCode = await Promise.all(uniqueAddresses.map(async (address) => await fetchAbi(network, address)));
            // Extract ABI from getSourceCode request if not proxy, otherwise attempt to fetch ABI of implementation
            for (const contract of parsedSourceCode) {
                if (contract.success === false || contract.value.status !== '1')
                    abis.push(undefined);
                else {
                    if (contract.value.result[0].Proxy === '1' && contract.value.result[0].Implementation !== '') {
                        const implReq = await fetch(`${network.blockExplorerApi}/api?module=contract&action=getabi&address=${addressString(contract.value.result[0].Implementation)}&apiKey=${etherScanAbiKey}`);
                        const implResult = EtherscanGetABIResult.safeParse(await implReq.json());
                        abis.push(implResult.success && implResult.value.status === '1' ? implResult.value.result : undefined);
                    }
                    else {
                        abis.push(contract.value.result[0].ABI && contract.value.result[0].ABI !== 'Contract source code not verified' ? contract.value.result[0].ABI : undefined);
                    }
                }
            }
            interfaces.value = abis.reduce((acc, curr, index) => {
                if (curr)
                    return { ...acc, [`${uniqueAddresses[index]}`]: new Interface(curr) };
                else
                    return acc;
            }, {});
        }
        catch (error) {
            console.log('parseTransactionsCb Error:', error);
            interfaces.value = {};
        }
    }
    useSignalEffect(() => {
        if (interfaces.value && bundle.value) {
            parseTransactions();
        }
        if (provider.value && provider.value.isInterceptor && !interceptorComparison.value.intervalId)
            createCompareInterval();
    });
    const parseTransactions = async () => {
        if (!bundle.value)
            return;
        decodedTransactions.value = bundle.value.transactions.map((tx) => {
            if (tx.to && tx.input && tx.input.length > 0) {
                const contractAddr = addressString(tx.to);
                const txDescription = interfaces.value[contractAddr] ? interfaces.value[contractAddr].parseTransaction({ value: tx.value ?? undefined, data: tx.input.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '0x') }) : null;
                return txDescription ? formatTransactionDescription(txDescription) : null;
            }
            return null;
        });
    };
    const compare = async () => {
        if (!provider.value || !provider.value.isInterceptor || !bundle.value)
            return false;
        try {
            // fetch stack from Interceptor
            const { payload } = await provider.value.provider.send('interceptor_getSimulationStack', ['1.0.0']);
            const tryParse = GetSimulationStackReply.safeParse(payload);
            if (!tryParse.success)
                return false;
            let parsedInterceptorTransactions = TransactionList.parse(serialize(GetSimulationStackReply, tryParse.value).map(({ from, to, value, input, gasLimit, chainId }) => ({ from, to, value, input, gasLimit, chainId })));
            if (parsedInterceptorTransactions.length === 0)
                return false;
            // Detect 'make me rich'
            if (parsedInterceptorTransactions.length >= 2 && parsedInterceptorTransactions[0].to === parsedInterceptorTransactions[1].from && parsedInterceptorTransactions[0].value === parseEther('200000')) {
                const fundingAddrr = parsedInterceptorTransactions[0].from;
                parsedInterceptorTransactions = parsedInterceptorTransactions.map(tx => tx.from === fundingAddrr ? { ...tx, from: 'FUNDING' } : tx);
            }
            // Compare
            const interceptorValue = TransactionList.serialize(parsedInterceptorTransactions.filter(tx => tx.from !== 'FUNDING'));
            const bouquetValue = TransactionList.serialize(bundle.value.transactions.filter(tx => tx.from !== 'FUNDING'));
            return JSON.stringify(interceptorValue) !== JSON.stringify(bouquetValue);
        }
        catch {
            return false;
        }
    };
    const compareWithInterceptor = async () => {
        const different = await compare();
        interceptorComparison.value = { ...interceptorComparison.value, different };
    };
    async function createCompareInterval() {
        if (!provider.value || !provider.value.isInterceptor)
            return;
        const different = await compare();
        clearInterval(interceptorComparison.value.intervalId);
        interceptorComparison.value = { different, intervalId: setInterval(compareWithInterceptor, 10000) };
    }
    return (_jsxs(_Fragment, { children: [_jsx("h2", { className: 'font-bold text-2xl', children: "Your Transactions" }), _jsxs("div", { className: 'flex flex-row gap-4', children: [_jsx(Button, { variant: 'secondary', disabled: fetchingAbis.value.value.state === 'pending', onClick: () => fetchingAbis.waitFor(fetchAbis), children: "Decode Transactions From Etherscan & Sourcify" }), _jsx(Button, { variant: 'secondary', onClick: copyTransactions, children: _jsxs(_Fragment, { children: ["Copy Transaction List", _jsx("svg", { className: 'h-8 inline-block', "aria-hidden": 'true', fill: 'none', stroke: 'currentColor', "stroke-width": '1.5', viewBox: '0 0 24 24', xmlns: 'http://www.w3.org/2000/svg', children: _jsx("path", { d: 'M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 00-2.25 2.25v6', "stroke-linecap": 'round', "stroke-linejoin": 'round' }) })] }) })] }), interceptorComparison.value.different ? _jsx(SingleNotice, { variant: 'warn', title: 'Potentially Outdated Transaction List', description: _jsxs(_Fragment, { children: ["The transactions imported in Bouquet differ from the current simulation in The Interceptor extension. ", _jsx("button", { onClick: () => importFromInterceptor(bundle, provider, blockInfo, signers, bouquetSettings), class: 'underline text-white font-semibold', children: "Import From Interceptor" }), " "] }) }) : null, _jsx("div", { class: 'flex w-full flex-col gap-2', children: bundle.value?.transactions.map((tx, index) => (_jsxs("div", { class: 'flex w-full min-h-[96px] border border-white/90', children: [_jsx("div", { class: 'flex w-24 flex-col items-center justify-center text-white', children: _jsxs("span", { class: 'text-lg font-bold', children: ["#", index] }) }), _jsxs("div", { class: 'bg-gray-500/30 flex w-full justify-center flex-col gap-2 p-4 text-sm font-semibold', children: [_jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-10 text-right', children: "From" }), _jsx("span", { class: 'bg-black px-2 py-1 font-mono font-medium', children: tx.from !== 'FUNDING' ? addressString(tx.from) : tx.from })] }), _jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-10 text-right', children: "To" }), _jsx("span", { class: 'bg-black px-2 py-1 font-mono font-medium', children: tx.to ? addressString(tx.to) : 'Contract Deployment' })] }), _jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-10 text-right', children: "Value" }), _jsxs("span", { class: 'bg-black px-2 py-1 font-mono font-medium', children: [EtherSymbol, formatEther(tx.value + (tx.from === 'FUNDING' && bundle.value && bundle.value.containsFundingTx ? bundle.value.totalGas * (blockInfo.value.baseFee + blockInfo.value.priorityFee) : 0n)), " + ", EtherSymbol, formatEther(tx.gasLimit * (blockInfo.value.baseFee + blockInfo.value.priorityFee)), " Gas Fee"] })] }), decodedTransactions.value[index] ? (_jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-10 text-right', children: "Data" }), _jsx("span", { class: 'bg-black px-2 py-1 font-mono font-medium w-full break-all', children: decodedTransactions.value[index] })] })) : tx.input && tx.input.length > 0 ? (_jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-10 text-right', children: "Data" }), _jsx("span", { class: 'bg-black px-2 py-1 font-mono font-medium w-full break-all', children: tx.input.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '0x') })] })) : null] })] }))) })] }));
};
//# sourceMappingURL=Transactions.js.map