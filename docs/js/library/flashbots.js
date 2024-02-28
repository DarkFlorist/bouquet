import { id, keccak256, Transaction } from 'ethers';
import { createBundleTransactions, getMaxBaseFeeInFutureBlock, signBundle } from './bundleUtils.js';
export async function simulateBundle(bundle, fundingAmountMin, provider, signers, blockInfo, appSettings) {
    if (appSettings.blocksInFuture <= 0n)
        throw new Error('Blocks in future is negative or zero');
    const maxBaseFee = getMaxBaseFeeInFutureBlock(blockInfo.baseFee, appSettings.blocksInFuture);
    const txs = await signBundle(await createBundleTransactions(bundle, signers, blockInfo, appSettings.blocksInFuture, fundingAmountMin), provider.provider, blockInfo, maxBaseFee);
    const payload = JSON.stringify({ jsonrpc: '2.0', method: 'eth_callBundle', params: [{ txs, blockNumber: `0x${blockInfo.blockNumber.toString(16)}`, stateBlockNumber: 'latest' }] });
    const flashbotsSig = `${await provider.authSigner.getAddress()}:${await provider.authSigner.signMessage(id(payload))}`;
    const request = await fetch(appSettings.simulationRelayEndpoint, { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json', 'X-Flashbots-Signature': flashbotsSig } });
    const response = await request.json();
    if (response.error !== undefined && response.error !== null) {
        return {
            error: {
                message: response.error.message,
                code: response.error.code,
            },
        };
    }
    const callResult = response.result;
    return {
        bundleGasPrice: BigInt(callResult.bundleGasPrice),
        bundleHash: callResult.bundleHash,
        coinbaseDiff: BigInt(callResult.coinbaseDiff),
        ethSentToCoinbase: BigInt(callResult.ethSentToCoinbase),
        gasFees: BigInt(callResult.gasFees),
        results: callResult.results,
        stateBlockNumber: callResult.stateBlockNumber,
        totalGasUsed: callResult.results.reduce((a, b) => a + b.gasUsed, 0),
        firstRevert: callResult.results.find((txSim) => 'revert' in txSim || 'error' in txSim),
    };
}
let bundleId = 1;
export async function sendBundle(bundle, targetBlock, fundingAmountMin, provider, signers, blockInfo, appSettings) {
    if (appSettings.blocksInFuture <= 0n)
        throw new Error('Blocks in future is negative or zero');
    const maxBaseFee = getMaxBaseFeeInFutureBlock(blockInfo.baseFee, appSettings.blocksInFuture);
    const txs = await signBundle(await createBundleTransactions(bundle, signers, blockInfo, appSettings.blocksInFuture, fundingAmountMin), provider.provider, blockInfo, maxBaseFee);
    const payload = JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_sendBundle',
        id: bundleId++,
        params: [{ txs, blockNumber: `0x${targetBlock.toString(16)}`, revertingTxHashes: [] }]
    });
    const flashbotsSig = `${await provider.authSigner.getAddress()}:${await provider.authSigner.signMessage(id(payload))}`;
    const request = await fetch(appSettings.submissionRelayEndpoint, { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json', 'X-Flashbots-Signature': flashbotsSig } });
    const response = await request.json();
    if (response.error !== undefined && response.error !== null) {
        throw {
            message: response.error.message,
            code: response.error.code,
        };
    }
    const bundleTransactions = txs.map((signedTransaction) => {
        const transactionDetails = Transaction.from(signedTransaction);
        return {
            signedTransaction,
            hash: keccak256(signedTransaction),
            account: transactionDetails.from || '0x0',
            nonce: BigInt(transactionDetails.nonce),
        };
    });
    return {
        bundleTransactions,
        bundleHash: response.result.bundleHash,
    };
}
export async function checkBundleInclusion(transactions, provider) {
    const receipts = await Promise.all(transactions.map((tx) => provider.provider.getTransactionReceipt(tx.hash)));
    return { transactions, included: receipts.filter(x => x === null).length === 0 };
}
//# sourceMappingURL=flashbots.js.map