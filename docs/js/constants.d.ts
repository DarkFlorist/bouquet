type Network = {
    networkName: string;
    simulationRelay: string;
    submissionRelay: string;
    blockExplorer: string;
    rpcUrl: string;
    chainId: string;
    blockExplorerApi: string;
};
export declare const MAINNET: {
    networkName: string;
    simulationRelay: string;
    submissionRelay: string;
    blockExplorer: string;
    rpcUrl: string;
    chainId: string;
    blockExplorerApi: string;
};
export declare const NETWORKS: Map<bigint, Network>;
export declare const findNetworkBySimulationRelayEndpoint: (simulationRelayEndpoint: string) => Network | undefined;
export declare const getSupportedNetworksNamesAndIds: () => {
    chainid: bigint;
    networkName: string;
}[];
export {};
//# sourceMappingURL=constants.d.ts.map