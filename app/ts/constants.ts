type Network = { simulationRelay: string, submissionRelay: string, blockExplorer: string, rpcUrl: string, chainId: string, blockExplorerApi: string }

export const MAINNET = {
	simulationRelay: 'https://flashbots-cors-proxy.dark-florist.workers.dev/',
	submissionRelay: 'https://rpc.titanbuilder.xyz',
	blockExplorer: 'https://etherscan.io/',
	rpcUrl: 'https://rpc.dark.florist/flipcardtrustone',
	chainId: `0x${1n.toString(16)}`,
	blockExplorerApi: 'https://api.etherscan.io'
}

export const NETWORKS = new Map<bigint, Network>([
	[1n, MAINNET],
	/*[11155111n, {
		simulationRelay: '...',
		submissionRelay: '...',
		blockExplorer: 'https://sepolia-etherscan.io/',
		rpcUrl: 'https://rpc-sepolia.dark.florist/flipcardtrustone',
		chainId: `0x${11155111n.toString(16)}`,
		blockExplorerApi: 'https://sepolia-api.etherscan.io'
	}]*/
])

export const findNetworkBySimulationRelayEndpoint = (simulationRelayEndpoint: string) => {
	const networks = Array.from(NETWORKS, ([chainid, network]) => ({ chainid, network }))
	return networks.find((network) => network.network.simulationRelay === simulationRelayEndpoint)?.network
}
