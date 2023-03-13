import { BigNumber, providers, utils } from 'ethers';
import { MEV_RELAY_GOERLI, MEV_RELAY_MAINNET } from '../constants.js';
export const BASE_FEE_MAX_CHANGE_DENOMINATOR = 8;
export var FlashbotsBundleResolution;
(function (FlashbotsBundleResolution) {
    FlashbotsBundleResolution[FlashbotsBundleResolution["BundleIncluded"] = 0] = "BundleIncluded";
    FlashbotsBundleResolution[FlashbotsBundleResolution["BlockPassedWithoutInclusion"] = 1] = "BlockPassedWithoutInclusion";
    FlashbotsBundleResolution[FlashbotsBundleResolution["AccountNonceTooHigh"] = 2] = "AccountNonceTooHigh";
})(FlashbotsBundleResolution || (FlashbotsBundleResolution = {}));
export var FlashbotsTransactionResolution;
(function (FlashbotsTransactionResolution) {
    FlashbotsTransactionResolution[FlashbotsTransactionResolution["TransactionIncluded"] = 0] = "TransactionIncluded";
    FlashbotsTransactionResolution[FlashbotsTransactionResolution["TransactionDropped"] = 1] = "TransactionDropped";
})(FlashbotsTransactionResolution || (FlashbotsTransactionResolution = {}));
export var FlashbotsBundleConflictType;
(function (FlashbotsBundleConflictType) {
    FlashbotsBundleConflictType[FlashbotsBundleConflictType["NoConflict"] = 0] = "NoConflict";
    FlashbotsBundleConflictType[FlashbotsBundleConflictType["NonceCollision"] = 1] = "NonceCollision";
    FlashbotsBundleConflictType[FlashbotsBundleConflictType["Error"] = 2] = "Error";
    FlashbotsBundleConflictType[FlashbotsBundleConflictType["CoinbasePayment"] = 3] = "CoinbasePayment";
    FlashbotsBundleConflictType[FlashbotsBundleConflictType["GasUsed"] = 4] = "GasUsed";
    FlashbotsBundleConflictType[FlashbotsBundleConflictType["NoBundlesInBlock"] = 5] = "NoBundlesInBlock";
})(FlashbotsBundleConflictType || (FlashbotsBundleConflictType = {}));
const TIMEOUT_MS = 5 * 60 * 1000;
export class FlashbotsBundleProvider extends providers.JsonRpcProvider {
    // private connectionInfo: utils.ConnectionInfo
    constructor(genericProvider, authSigner, connectionInfoOrUrl, network) {
        super(connectionInfoOrUrl, network);
        this.genericProvider = genericProvider;
        this.authSigner = authSigner;
        // this.connectionInfo = connectionInfoOrUrl
    }
    static async throttleCallback() {
        console.warn('Rate limited');
        return false;
    }
    static async create(genericProvider, authSigner, connectionInfoOrUrl, network) {
        const connectionInfo = typeof connectionInfoOrUrl === 'string' || typeof connectionInfoOrUrl === 'undefined'
            ? {
                url: connectionInfoOrUrl || MEV_RELAY_MAINNET,
            }
            : {
                ...connectionInfoOrUrl,
            };
        if (connectionInfo.headers === undefined)
            connectionInfo.headers = {};
        connectionInfo.throttleCallback = FlashbotsBundleProvider.throttleCallback;
        const networkish = {
            chainId: 0,
            name: '',
        };
        if (typeof network === 'string') {
            networkish.name = network;
        }
        else if (typeof network === 'number') {
            networkish.chainId = network;
        }
        else if (typeof network === 'object') {
            networkish.name = network.name;
            networkish.chainId = network.chainId;
        }
        if (networkish.chainId === 0) {
            networkish.chainId = (await genericProvider.getNetwork()).chainId;
        }
        return new FlashbotsBundleProvider(genericProvider, authSigner, connectionInfo, networkish);
    }
    static getMaxBaseFeeInFutureBlock(baseFee, blocksInFuture) {
        let maxBaseFee = BigNumber.from(baseFee);
        for (let i = 0; i < blocksInFuture; i++) {
            maxBaseFee = maxBaseFee.mul(1125).div(1000).add(1);
        }
        return maxBaseFee;
    }
    static getBaseFeeInNextBlock(currentBaseFeePerGas, currentGasUsed, currentGasLimit) {
        const currentGasTarget = currentGasLimit.div(2);
        if (currentGasUsed.eq(currentGasTarget)) {
            return currentBaseFeePerGas;
        }
        else if (currentGasUsed.gt(currentGasTarget)) {
            const gasUsedDelta = currentGasUsed.sub(currentGasTarget);
            const baseFeePerGasDelta = currentBaseFeePerGas.mul(gasUsedDelta).div(currentGasTarget).div(BASE_FEE_MAX_CHANGE_DENOMINATOR);
            return currentBaseFeePerGas.add(baseFeePerGasDelta);
        }
        else {
            const gasUsedDelta = currentGasTarget.sub(currentGasUsed);
            const baseFeePerGasDelta = currentBaseFeePerGas.mul(gasUsedDelta).div(currentGasTarget).div(BASE_FEE_MAX_CHANGE_DENOMINATOR);
            return currentBaseFeePerGas.sub(baseFeePerGasDelta);
        }
    }
    static generateBundleHash(txHashes) {
        const concatenatedHashes = txHashes.map((txHash) => txHash.slice(2)).join('');
        return utils.keccak256(`0x${concatenatedHashes}`);
    }
    async sendRawBundle(signedBundledTransactions, targetBlockNumber, opts) {
        const params = {
            txs: signedBundledTransactions,
            blockNumber: `0x${targetBlockNumber.toString(16)}`,
            minTimestamp: opts?.minTimestamp,
            maxTimestamp: opts?.maxTimestamp,
            revertingTxHashes: opts?.revertingTxHashes,
            replacementUuid: opts?.replacementUuid,
        };
        const request = JSON.stringify(this.prepareRelayRequest('eth_sendBundle', [params]));
        const response = await this.request(request);
        if (response.error !== undefined && response.error !== null) {
            return {
                error: {
                    message: response.error.message,
                    code: response.error.code,
                },
            };
        }
        const bundleTransactions = signedBundledTransactions.map((signedTransaction) => {
            const transactionDetails = utils.parseTransaction(signedTransaction);
            return {
                signedTransaction,
                hash: utils.keccak256(signedTransaction),
                account: transactionDetails.from || '0x0',
                nonce: transactionDetails.nonce,
            };
        });
        return {
            bundleTransactions,
            wait: () => this.waitForBlock(bundleTransactions, targetBlockNumber, TIMEOUT_MS),
            simulate: () => this.simulate(bundleTransactions.map((tx) => tx.signedTransaction), targetBlockNumber, undefined, opts?.minTimestamp),
            receipts: () => this.fetchReceipts(bundleTransactions),
            bundleHash: response.result.bundleHash,
        };
    }
    async sendBundle(bundledTransactions, targetBlockNumber, opts) {
        const signedTransactions = await this.signBundle(bundledTransactions);
        return this.sendRawBundle(signedTransactions, targetBlockNumber, opts);
    }
    async cancelBundles(bidId) {
        const params = {
            replacementUuid: bidId,
        };
        const request = JSON.stringify(this.prepareRelayRequest('eth_cancelBundle', [params]));
        const response = await this.request(request);
        if (response.error !== undefined && response.error !== null) {
            return {
                error: {
                    message: response.error.message,
                    code: response.error.code,
                },
            };
        }
        return {
            bundleHashes: response.result,
        };
    }
    async sendPrivateTransaction(transaction, opts) {
        let signedTransaction;
        if ('signedTransaction' in transaction) {
            signedTransaction = transaction.signedTransaction;
        }
        else {
            signedTransaction = await transaction.signer.signTransaction(transaction.transaction);
        }
        const startBlockNumberPromise = this.genericProvider.getBlockNumber();
        const params = {
            tx: signedTransaction,
            maxBlockNumber: opts?.maxBlockNumber,
        };
        const request = JSON.stringify(this.prepareRelayRequest('eth_sendPrivateTransaction', [params]));
        const response = await this.request(request);
        if (response.error !== undefined && response.error !== null) {
            return {
                error: {
                    message: response.error.message,
                    code: response.error.code,
                },
            };
        }
        const transactionDetails = utils.parseTransaction(signedTransaction);
        const privateTransaction = {
            signedTransaction: signedTransaction,
            hash: utils.keccak256(signedTransaction),
            account: transactionDetails.from || '0x0',
            nonce: transactionDetails.nonce,
        };
        const startBlockNumber = await startBlockNumberPromise;
        return {
            transaction: privateTransaction,
            wait: () => this.waitForTxInclusion(privateTransaction.hash, opts?.maxBlockNumber || startBlockNumber + 25, TIMEOUT_MS),
            simulate: () => this.simulate([privateTransaction.signedTransaction], startBlockNumber, undefined, opts?.simulationTimestamp),
            receipts: () => this.fetchReceipts([privateTransaction]),
        };
    }
    async cancelPrivateTransaction(txHash) {
        const params = {
            txHash,
        };
        const request = JSON.stringify(this.prepareRelayRequest('eth_cancelPrivateTransaction', [params]));
        const response = await this.request(request);
        if (response.error !== undefined && response.error !== null) {
            return {
                error: {
                    message: response.error.message,
                    code: response.error.code,
                },
            };
        }
        return true;
    }
    async signBundle(bundledTransactions) {
        const nonces = {};
        const signedTransactions = new Array();
        for (const tx of bundledTransactions) {
            if ('signedTransaction' in tx) {
                // in case someone is mixing pre-signed and signing transactions, decode to add to nonce object
                const transactionDetails = utils.parseTransaction(tx.signedTransaction);
                if (transactionDetails.from === undefined)
                    throw new Error('Could not decode signed transaction');
                nonces[transactionDetails.from] = BigNumber.from(transactionDetails.nonce + 1);
                signedTransactions.push(tx.signedTransaction);
                continue;
            }
            const transaction = { ...tx.transaction };
            const address = await tx.signer.getAddress();
            if (typeof transaction.nonce === 'string')
                throw new Error('Bad nonce');
            const nonce = transaction.nonce !== undefined
                ? BigNumber.from(transaction.nonce)
                : nonces[address] || BigNumber.from(await this.genericProvider.getTransactionCount(address, 'latest'));
            nonces[address] = nonce.add(1);
            if (transaction.nonce === undefined)
                transaction.nonce = nonce;
            if ((transaction.type == null || transaction.type == 0) && transaction.gasPrice === undefined)
                transaction.gasPrice = BigNumber.from(0);
            if (transaction.gasLimit === undefined)
                transaction.gasLimit = await tx.signer.estimateGas(transaction); // TODO: Add target block number and timestamp when supported by geth
            signedTransactions.push(await tx.signer.signTransaction(transaction));
        }
        return signedTransactions;
    }
    waitForBlock(transactionAccountNonces, targetBlockNumber, timeout) {
        return new Promise((resolve, reject) => {
            let timer = null;
            let done = false;
            const minimumNonceByAccount = transactionAccountNonces.reduce((acc, accountNonce) => {
                if (accountNonce.nonce > 0) {
                    if (!acc[accountNonce.account] || accountNonce.nonce < acc[accountNonce.account]) {
                        acc[accountNonce.account] = accountNonce.nonce;
                    }
                }
                return acc;
            }, {});
            const handler = async (blockNumber) => {
                if (blockNumber < targetBlockNumber) {
                    const noncesValid = await Promise.all(Object.entries(minimumNonceByAccount).map(async ([account, nonce]) => {
                        const transactionCount = await this.genericProvider.getTransactionCount(account);
                        return nonce >= transactionCount;
                    }));
                    const allNoncesValid = noncesValid.every(Boolean);
                    if (allNoncesValid)
                        return;
                    // target block not yet reached, but nonce has become invalid
                    resolve(FlashbotsBundleResolution.AccountNonceTooHigh);
                }
                else {
                    const block = await this.genericProvider.getBlock(targetBlockNumber);
                    // check bundle against block:
                    const blockTransactionsHash = {};
                    for (const bt of block.transactions) {
                        blockTransactionsHash[bt] = true;
                    }
                    const bundleIncluded = transactionAccountNonces.every((transaction) => blockTransactionsHash[transaction.hash]);
                    resolve(bundleIncluded ? FlashbotsBundleResolution.BundleIncluded : FlashbotsBundleResolution.BlockPassedWithoutInclusion);
                }
                if (timer) {
                    clearTimeout(timer);
                }
                if (done) {
                    return;
                }
                done = true;
                this.genericProvider.removeListener('block', handler);
            };
            this.genericProvider.on('block', handler);
            if (timeout > 0) {
                timer = setTimeout(() => {
                    if (done) {
                        return;
                    }
                    timer = null;
                    done = true;
                    this.genericProvider.removeListener('block', handler);
                    reject('Timed out');
                }, timeout);
            }
        });
    }
    waitForTxInclusion(transactionHash, maxBlockNumber, timeout) {
        return new Promise((resolve, reject) => {
            let timer = null;
            let done = false;
            // runs on new block event
            const handler = async (blockNumber) => {
                if (blockNumber <= maxBlockNumber) {
                    // check tx status on mainnet
                    const sentTxStatus = await this.genericProvider.getTransaction(transactionHash);
                    if (sentTxStatus && sentTxStatus.confirmations >= 1) {
                        resolve(FlashbotsTransactionResolution.TransactionIncluded);
                    }
                    else {
                        return;
                    }
                }
                else {
                    // tx not included in specified range, bail
                    this.genericProvider.removeListener('block', handler);
                    resolve(FlashbotsTransactionResolution.TransactionDropped);
                }
                if (timer) {
                    clearTimeout(timer);
                }
                if (done) {
                    return;
                }
                done = true;
                this.genericProvider.removeListener('block', handler);
            };
            this.genericProvider.on('block', handler);
            // time out if we've been trying for too long
            if (timeout > 0) {
                timer = setTimeout(() => {
                    if (done) {
                        return;
                    }
                    timer = null;
                    done = true;
                    this.genericProvider.removeListener('block', handler);
                    reject('Timed out');
                }, timeout);
            }
        });
    }
    async getUserStats() {
        const blockDetails = await this.genericProvider.getBlock('latest');
        const evmBlockNumber = `0x${blockDetails.number.toString(16)}`;
        const params = [evmBlockNumber];
        const request = JSON.stringify(this.prepareRelayRequest('flashbots_getUserStats', params));
        const response = await this.request(request);
        if (response.error !== undefined && response.error !== null) {
            return {
                error: {
                    message: response.error.message,
                    code: response.error.code,
                },
            };
        }
        return response.result;
    }
    async getUserStatsV2() {
        const blockDetails = await this.genericProvider.getBlock('latest');
        const evmBlockNumber = `0x${blockDetails.number.toString(16)}`;
        const params = [{ blockNumber: evmBlockNumber }];
        const request = JSON.stringify(this.prepareRelayRequest('flashbots_getUserStatsV2', params));
        const response = await this.request(request);
        if (response.error !== undefined && response.error !== null) {
            return {
                error: {
                    message: response.error.message,
                    code: response.error.code,
                },
            };
        }
        return response.result;
    }
    async getBundleStats(bundleHash, blockNumber) {
        const evmBlockNumber = `0x${blockNumber.toString(16)}`;
        const params = [{ bundleHash, blockNumber: evmBlockNumber }];
        const request = JSON.stringify(this.prepareRelayRequest('flashbots_getBundleStats', params));
        const response = await this.request(request);
        if (response.error !== undefined && response.error !== null) {
            return {
                error: {
                    message: response.error.message,
                    code: response.error.code,
                },
            };
        }
        return response.result;
    }
    async getBundleStatsV2(bundleHash, blockNumber) {
        const evmBlockNumber = `0x${blockNumber.toString(16)}`;
        const params = [{ bundleHash, blockNumber: evmBlockNumber }];
        const request = JSON.stringify(this.prepareRelayRequest('flashbots_getBundleStatsV2', params));
        const response = await this.request(request);
        if (response.error !== undefined && response.error !== null) {
            return {
                error: {
                    message: response.error.message,
                    code: response.error.code,
                },
            };
        }
        return response.result;
    }
    async simulate(signedBundledTransactions, blockTag, stateBlockTag, blockTimestamp) {
        let evmBlockNumber;
        if (typeof blockTag === 'number') {
            evmBlockNumber = `0x${blockTag.toString(16)}`;
        }
        else {
            const blockTagDetails = await this.genericProvider.getBlock(blockTag);
            const blockDetails = blockTagDetails !== null ? blockTagDetails : await this.genericProvider.getBlock('latest');
            evmBlockNumber = `0x${blockDetails.number.toString(16)}`;
        }
        let evmBlockStateNumber;
        if (typeof stateBlockTag === 'number') {
            evmBlockStateNumber = `0x${stateBlockTag.toString(16)}`;
        }
        else if (!stateBlockTag) {
            evmBlockStateNumber = 'latest';
        }
        else {
            evmBlockStateNumber = stateBlockTag;
        }
        const params = [
            {
                txs: signedBundledTransactions,
                blockNumber: evmBlockNumber,
                stateBlockNumber: evmBlockStateNumber,
                timestamp: blockTimestamp,
            },
        ];
        const request = JSON.stringify(this.prepareRelayRequest('eth_callBundle', params));
        const response = await this.request(request);
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
    calculateBundlePricing(bundleTransactions, baseFee) {
        const bundleGasPricing = bundleTransactions.reduce((acc, transactionDetail) => {
            const gasUsed = 'gas_used' in transactionDetail ? transactionDetail.gas_used : transactionDetail.gasUsed;
            const gasPricePaidBySearcher = BigNumber.from('gas_price' in transactionDetail ? transactionDetail.gas_price : transactionDetail.gasPrice);
            const priorityFeeReceivedByMiner = gasPricePaidBySearcher.sub(baseFee);
            const ethSentToCoinbase = 'coinbase_transfer' in transactionDetail
                ? transactionDetail.coinbase_transfer
                : 'ethSentToCoinbase' in transactionDetail
                    ? transactionDetail.ethSentToCoinbase
                    : BigNumber.from(0);
            return {
                gasUsed: acc.gasUsed + gasUsed,
                gasFeesPaidBySearcher: acc.gasFeesPaidBySearcher.add(gasPricePaidBySearcher.mul(gasUsed)),
                priorityFeesReceivedByMiner: acc.priorityFeesReceivedByMiner.add(priorityFeeReceivedByMiner.mul(gasUsed)),
                ethSentToCoinbase: acc.ethSentToCoinbase.add(ethSentToCoinbase),
            };
        }, {
            gasUsed: 0,
            gasFeesPaidBySearcher: BigNumber.from(0),
            priorityFeesReceivedByMiner: BigNumber.from(0),
            ethSentToCoinbase: BigNumber.from(0),
        });
        const effectiveGasPriceToSearcher = bundleGasPricing.gasUsed > 0
            ? bundleGasPricing.ethSentToCoinbase.add(bundleGasPricing.gasFeesPaidBySearcher).div(bundleGasPricing.gasUsed)
            : BigNumber.from(0);
        const effectivePriorityFeeToMiner = bundleGasPricing.gasUsed > 0
            ? bundleGasPricing.ethSentToCoinbase.add(bundleGasPricing.priorityFeesReceivedByMiner).div(bundleGasPricing.gasUsed)
            : BigNumber.from(0);
        return {
            ...bundleGasPricing,
            txCount: bundleTransactions.length,
            effectiveGasPriceToSearcher,
            effectivePriorityFeeToMiner,
        };
    }
    async getConflictingBundle(targetSignedBundledTransactions, targetBlockNumber) {
        const baseFee = (await this.genericProvider.getBlock(targetBlockNumber)).baseFeePerGas || BigNumber.from(0);
        const conflictDetails = await this.getConflictingBundleWithoutGasPricing(targetSignedBundledTransactions, targetBlockNumber);
        return {
            ...conflictDetails,
            targetBundleGasPricing: this.calculateBundlePricing(conflictDetails.initialSimulation.results, baseFee),
            conflictingBundleGasPricing: conflictDetails.conflictingBundle.length > 0 ? this.calculateBundlePricing(conflictDetails.conflictingBundle, baseFee) : undefined,
        };
    }
    async getConflictingBundleWithoutGasPricing(targetSignedBundledTransactions, targetBlockNumber) {
        const [initialSimulation, competingBundles] = await Promise.all([
            this.simulate(targetSignedBundledTransactions, targetBlockNumber, targetBlockNumber - 1),
            this.fetchBlocksApi(targetBlockNumber),
        ]);
        if (competingBundles.latest_block_number <= targetBlockNumber) {
            throw new Error('Blocks-api has not processed target block');
        }
        if ('error' in initialSimulation || initialSimulation.firstRevert !== undefined) {
            throw new Error('Target bundle errors at top of block');
        }
        const blockDetails = competingBundles.blocks[0];
        if (blockDetails === undefined) {
            return {
                initialSimulation,
                conflictType: FlashbotsBundleConflictType.NoBundlesInBlock,
                conflictingBundle: [],
            };
        }
        const bundleTransactions = blockDetails.transactions;
        const bundleCount = bundleTransactions[bundleTransactions.length - 1].bundle_index + 1;
        const signedPriorBundleTransactions = [];
        for (let currentBundleId = 0; currentBundleId < bundleCount; currentBundleId++) {
            const currentBundleTransactions = bundleTransactions.filter((bundleTransaction) => bundleTransaction.bundle_index === currentBundleId);
            const currentBundleSignedTxs = await Promise.all(currentBundleTransactions.map(async (competitorBundleBlocksApiTx) => {
                const tx = await this.genericProvider.getTransaction(competitorBundleBlocksApiTx.transaction_hash);
                if (tx.raw !== undefined) {
                    return tx.raw;
                }
                if (tx.v !== undefined && tx.r !== undefined && tx.s !== undefined) {
                    if (tx.type === 2) {
                        delete tx.gasPrice;
                    }
                    return utils.serializeTransaction(tx, {
                        v: tx.v,
                        r: tx.r,
                        s: tx.s,
                    });
                }
                throw new Error('Could not get raw tx');
            }));
            signedPriorBundleTransactions.push(...currentBundleSignedTxs);
            const competitorAndTargetBundleSimulation = await this.simulate([...signedPriorBundleTransactions, ...targetSignedBundledTransactions], targetBlockNumber, targetBlockNumber - 1);
            if ('error' in competitorAndTargetBundleSimulation) {
                if (competitorAndTargetBundleSimulation.error.message.startsWith('err: nonce too low:')) {
                    return {
                        conflictType: FlashbotsBundleConflictType.NonceCollision,
                        initialSimulation,
                        conflictingBundle: currentBundleTransactions,
                    };
                }
                throw new Error('Simulation error');
            }
            const targetSimulation = competitorAndTargetBundleSimulation.results.slice(-targetSignedBundledTransactions.length);
            for (let j = 0; j < targetSimulation.length; j++) {
                const targetSimulationTx = targetSimulation[j];
                const initialSimulationTx = initialSimulation.results[j];
                if ('error' in targetSimulationTx || 'error' in initialSimulationTx) {
                    if ('error' in targetSimulationTx != 'error' in initialSimulationTx) {
                        return {
                            conflictType: FlashbotsBundleConflictType.Error,
                            initialSimulation,
                            conflictingBundle: currentBundleTransactions,
                        };
                    }
                    continue;
                }
                if (targetSimulationTx.ethSentToCoinbase != initialSimulationTx.ethSentToCoinbase) {
                    return {
                        conflictType: FlashbotsBundleConflictType.CoinbasePayment,
                        initialSimulation,
                        conflictingBundle: currentBundleTransactions,
                    };
                }
                if (targetSimulationTx.gasUsed != initialSimulation.results[j].gasUsed) {
                    return {
                        conflictType: FlashbotsBundleConflictType.GasUsed,
                        initialSimulation,
                        conflictingBundle: currentBundleTransactions,
                    };
                }
            }
        }
        return {
            conflictType: FlashbotsBundleConflictType.NoConflict,
            initialSimulation,
            conflictingBundle: [],
        };
    }
    async fetchBlocksApi(blockNumber) {
        return utils.fetchJson(`https://blocks.flashbots.net/v1/blocks?block_number=${blockNumber}`);
    }
    async request(request) {
        const fetchRequest = await fetch(MEV_RELAY_GOERLI, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'X-Flashbots-Signature': `${await this.authSigner.getAddress()}:${await this.authSigner.signMessage(utils.id(request))}`,
            },
            body: request,
        });
        const response = await fetchRequest.json();
        return response;
    }
    async fetchReceipts(bundledTransactions) {
        return Promise.all(bundledTransactions.map((bundledTransaction) => this.genericProvider.getTransactionReceipt(bundledTransaction.hash)));
    }
    prepareRelayRequest(method, params) {
        return {
            method: method,
            params: params,
            id: this._nextId++,
            jsonrpc: '2.0',
        };
    }
}
//# sourceMappingURL=flashbots-ethers-provider.js.map