import * as funtypes from 'funtypes';
import { EthereumAccessList, EthereumAddress, EthereumInput, EthereumQuantity, EthereumSignatureParity } from './ethereumTypes.js';
export const Eip7702Authorization = funtypes.Intersect(funtypes.Object({
    chainId: EthereumQuantity,
    address: EthereumAddress,
    nonce: EthereumQuantity,
}).asReadonly(), funtypes.Partial({
    authority: EthereumAddress,
    r: EthereumQuantity,
    s: EthereumQuantity,
    yParity: EthereumSignatureParity,
}).asReadonly());
export const TransactionList = funtypes.ReadonlyArray(funtypes.Intersect(funtypes.Object({
    from: funtypes.Union(EthereumAddress, funtypes.Literal('FUNDING')),
    to: funtypes.Union(EthereumAddress, funtypes.Null),
    value: EthereumQuantity,
    input: EthereumInput,
    chainId: EthereumQuantity,
    gasLimit: EthereumQuantity,
}).asReadonly(), funtypes.Partial({
    type: funtypes.Union(funtypes.Literal('1559'), funtypes.Literal('7702')),
    accessList: EthereumAccessList,
    authorizationList: funtypes.ReadonlyArray(Eip7702Authorization),
}).asReadonly()));
export const PopulatedTransactionList = funtypes.ReadonlyArray(funtypes.Object({
    from: EthereumAddress,
    to: funtypes.Union(EthereumAddress, funtypes.Null),
    value: EthereumQuantity,
    input: EthereumInput,
    chainId: EthereumQuantity,
    gasLimit: EthereumQuantity,
    nonce: EthereumQuantity,
    maxFeePerGas: EthereumQuantity,
    maxPriorityFeePerGas: EthereumQuantity
}).asReadonly());
export const BouquetNetwork = funtypes.Object({
    chainId: EthereumQuantity,
    networkName: funtypes.String,
    relayMode: funtypes.Union(funtypes.Literal('relay'), funtypes.Literal('mempool')),
    mempoolSubmitRpcEndpoint: funtypes.Union(funtypes.String, funtypes.Undefined),
    mempoolSimulationRpcEndpoint: funtypes.Union(funtypes.String, funtypes.Undefined),
    blocksInFuture: EthereumQuantity,
    priorityFee: EthereumQuantity,
    blockExplorerApi: funtypes.Union(funtypes.String, funtypes.Undefined),
    blockExplorer: funtypes.Union(funtypes.String, funtypes.Undefined),
    simulationRelayEndpoint: funtypes.Union(funtypes.String, funtypes.Undefined),
    submissionRelayEndpoint: funtypes.Union(funtypes.String, funtypes.Undefined)
});
export const BouquetSettings = funtypes.ReadonlyArray(BouquetNetwork);
//# sourceMappingURL=bouquetTypes.js.map