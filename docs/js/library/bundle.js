import { addressString } from './utils.js';
const hasCompleteSignature = (authorization) => authorization.r !== undefined && authorization.s !== undefined && authorization.yParity !== undefined;
export const isClearDelegationTransaction = (transaction) => transaction.type === '7702' && (transaction.authorizationList ?? []).some((authorization) => authorization.address === 0n);
export const createBundle = (transactions) => {
    const signerAddresses = new Set();
    for (const transaction of transactions) {
        if (transaction.from !== 'FUNDING')
            signerAddresses.add(addressString(transaction.from));
        if (transaction.type !== '7702')
            continue;
        for (const authorization of transaction.authorizationList ?? []) {
            if (!hasCompleteSignature(authorization) && authorization.authority !== undefined) {
                signerAddresses.add(addressString(authorization.authority));
            }
        }
    }
    return {
        transactions,
        containsFundingTx: transactions.some((transaction) => transaction.from === 'FUNDING'),
        rescueMode: transactions.some(isClearDelegationTransaction),
        totalGas: transactions.reduce((sum, transaction) => sum + transaction.gasLimit, 0n),
        inputValue: transactions.reduce((sum, transaction) => transaction.from === 'FUNDING' ? sum + transaction.value : sum, 0n),
        uniqueSigners: [...signerAddresses],
    };
};
//# sourceMappingURL=bundle.js.map