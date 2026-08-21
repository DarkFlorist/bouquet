import { BouquetNetwork } from './types/bouquetTypes.js';
export declare const MAINNET: {
    readonly networkName: "Mainnet";
    readonly simulationRelayEndpoint: "https://flashbots-cors-proxy.dark-florist.workers.dev/";
    readonly submissionRelayEndpoint: "https://rpc.titanbuilder.xyz";
    readonly blockExplorer: "https://etherscan.io/";
    readonly chainId: 1n;
    readonly blockExplorerApi: "https://api.etherscan.io";
    readonly relayMode: "relay";
    readonly mempoolSubmitRpcEndpoint: undefined;
    readonly mempoolSimulationRpcEndpoint: undefined;
    readonly blocksInFuture: 3n;
    readonly priorityFee: bigint;
};
export declare const DEFAULT_NETWORKS: BouquetNetwork[];
export declare const getNetwork: (networks: readonly {
    chainId: bigint;
    networkName: string;
    relayMode: "relay" | "mempool";
    mempoolSubmitRpcEndpoint: string | undefined;
    mempoolSimulationRpcEndpoint: string | undefined;
    blocksInFuture: bigint;
    priorityFee: bigint;
    blockExplorerApi: string | undefined;
    blockExplorer: string | undefined;
    simulationRelayEndpoint: string | undefined;
    submissionRelayEndpoint: string | undefined;
}[], chainId: bigint) => BouquetNetwork;
//# sourceMappingURL=constants.d.ts.map