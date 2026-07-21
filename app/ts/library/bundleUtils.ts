import { Authorization, BrowserProvider, getAddress, getNumber, Signature, Signer, TransactionRequest, verifyAuthorization } from 'ethers'
import { BlockInfo, Bundle, serialize, Signers } from '../types/types.js'
import { EthereumData } from '../types/ethereumTypes.js'
import { addressString } from './utils.js'

export interface FlashbotsBundleTransaction {
	transaction: TransactionRequest
	signer: Signer
}

export const getMaxBaseFeeInFutureBlock = (baseFee: bigint, blocksInFuture: bigint) => {
	if (blocksInFuture <= 0n) throw new Error('blocksInFuture needs to be positive')
	return [...Array(blocksInFuture)].reduce((accumulator, _currentValue) => (accumulator * 1125n) / 1000n, baseFee) + 1n
}

async function getSimulatedCountsOnNetwork(provider: BrowserProvider): Promise<{ [address: string]: number }> {
	try {
		const { payload } = await provider.send(
			'interceptor_getSimulationStack',
			['1.0.1']
		)
		const result = payload.reduce((acc: { [address: string]: number }, curr: { from: string, authorizationList?: { authority?: string }[] }) => {
			const affectedAddresses = [curr.from, ...(curr.authorizationList ?? []).flatMap((authorization) => authorization.authority === undefined ? [] : [authorization.authority])].map(getAddress)
			for (const address of affectedAddresses) acc[address] = (acc[address] ?? 0) + 1
			return acc
		}, {})
		return result
	} catch (error) {
		console.error('getSimulatedCountsOnNetwork error: ', error)
		return {}
	}
}

export const getRawTransactionsAndCalculateFeesAndNonces = async (bundle: FlashbotsBundleTransaction[], provider: BrowserProvider, blockInfo: BlockInfo, maxBaseFee: bigint) => {
	const transactions: { rawTransaction: string, transaction: TransactionRequest } [] = []
	const inSimulation = await getSimulatedCountsOnNetwork(provider)
	const accNonces: { [address: string]: number } = {}
	for (const tx of bundle) {
		tx.transaction.maxPriorityFeePerGas = blockInfo.priorityFee
		tx.transaction.maxFeePerGas = blockInfo.priorityFee + maxBaseFee
		if (!tx.transaction.from) throw new Error('BundleTransaction missing from address')
		if (!tx.transaction.chainId) throw new Error('BundleTransaction missing chainId')
		// Fetch and increment nonces from network, reduce the fetch amount by amount of transactions made on the simulation stack
		const sender = getAddress(tx.transaction.from.toString())
		if (!(sender in accNonces)) {
			accNonces[sender] = await provider.getTransactionCount(sender, 'latest') - (inSimulation[sender] ?? 0)
		}
		tx.transaction.nonce = accNonces[sender]
		accNonces[sender] += 1
		for (const authorization of tx.transaction.authorizationList ?? []) {
			const authority = getAddress(verifyAuthorization({ address: authorization.address, chainId: authorization.chainId, nonce: BigInt(authorization.nonce.toString()) }, authorization.signature))
			const nextAuthorityNonce = getNumber(authorization.nonce) + 1
			accNonces[authority] = Math.max(accNonces[authority] ?? nextAuthorityNonce, nextAuthorityNonce)
		}
		const rawTransaction = await tx.signer.signTransaction({ ...tx.transaction })
		transactions.push({ rawTransaction, transaction: tx.transaction })
	}
	return transactions
}

export const createBundleTransactions = async (
	bundle: Bundle,
	signers: Signers,
	blockInfo: BlockInfo,
	blocksInFuture: bigint,
	fundingAmountMin: bigint,
): Promise<FlashbotsBundleTransaction[]> => {
	return Promise.all(bundle.transactions.map(async ({ from, to, gasLimit, value, input, chainId, type, accessList, authorizationList }) => {
		const gasOpts = {
			maxPriorityFeePerGas: blockInfo.priorityFee,
			type: type === '7702' ? 4 : 2,
			maxFeePerGas: blockInfo.priorityFee + getMaxBaseFeeInFutureBlock(blockInfo.baseFee, blocksInFuture),
		}
		if (from === 'FUNDING') {
			if (!signers.burner) throw new Error('No burner wallet provided')
			return {
				signer: signers.burner,
				transaction: {
					from: signers.burner.address,
					...(to
						? {
							to: addressString(to),
						}
						: {}),
					value: fundingAmountMin - 21000n * (getMaxBaseFeeInFutureBlock(blockInfo.baseFee, blocksInFuture) + blockInfo.priorityFee),
					data: '0x',
					gasLimit: 21000n,
					chainId: Number(chainId),
					...gasOpts,
				},
			}
		} else {
			const signer = signers.bundleSigners[addressString(from)]
			if (!signer) throw new Error(`No signer provided for ${addressString(from)}`)
			const resolvedAuthorizations: Authorization[] = []
			for (const authorization of authorizationList ?? []) {
				if (authorization.r !== undefined && authorization.s !== undefined && authorization.yParity !== undefined) {
					resolvedAuthorizations.push({
						address: addressString(authorization.address),
						chainId: authorization.chainId,
						nonce: authorization.nonce,
						signature: Signature.from({
							r: `0x${authorization.r.toString(16).padStart(64, '0')}`,
							s: `0x${authorization.s.toString(16).padStart(64, '0')}`,
							yParity: authorization.yParity === 'odd' ? 1 : 0,
						}),
					})
					continue
				}
				if (authorization.authority === undefined) throw new Error('Unsigned authorization is missing its authority')
				const authoritySigner = signers.bundleSigners[addressString(authorization.authority)]
				if (!authoritySigner) throw new Error(`No signer provided for authorization authority ${addressString(authorization.authority)}`)
				resolvedAuthorizations.push(await authoritySigner.authorize({
					address: addressString(authorization.address),
					chainId: authorization.chainId,
					nonce: authorization.nonce,
				}))
			}
			return {
				signer,
				transaction: {
					from: addressString(from),
					...(to ? { to: addressString(to) } : {}),
					gasLimit,
					data: serialize(EthereumData, input),
					value,
					chainId: Number(chainId),
					accessList: (accessList ?? []).map((entry) => ({ address: addressString(entry.address), storageKeys: entry.storageKeys.map((key) => `0x${key.toString(16).padStart(64, '0')}`) })),
					...(type === '7702' ? { authorizationList: resolvedAuthorizations } : {}),
					...gasOpts,
				},
			}
		}
	}))
}
