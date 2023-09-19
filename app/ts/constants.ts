export const NETWORKS: { [chainId: string]: { mevRelay: string, blockExplorer: string, rpcUrl: string }} = {
	'1': { mevRelay: 'https://relay.dark.florist', blockExplorer: 'https://etherscan.io/', rpcUrl: 'https://rpc.dark.florist/flipcardtrustone' },
	'5': { mevRelay: 'https://relay-goerli.dark.florist', blockExplorer: 'https://goerli.etherscan.io/', rpcUrl: 'https://rpc-goerli.dark.florist/flipcardtrustone' }
}
