import { getAddress } from 'ethers';
import { createBundle, isClearDelegationTransaction } from './bundle.js';
const EIP_7702_DELEGATION_PREFIX = '0xef0100';
export const parseEip7702DelegationTarget = (code) => {
    if (!/^0xef0100[0-9a-f]{40}$/i.test(code))
        return undefined;
    return getAddress(`0x${code.slice(EIP_7702_DELEGATION_PREFIX.length)}`);
};
export const getActiveEip7702DelegationTarget = async (provider, authority) => {
    const code = await provider.getCode(getAddress(authority), 'latest');
    return parseEip7702DelegationTarget(code);
};
export const createClearDelegationTransaction = ({ authority, chainId }) => {
    const authorityAddress = getAddress(authority);
    if (chainId <= 0n)
        throw new Error('The rescue transaction needs a valid chain ID.');
    return {
        from: 'FUNDING',
        to: null,
        value: 0n,
        input: new Uint8Array(),
        chainId,
        gasLimit: 100000n,
        type: '7702',
        accessList: [],
        authorizationList: [{
                chainId,
                address: 0n,
                // This placeholder is refreshed from the connected provider immediately before every simulation and submission.
                nonce: 0n,
                authority: BigInt(authorityAddress),
            }],
    };
};
const addRescueFundingTransaction = (transactions, authority, chainId) => {
    if (transactions.some((transaction) => transaction.from === 'FUNDING' && !isClearDelegationTransaction(transaction)))
        return transactions;
    return [...transactions, {
            from: 'FUNDING',
            to: authority,
            value: 0n,
            input: new Uint8Array(),
            chainId,
            gasLimit: 21000n,
        }];
};
export const ensureDelegationClearFunding = (transactions) => {
    const clearTransaction = transactions.find(isClearDelegationTransaction);
    const authority = clearTransaction?.authorizationList?.find((authorization) => authorization.address === 0n)?.authority;
    if (clearTransaction === undefined || authority === undefined)
        return transactions;
    return addRescueFundingTransaction(transactions, authority, clearTransaction.chainId);
};
export const orderRescueTransactions = (transactions) => [
    ...transactions.filter(isClearDelegationTransaction),
    ...transactions.filter((transaction) => transaction.from === 'FUNDING' && !isClearDelegationTransaction(transaction)),
    ...transactions.filter((transaction) => transaction.from !== 'FUNDING' && !isClearDelegationTransaction(transaction)),
];
export const createRescueBundle = (transactions) => createBundle(orderRescueTransactions(transactions));
//# sourceMappingURL=rescue.js.map