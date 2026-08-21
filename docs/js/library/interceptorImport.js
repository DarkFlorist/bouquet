import { parseEther } from 'ethers';
export async function requestInterceptorStackAfterConnection(connectProvider, requestStack) {
    await connectProvider();
    return requestStack();
}
export function simulationStackRequestError(error) {
    if (typeof error !== 'object' || error === null)
        return new Error('Interceptor could not return the simulation stack. Please try again.');
    const code = 'code' in error && typeof error.code === 'number' ? error.code : undefined;
    const message = 'message' in error && typeof error.message === 'string' ? error.message.trim() : '';
    if (code === -32601)
        return new Error('Wallet does not support returning simulations');
    if (code === 4001)
        return new Error('Simulation stack export was rejected in Interceptor.');
    if (code === 123456)
        return new Error('Interceptor encountered an internal error while exporting the simulation stack. Close any pending Interceptor request and try again.');
    if (message !== '')
        return new Error(`Interceptor could not return the simulation stack: ${message}`);
    if (code !== undefined)
        return new Error(`Interceptor could not return the simulation stack (error ${code}). Please try again.`);
    return new Error('Interceptor could not return the simulation stack. Please try again.');
}
export function convertInterceptorTransactions(transactions) {
    return transactions.map((transaction) => {
        if (transaction.chainId === undefined)
            throw new Error('Transaction is missing its chain ID');
        const base = {
            from: transaction.from,
            to: transaction.to,
            value: transaction.value,
            input: transaction.input,
            gasLimit: transaction.gasLimit,
            chainId: transaction.chainId,
        };
        if (transaction.type === '7702')
            return { ...base, type: transaction.type, accessList: transaction.accessList, authorizationList: transaction.authorizationList };
        return { ...base, ...('accessList' in transaction ? { accessList: transaction.accessList } : {}) };
    });
}
export function markSyntheticFunding(transactions) {
    if (transactions.length < 2 || transactions[0].value !== parseEther('200000') || transactions[0].to === null)
        return transactions;
    const recipient = transactions[0].to;
    const recipientUsesFunds = transactions.slice(1).some((transaction) => transaction.from === recipient || transaction.authorizationList?.some((authorization) => authorization.authority === recipient));
    if (!recipientUsesFunds)
        return transactions;
    const fundingAddress = transactions[0].from;
    return transactions.map((transaction) => transaction.from === fundingAddress ? { ...transaction, from: 'FUNDING' } : transaction);
}
//# sourceMappingURL=interceptorImport.js.map