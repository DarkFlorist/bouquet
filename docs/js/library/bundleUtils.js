import { getAddress } from 'ethers';
import { serialize } from '../types/types.js';
import { EthereumData } from '../types/ethereumTypes.js';
import { addressString } from './utils.js';
export const getMaxBaseFeeInFutureBlock = (baseFee, blocksInFuture) => {
    if (blocksInFuture <= 0n)
        throw new Error('blocksInFuture needs to be positive');
    return [...Array(blocksInFuture)].reduce((accumulator, _currentValue) => (accumulator * 1125n) / 1000n, baseFee) + 1n;
};
async function getSimulatedCountsOnNetwork(provider) {
    try {
        const { payload } = await provider.send('interceptor_getSimulationStack', ['1.0.0']);
        const result = payload.reduce((acc, curr) => {
            curr.from = getAddress(curr.from);
            if (curr.from in acc)
                acc[curr.from] += 1;
            else
                acc[curr.from] = 1;
            return acc;
        }, {});
        return result;
    }
    catch (error) {
        console.error('getSimulatedCountsOnNetwork error: ', error);
        return {};
    }
}
export const getRawTransactionsAndCalculateFeesAndNonces = async (bundle, provider, blockInfo, maxBaseFee) => {
    const transactions = [];
    const inSimulation = await getSimulatedCountsOnNetwork(provider);
    const accNonces = {};
    for (const tx of bundle) {
        tx.transaction.maxPriorityFeePerGas = blockInfo.priorityFee;
        tx.transaction.maxFeePerGas = blockInfo.priorityFee + maxBaseFee;
        if (!tx.transaction.from)
            throw new Error('BundleTransaction missing from address');
        if (!tx.transaction.chainId)
            throw new Error('BundleTransaction missing chainId');
        // Fetch and increment nonces from network, reduce the fetch amount by amount of transactions made on the simulation stack
        if (tx.transaction.from.toString() in accNonces) {
            accNonces[tx.transaction.from.toString()] += 1;
        }
        else {
            accNonces[tx.transaction.from.toString()] = await provider.getTransactionCount(tx.transaction.from, 'latest');
            if (tx.transaction.from.toString() in inSimulation)
                accNonces[tx.transaction.from.toString()] -= inSimulation[tx.transaction.from.toString()];
        }
        tx.transaction.nonce = accNonces[tx.transaction.from.toString()];
        const rawTransaction = await tx.signer.signTransaction({ ...tx.transaction });
        transactions.push({ rawTransaction, transaction: tx.transaction });
    }
    return transactions;
};
export const createBundleTransactions = (bundle, signers, blockInfo, blocksInFuture, fundingAmountMin) => {
    return bundle.transactions.map(({ from, to, gasLimit, value, input, chainId }) => {
        const gasOpts = {
            maxPriorityFeePerGas: blockInfo.priorityFee,
            type: 2,
            maxFeePerGas: blockInfo.priorityFee + getMaxBaseFeeInFutureBlock(blockInfo.baseFee, blocksInFuture),
        };
        if (from === 'FUNDING') {
            if (!signers.burner)
                throw new Error('No burner wallet provided');
            return {
                signer: signers.burner,
                transaction: {
                    from: signers.burner.address,
                    ...(bundle && bundle.transactions[0].to
                        ? {
                            to: addressString(bundle.transactions[0].to),
                        }
                        : {}),
                    value: fundingAmountMin - 21000n * (getMaxBaseFeeInFutureBlock(blockInfo.baseFee, blocksInFuture) + blockInfo.priorityFee),
                    data: '0x',
                    gasLimit: 21000n,
                    chainId: Number(chainId),
                    ...gasOpts,
                },
            };
        }
        else
            return {
                signer: signers.bundleSigners[addressString(from)],
                transaction: {
                    from: addressString(from),
                    ...(to ? { to: addressString(to) } : {}),
                    gasLimit,
                    data: serialize(EthereumData, input),
                    value,
                    chainId: Number(chainId),
                    ...gasOpts,
                },
            };
    });
};
//# sourceMappingURL=bundleUtils.js.map