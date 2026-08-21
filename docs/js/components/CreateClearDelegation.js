import { jsx as _jsx, jsxs as _jsxs } from "preact/jsx-runtime";
import { useComputed, useSignal, useSignalEffect } from '@preact/signals';
import { createClearDelegationTransaction, createRescueBundle, ensureDelegationClearFunding, getActiveEip7702DelegationTarget } from '../library/rescue.js';
import { addressString } from '../library/utils.js';
import { TransactionList } from '../types/bouquetTypes.js';
import { Button } from './Button.js';
import { SingleNotice } from './Warns.js';
const getSingleChainId = (bundle) => {
    const chainIds = [...new Set(bundle.transactions.map((transaction) => transaction.chainId))];
    if (chainIds.length !== 1 || chainIds[0] === undefined)
        throw new Error('All rescue transactions must use one chain before adding the delegation-clearing transaction.');
    return chainIds[0];
};
const getSuggestedAuthority = (bundle) => {
    const fundingRecipient = bundle.transactions.find((transaction) => transaction.from === 'FUNDING')?.to;
    if (fundingRecipient !== undefined && fundingRecipient !== null)
        return addressString(fundingRecipient);
    const sweepSender = bundle.transactions.find((transaction) => transaction.from !== 'FUNDING')?.from;
    return sweepSender === undefined || sweepSender === 'FUNDING' ? '' : addressString(sweepSender);
};
const DelegationCheckNotice = ({ delegationCheck }) => {
    switch (delegationCheck?.state) {
        case 'delegated': return _jsx(SingleNotice, { variant: 'warn', title: 'Active EIP-7702 Delegation Detected', description: _jsxs("span", { children: [_jsx("span", { className: 'font-mono', children: delegationCheck.authority }), " currently delegates to ", _jsx("span", { className: 'font-mono', children: delegationCheck.target }), ". Clear it before funding or sweeping assets."] }) });
        case 'checking': return _jsx(SingleNotice, { variant: 'warn', title: 'Checking EIP-7702 Delegation', description: `Checking ${delegationCheck.authority} at block ${delegationCheck.blockNumber.toString()} before enabling the rescue tool.` });
        case 'not-delegated': return _jsx(SingleNotice, { variant: 'warn', title: 'No Active EIP-7702 Delegation Found', description: `${delegationCheck.authority} does not currently have an EIP-7702 delegation. A delegation-clearing transaction is not needed.` });
        case 'needs-provider': return _jsx(SingleNotice, { variant: 'warn', title: 'Connect To Check Delegation', description: `Connect Interceptor on the bundle's chain so Bouquet can check ${delegationCheck.authority}.` });
        case 'error': return _jsx(SingleNotice, { variant: 'error', title: 'Could Not Check EIP-7702 Delegation', description: delegationCheck.message });
        case undefined: return null;
    }
};
export const CreateClearDelegation = ({ bundle, provider, signers, blockInfo }) => {
    const isOpen = useSignal(false);
    const authority = useSignal('');
    const error = useSignal(undefined);
    const activeBundle = useComputed(() => bundle.value);
    const delegationCheck = useSignal(undefined);
    useSignalEffect(() => {
        const currentBundle = activeBundle.value;
        const activeProvider = provider.value;
        const blockNumber = blockInfo.value.blockNumber;
        if (currentBundle === undefined || currentBundle.rescueMode) {
            delegationCheck.value = undefined;
            return;
        }
        const suggestedAuthority = getSuggestedAuthority(currentBundle);
        if (suggestedAuthority === '') {
            delegationCheck.value = { state: 'error', authority: suggestedAuthority, message: 'Bouquet could not determine the compromised account from this bundle.' };
            return;
        }
        if (activeProvider === undefined) {
            delegationCheck.value = { state: 'needs-provider', authority: suggestedAuthority };
            return;
        }
        let bundleChainId;
        try {
            bundleChainId = getSingleChainId(currentBundle);
        }
        catch (caught) {
            delegationCheck.value = { state: 'error', authority: suggestedAuthority, message: caught instanceof Error ? caught.message : 'Could not determine the rescue chain.' };
            return;
        }
        if (activeProvider.chainId !== bundleChainId) {
            delegationCheck.value = { state: 'error', authority: suggestedAuthority, message: `Switch the connected wallet to chain ID ${bundleChainId.toString()} to check this account.` };
            return;
        }
        let cancelled = false;
        delegationCheck.value = { state: 'checking', authority: suggestedAuthority, blockNumber };
        void getActiveEip7702DelegationTarget(activeProvider.provider, suggestedAuthority)
            .then((target) => {
            if (cancelled)
                return;
            delegationCheck.value = target === undefined
                ? { state: 'not-delegated', authority: suggestedAuthority }
                : { state: 'delegated', authority: suggestedAuthority, target };
        })
            .catch((caught) => {
            if (cancelled)
                return;
            delegationCheck.value = { state: 'error', authority: suggestedAuthority, message: caught instanceof Error ? caught.message : 'Could not check the account delegation.' };
        });
        return () => {
            cancelled = true;
        };
    });
    const open = () => {
        const currentBundle = bundle.peek();
        const currentDelegation = delegationCheck.peek();
        if (currentBundle === undefined || currentDelegation?.state !== 'delegated')
            return;
        authority.value = currentDelegation.authority;
        error.value = undefined;
        isOpen.value = true;
    };
    const addTransaction = () => {
        const currentBundle = bundle.peek();
        const currentDelegation = delegationCheck.peek();
        if (currentBundle === undefined)
            return;
        try {
            if (currentDelegation?.state !== 'delegated' || currentDelegation.authority !== authority.peek())
                throw new Error('Confirm an active delegation before adding the clearing transaction.');
            if (currentBundle.rescueMode)
                throw new Error('This bundle already contains a delegation-clearing transaction.');
            const fundingWallet = signers.peek().burner;
            if (fundingWallet === undefined)
                throw new Error('Bouquet could not create its temporary funding wallet.');
            if (fundingWallet.address === authority.peek())
                throw new Error('The temporary funding wallet must be different from the compromised account.');
            const chainId = getSingleChainId(currentBundle);
            const transaction = createClearDelegationTransaction({
                authority: authority.peek(),
                chainId,
            });
            const nextBundle = createRescueBundle(ensureDelegationClearFunding([...currentBundle.transactions, transaction]));
            localStorage.setItem('payload', JSON.stringify(TransactionList.serialize(nextBundle.transactions)));
            bundle.value = nextBundle;
            signers.value = { ...signers.peek(), bundleSigners: {} };
            error.value = undefined;
            isOpen.value = false;
        }
        catch (caught) {
            error.value = caught instanceof Error ? caught.message : 'Could not create the delegation-clearing transaction.';
        }
    };
    if (activeBundle.value === undefined || activeBundle.value.rescueMode)
        return null;
    const currentDelegation = delegationCheck.value;
    return (_jsxs("div", { className: 'flex flex-col gap-4', children: [_jsx(DelegationCheckNotice, { delegationCheck: currentDelegation }), _jsx(Button, { onClick: open, disabled: currentDelegation?.state !== 'delegated', variant: 'secondary', children: "Add EIP-7702 Delegation Clear" }), isOpen.value ? _jsxs("div", { className: 'border border-orange-400/50 bg-orange-400/10 p-4 flex flex-col gap-4', children: [_jsx("h3", { className: 'text-xl font-semibold', children: "Create Delegation-Clearing Transaction" }), _jsx("p", { className: 'text-sm text-white/75', children: "The delegation clear will run before funding and sweep transactions." }), _jsxs("label", { className: 'flex flex-col gap-1', children: [_jsx("span", { className: 'text-sm text-gray-400', children: "Compromised account" }), _jsx("input", { "aria-label": 'Compromised account', value: authority.value, readOnly: true, className: 'h-12 border border-white/50 bg-transparent px-4 outline-none text-white/75', placeholder: '0x\u2026' })] }), error.value === undefined ? null : _jsx(SingleNotice, { variant: 'error', title: 'Could Not Add Delegation Clear', description: error.value }), _jsxs("div", { className: 'flex gap-2', children: [_jsx(Button, { onClick: addTransaction, children: "Add Delegation Clear" }), _jsx(Button, { onClick: () => isOpen.value = false, variant: 'secondary', children: "Cancel" })] })] }) : null] }));
};
//# sourceMappingURL=CreateClearDelegation.js.map