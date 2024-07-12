import { BouquetNetwork, BouquetSettings } from './types/bouquetTypes.js'

export const MAINNET = {
	networkName: 'Mainnet',
	simulationRelayEndpoint: 'https://flashbots-cors-proxy.dark-florist.workers.dev/',
	submissionRelayEndpoint: 'https://rpc.titanbuilder.xyz',
	blockExplorer: 'https://etherscan.io/',
	rpcUrl: 'https://rpc.dark.florist/flipcardtrustone',
	chainId: 1n,
	blockExplorerApi: 'https://api.etherscan.io',
	relayMode: 'relay',
	mempoolSubmitRpcEndpoint: '', // don't set default for Mainnet as its not advisable to use it
	blocksInFuture: 3n,
	priorityFee: 10n ** 0n * 3n,
} as const

export const DEFAULT_NETWORKS: BouquetNetwork[] = [
	MAINNET,
	{
		networkName: 'Sepolia',
		simulationRelayEndpoint: 'https://flashbots-sepolia-cors-proxy.dark-florist.workers.dev/',
		submissionRelayEndpoint: 'https://flashbots-sepolia-cors-proxy.dark-florist.workers.dev/',
		blockExplorer: 'https://sepolia-etherscan.io/',
		rpcUrl: 'https://rpc-sepolia.dark.florist/flipcardtrustone',
		chainId: 11155111n,
		blockExplorerApi: 'https://sepolia-api.etherscan.io',
		relayMode: 'relay',
		mempoolSubmitRpcEndpoint: '', // don't set default for Sepolia as its not advisable to use it
		blocksInFuture: 3n,
		priorityFee: 10n ** 0n * 3n,
	},
	{
		networkName: 'Holesky',
		simulationRelayEndpoint: '',
		submissionRelayEndpoint: '',
		blockExplorer: 'https://holesky-etherscan.io/',
		rpcUrl: 'https://holesky.dark.florist',
		chainId: 17000n,
		blockExplorerApi: 'https://holesky-api.etherscan.io',
		relayMode: 'mempool',
		mempoolSubmitRpcEndpoint: 'https://holesky.dark.florist',
		blocksInFuture: 3n,
		priorityFee: 10n ** 0n * 3n,
	}
]

export const getNetwork = (networks: BouquetSettings, chainId: bigint): BouquetNetwork => {
	const network = networks.find((network) => network.chainId === chainId)
	if (network !== undefined) return network
	return {
		networkName: `Custom ChainId: ${ chainId }`,
		simulationRelayEndpoint: '',
		submissionRelayEndpoint: '',
		blockExplorer: '',
		rpcUrl: '',
		chainId: chainId,
		blockExplorerApi: '',
		relayMode: 'mempool',
		mempoolSubmitRpcEndpoint: '',
		blocksInFuture: 3n,
		priorityFee: 10n ** 0n * 3n,
	}
}
