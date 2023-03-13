import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "preact/jsx-runtime";
import { computed, useSignal } from '@preact/signals';
import { utils } from 'ethers';
import { useCallback } from 'preact/hooks';
import { createBundleTransactions } from '../library/bundleUtils.js';
import { MEV_RELAY_GOERLI } from '../constants.js';
function formatTransactionDescription(tx) {
    if (tx.functionFragment.inputs.length === 0)
        return _jsx(_Fragment, { children: `${tx.name}()` });
    const params = tx.functionFragment.inputs.map((y, index) => _jsx("p", { class: 'pl-4', children: `${y.name}: ${tx.args[index].toString()}` }));
    return (_jsxs(_Fragment, { children: [_jsx("p", { children: `${tx.name}(` }), params, _jsx("p", { children: ")" })] }));
}
export const TransactionList = ({ parsedTransactions, fundingTx, }) => {
    return (_jsx("div", { class: 'flex w-full flex-col gap-2', children: parsedTransactions.value.map((tx, index) => (_jsxs("div", { class: 'flex w-full min-h-[96px] border-2 border-white rounded-xl', children: [_jsx("div", { class: 'flex w-24 flex-col items-center justify-center text-white border-r-2', children: _jsxs("span", { class: 'text-lg font-bold', children: ["#", index] }) }), _jsxs("div", { class: 'bg-card flex w-full justify-center flex-col gap-2 rounded-r-xl p-4 text-sm font-semibold', children: [_jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-10 text-right', children: "From" }), _jsx("span", { class: 'rounded bg-background px-2 py-1 font-mono font-medium', children: fundingTx && tx.transaction.from === parsedTransactions.peek()[0].transaction.from ? 'FUNDING WALLET' : tx.transaction.from })] }), _jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-10 text-right', children: "To" }), _jsx("span", { class: 'rounded bg-background px-2 py-1 font-mono font-medium', children: tx.transaction.to })] }), _jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-10 text-right', children: "Value" }), _jsxs("span", { class: 'rounded bg-background px-2 py-1 font-mono font-medium', children: [utils.formatEther(tx.transaction.value ?? 0n), " ETH"] })] }), tx.decoded ? (_jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-10 text-right', children: "Data" }), _jsx("span", { class: 'rounded bg-background px-2 py-1 font-mono font-medium w-full break-all', children: tx.decoded })] })) : tx.transaction.data && tx.transaction.data !== '0x' ? (_jsxs("div", { class: 'flex gap-2 items-center', children: [_jsx("span", { class: 'w-10 text-right', children: "Data" }), _jsx("span", { class: 'rounded bg-background px-2 py-1 font-mono font-medium w-full break-all', children: tx.transaction.data.toString() })] })) : null] })] }))) }));
};
export const Transactions = ({ interceptorPayload, signers, blockInfo, appSettings, fundingAmountMin, }) => {
    const transactions = computed(() => createBundleTransactions(interceptorPayload.peek(), signers.peek(), blockInfo.peek(), appSettings.peek().blocksInFuture, fundingAmountMin.peek()));
    const parsedTransactions = useSignal(transactions.peek());
    const parseTransactionsCb = async () => {
        try {
            const uniqueAddresses = [...new Set(transactions.value.map((x) => x.transaction.to))];
            // @TODO: Map correctly to APIs when adding custom rpc support
            const requests = await Promise.all(uniqueAddresses.map((address) => fetch(`https://api${appSettings.peek().relayEndpoint === MEV_RELAY_GOERLI ? '-goerli' : ''}.etherscan.io/api?module=contract&action=getabi&address=${address}&apiKey=PSW8C433Q667DVEX5BCRMGNAH9FSGFZ7Q8`)));
            const abis = await Promise.all(requests.map((request) => request.json()));
            const interfaces = abis.reduce((acc, curr, index) => {
                if (curr.status === '1')
                    return { ...acc, [`${uniqueAddresses[index]}`]: new utils.Interface(curr.result) };
                else
                    return acc;
            }, {});
            const parsed = transactions.value.map((tx) => {
                if (tx.transaction.to && tx.transaction.data && tx.transaction.data !== '0x' && tx.transaction.data.length > 0) {
                    const decoded = formatTransactionDescription(interfaces[tx.transaction.to].parseTransaction({ ...tx.transaction, data: tx.transaction.data.toString() }));
                    return { ...tx, decoded };
                }
                return tx;
            });
            parsedTransactions.value = parsed;
        }
        catch (error) {
            console.log('parseTransactionsCb Error:', error);
            parsedTransactions.value = transactions.peek();
        }
    };
    useCallback(parseTransactionsCb, [interceptorPayload.value]);
    parseTransactionsCb();
    return (_jsxs(_Fragment, { children: [_jsx("h2", { className: 'font-bold text-2xl', children: "Your Transactions" }), _jsx(TransactionList, { ...{ parsedTransactions, fundingTx: interceptorPayload.peek()?.containsFundingTx ?? false } })] }));
};
//# sourceMappingURL=Transactions.js.map