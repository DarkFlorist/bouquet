import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "preact/jsx-runtime";
import { batch, useSignal } from '@preact/signals';
import { useState } from 'preact/hooks';
import { connectBrowserProvider } from '../library/provider.js';
import { GetSimulationStackReply } from '../types/interceptorTypes.js';
import { Button } from './Button.js';
import { TransactionList } from '../types/bouquetTypes.js';
import { ImportModal } from './ImportModal.js';
import { SingleNotice } from './Warns.js';
import { createBundle } from '../library/bundle.js';
import { convertInterceptorTransactions, markSyntheticFunding, requestInterceptorStackAfterConnection, simulationStackRequestError } from '../library/interceptorImport.js';
import { CreateClearDelegation } from './CreateClearDelegation.js';
export async function importFromInterceptor(bundle, provider, blockInfo, signers, bouquetSettings) {
    if (!window.ethereum || !window.ethereum.request)
        throw Error('No Ethereum wallet detected');
    const ethereum = window.ethereum;
    const { payload } = await requestInterceptorStackAfterConnection(async () => {
        if (provider.peek() === undefined)
            await connectBrowserProvider(provider, blockInfo, signers, bouquetSettings, { isInterceptor: true });
    }, () => ethereum
        .request({
        method: 'interceptor_getSimulationStack',
        params: ['1.0.1'],
    })
        .catch((error) => { throw simulationStackRequestError(error); }));
    const tryParse = GetSimulationStackReply.safeParse(payload);
    if (!tryParse.success)
        throw new Error('Wallet does not support returning simulations');
    if (tryParse.value.length === 0)
        throw new Error('You have no transactions on your simulation');
    let converted;
    try {
        converted = convertInterceptorTransactions(tryParse.value);
    }
    catch {
        throw new Error('Malformed simulation stack');
    }
    converted = markSyntheticFunding(converted);
    const containsFundingTx = converted.some((transaction) => transaction.from === 'FUNDING');
    // Take addresses that recieved funding, determine spend deficit - gas fees
    const fundingRecipients = new Set(converted.reduce((result, tx) => (tx.to && tx.from === 'FUNDING' ? [...result, tx.to] : result), []));
    const spenderDeficits = tryParse.value.reduce((amounts, tx) => {
        if (!fundingRecipients.has(tx.from))
            return amounts;
        const receipientBalanceChanges = tx.balanceChanges.filter(x => x.address === tx.from);
        const consumed = tx.value;
        // Rebate is the difference between balance change and consume amount (if there were any internal transactions sending ETH back), ignore gas fees
        const balanceChange = receipientBalanceChanges.reduce((result, balanceChange) => result + balanceChange.after - balanceChange.before, 0n);
        const rebate = balanceChange + consumed + tx.maxPriorityFeePerGas * tx.gasSpent;
        // Calcuate current deficit
        if (tx.from.toString() in amounts) {
            // If credit, deduct current credit from new consumption, or cancel out new consumption and open credit - whichever is smaller
            if (amounts[tx.from.toString()].credit > 0n) {
                if (amounts[tx.from.toString()].credit <= consumed) {
                    amounts[tx.from.toString()].deficit += consumed - amounts[tx.from.toString()].credit;
                    amounts[tx.from.toString()].credit = rebate;
                }
                else {
                    // If consumed less than current rebates, deficit does not increase.
                    amounts[tx.from.toString()].credit += rebate - consumed;
                }
            }
        }
        else {
            amounts[tx.from.toString()] = { deficit: consumed, credit: rebate };
        }
        return amounts;
    }, {});
    const inputValue = Object.values(spenderDeficits).reduce((sum, spender) => spender.deficit + sum, 0n);
    // Copy value and set, input of funding to inputValue
    const transactions = [...converted];
    if (containsFundingTx) {
        const fundingIndex = transactions.findIndex((transaction) => transaction.from === 'FUNDING');
        transactions[fundingIndex] = { ...transactions[fundingIndex], value: inputValue };
    }
    const importedBundle = createBundle(transactions);
    localStorage.setItem('payload', JSON.stringify(TransactionList.serialize(importedBundle.transactions)));
    bundle.value = importedBundle;
}
export const Import = ({ bundle, provider, blockInfo, signers, bouquetSettings, }) => {
    const showImportModal = useSignal(false);
    const [error, setError] = useState(undefined);
    const clearPayload = () => {
        batch(() => {
            bundle.value = undefined;
            localStorage.removeItem('payload');
            signers.value.bundleSigners = {};
            setError('');
            // Keep burner wallet as long as it has funds, should clear is later if there is left over dust but not needed.
            // if (fundingAccountBalance.value === 0n) signers.value.burner = undefined
        });
    };
    return (_jsxs(_Fragment, { children: [showImportModal.value ? _jsx(ImportModal, { bundle: bundle, clearError: () => setError(''), display: showImportModal }) : null, _jsxs("h2", { className: 'font-bold text-2xl', children: [_jsx("span", { class: 'text-gray-500', children: "1." }), " Import"] }), _jsxs("div", { className: 'flex flex-col w-full gap-6', children: [_jsxs("div", { className: 'flex flex-col sm:flex-row gap-4', children: [_jsx(Button, { onClick: () => importFromInterceptor(bundle, provider, blockInfo, signers, bouquetSettings).then(() => setError(undefined)).catch((err) => setError(err.message)), children: "Import Payload from The Interceptor" }), _jsx(Button, { onClick: () => showImportModal.value = true, children: "Import From JSON" }), bundle.value ? (_jsx(Button, { variant: 'secondary', onClick: clearPayload, children: "Reset" })) : null] }), error ? _jsx(SingleNotice, { variant: 'error', title: 'Could Not Import Transactions', description: error }) : null, error && error === 'Wallet does not support returning simulations' ? (_jsxs("h3", { className: 'text-xl', children: ["Don't have The Interceptor Installed? Install it here", ' ', _jsx("a", { className: 'font-bold text-accent underline', href: 'https://dark.florist', children: "here" }), "."] })) : (''), _jsx(CreateClearDelegation, { bundle: bundle, provider: provider, signers: signers, blockInfo: blockInfo })] })] }));
};
//# sourceMappingURL=Import.js.map