type Network = { networkName: string, simulationRelay: string, submissionRelay: string, blockExplorer: string, rpcUrl: string, chainId: string, blockExplorerApi: string }

export const MAINNET = {
	networkName: 'Mainnet',
	simulationRelay: 'https://flashbots-cors-proxy.dark-florist.workers.dev/',
	submissionRelay: 'https://rpc.titanbuilder.xyz',
	blockExplorer: 'https://etherscan.io/',
	rpcUrl: 'https://rpc.dark.florist/flipcardtrustone',
	chainId: `0x${1n.toString(16)}`,
	blockExplorerApi: 'https://api.etherscan.io'
}

export const NETWORKS = new Map<bigint, Network>([
	[1n, MAINNET],
	[11155111n, {
		networkName: 'Sepolia',
		simulationRelay: 'https://flashbots-sepolia-cors-proxy.dark-florist.workers.dev/',
		submissionRelay: 'https://flashbots-sepolia-cors-proxy.dark-florist.workers.dev/',
		blockExplorer: 'https://sepolia-etherscan.io/',
		rpcUrl: 'https://rpc-sepolia.dark.florist/flipcardtrustone',
		chainId: `0x${11155111n.toString(16)}`,
		blockExplorerApi: 'https://sepolia-api.etherscan.io',
	}]
])

export const findNetworkBySimulationRelayEndpoint = (simulationRelayEndpoint: string) => {
	for (const [_chainId, network] of NETWORKS) {
		if (network.simulationRelay === simulationRelayEndpoint) return network
	}
	return undefined
}

export const getSupportedNetworksNamesAndIds = () => {
	return Array.from(NETWORKS, ([chainid, network]) => ({ chainid, networkName: network.networkName }))
}
