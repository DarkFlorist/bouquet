export const NETWORKS: { [chainId: string]: { simulationRelay: string, submissionRelay: string, blockExplorer: string, rpcUrl: string }} = {
	'1': { simulationRelay: 'https://relay.dark.florist', submissionRelay: 'https://rpc.titanbuilder.xyz', blockExplorer: 'https://etherscan.io/', rpcUrl: 'https://rpc.dark.florist/flipcardtrustone' },
	'5': { simulationRelay: 'https://relay-goerli.dark.florist', submissionRelay: 'https://relay-goerli.dark.florist',  blockExplorer: 'https://goerli.etherscan.io/', rpcUrl: 'https://rpc-goerli.dark.florist/flipcardtrustone' }
}
