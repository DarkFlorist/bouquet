export const MAINNET = {
    networkName: 'Mainnet',
    simulationRelayEndpoint: 'https://flashbots-cors-proxy.dark-florist.workers.dev/',
    submissionRelayEndpoint: 'https://rpc.titanbuilder.xyz',
    blockExplorer: 'https://etherscan.io/',
    chainId: 1n,
    blockExplorerApi: 'https://api.etherscan.io',
    relayMode: 'relay',
    mempoolSubmitRpcEndpoint: undefined, // don't set default for Mainnet as its not advisable to use it
    mempoolSimulationRpcEndpoint: undefined,
    blocksInFuture: 3n,
    priorityFee: 10n ** 9n * 3n,
};
export const DEFAULT_NETWORKS = [
    MAINNET,
    {
        networkName: 'Sepolia',
        simulationRelayEndpoint: 'https://flashbots-sepolia-cors-proxy.dark-florist.workers.dev/',
        submissionRelayEndpoint: 'https://flashbots-sepolia-cors-proxy.dark-florist.workers.dev/',
        blockExplorer: 'https://sepolia.etherscan.io/',
        chainId: 11155111n,
        blockExplorerApi: 'https://sepolia.api.etherscan.io',
        relayMode: 'relay',
        mempoolSubmitRpcEndpoint: undefined, // don't set default for Sepolia as its not advisable to use it
        mempoolSimulationRpcEndpoint: undefined,
        blocksInFuture: 3n,
        priorityFee: 10n ** 9n * 3n,
    },
    {
        networkName: 'Holesky',
        simulationRelayEndpoint: undefined,
        submissionRelayEndpoint: undefined,
        blockExplorer: 'https://holesky.etherscan.io/',
        chainId: 17000n,
        blockExplorerApi: 'https://holesky.api.etherscan.io',
        relayMode: 'mempool',
        mempoolSubmitRpcEndpoint: 'https://holesky.dark.florist',
        mempoolSimulationRpcEndpoint: 'https://holesky.dark.florist',
        blocksInFuture: 3n,
        priorityFee: 10n ** 9n * 3n,
    }
];
export const getNetwork = (networks, chainId) => {
    const network = networks.find((network) => network.chainId === chainId);
    if (network !== undefined)
        return network;
    return {
        networkName: `Custom ChainId: ${chainId}`,
        simulationRelayEndpoint: undefined,
        submissionRelayEndpoint: undefined,
        blockExplorer: undefined,
        chainId,
        blockExplorerApi: undefined,
        relayMode: 'mempool',
        mempoolSubmitRpcEndpoint: undefined,
        mempoolSimulationRpcEndpoint: undefined,
        blocksInFuture: 3n,
        priorityFee: 10n ** 9n * 3n,
    };
};
//# sourceMappingURL=constants.js.map