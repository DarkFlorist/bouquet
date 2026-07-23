import { Authorization, BrowserProvider, getAddress, getNumber, Signature, Signer, TransactionRequest, verifyAuthorization } from 'ethers'
import { BlockInfo, Bundle, serialize, Signers } from '../types/types.js'
import { EthereumData } from '../types/ethereumTypes.js'
import { addressString } from './utils.js'
import { isClearDelegationTransaction } from './bundle.js'

export interface FlashbotsBundleTransaction {
	transaction: TransactionRequest
	signer: Signer
}

export const getMaxBaseFeeInFutureBlock = (baseFee: bigint, blocksInFuture: bigint) => {
	if (blocksInFuture <= 0n) throw new Error('blocksInFuture needs to be positive')
	let maxBaseFee = baseFee
	for (let block = 0n; block < blocksInFuture; block++) maxBaseFee = (maxBaseFee * 1125n) / 1000n + 1n
	return maxBaseFee
}

export const withPriorityFee = (blockInfo: BlockInfo, priorityFee: bigint): BlockInfo => ({ ...blockInfo, priorityFee })

async function requestSimulatedCountsOnNetwork(provider: Pick<BrowserProvider, 'send'>): Promise<{ [address: string]: number }> {
	const { payload } = await provider.send(
		'interceptor_getSimulationStack',
		['1.0.1']
	)
	return payload.reduce((acc: { [address: string]: number }, curr: { from: string, authorizationList?: { authority?: string }[] }) => {
		const affectedAddresses = [curr.from, ...(curr.authorizationList ?? []).flatMap((authorization) => authorization.authority === undefined ? [] : [authorization.authority])].map(getAddress)
		for (const address of affectedAddresses) acc[address] = (acc[address] ?? 0) + 1
		return acc
	}, {})
}

async function getSimulatedCountsOnNetwork(provider: BrowserProvider): Promise<{ [address: string]: number }> {
	try {
		return await requestSimulatedCountsOnNetwork(provider)
	} catch (error) {
		console.error('getSimulatedCountsOnNetwork error: ', error)
		return {}
	}
}

export const getRawTransactionsAndCalculateFeesAndNonces = async (
	bundle: Bundle,
	signers: Signers,
	provider: BrowserProvider,
	blockInfo: BlockInfo,
	blocksInFuture: bigint,
	fundingAmountMin: bigint,
	maxBaseFee: bigint,
) => {
	const transactions: { rawTransaction: string, transaction: TransactionRequest } [] = []
	const unsignedAuthorizationAuthorities = [...new Set(bundle.transactions
		.filter(isClearDelegationTransaction)
		.flatMap((transaction) => (transaction.authorizationList ?? []).flatMap((authorization) =>
			authorization.authority === undefined || authorization.r !== undefined ? [] : [getAddress(addressString(authorization.authority))]
		))
	)]
	const inSimulation = unsignedAuthorizationAuthorities.length > 0
		? await requestSimulatedCountsOnNetwork(provider)
		: await getSimulatedCountsOnNetwork(provider)
	const accNonces: { [address: string]: number } = {}
	const getNonceBeforeSimulation = async (address: string): Promise<number> => {
		const normalizedAddress = getAddress(address)
		if (normalizedAddress in accNonces) return accNonces[normalizedAddress]
		const transactionCount = await provider.getTransactionCount(normalizedAddress, 'latest') - (inSimulation[normalizedAddress] ?? 0)
		if (transactionCount < 0) throw new Error('Interceptor returned an invalid nonce for this simulation stack.')
		accNonces[normalizedAddress] = transactionCount
		return transactionCount
	}
	const authorizationNonces: { [address: string]: bigint } = {}
	for (const authority of unsignedAuthorizationAuthorities) authorizationNonces[authority] = BigInt(await getNonceBeforeSimulation(authority))
	const bundleTransactions = await createBundleTransactions(bundle, signers, blockInfo, blocksInFuture, fundingAmountMin, authorizationNonces)
	for (const tx of bundleTransactions) {
		tx.transaction.maxPriorityFeePerGas = blockInfo.priorityFee
		tx.transaction.maxFeePerGas = blockInfo.priorityFee + maxBaseFee
		if (!tx.transaction.from) throw new Error('BundleTransaction missing from address')
		if (!tx.transaction.chainId) throw new Error('BundleTransaction missing chainId')
		// Fetch and increment nonces from network, reduce the fetch amount by amount of transactions made on the simulation stack
		const sender = getAddress(tx.transaction.from.toString())
		if (!(sender in accNonces)) {
			accNonces[sender] = await getNonceBeforeSimulation(sender)
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
	authorizationNonces: Readonly<{ [address: string]: bigint }>,
): Promise<FlashbotsBundleTransaction[]> => {
	const gasPrice = blockInfo.priorityFee + getMaxBaseFeeInFutureBlock(blockInfo.baseFee, blocksInFuture)
	const fundingWalletGas = bundle.transactions.reduce((total, transaction) => transaction.from === 'FUNDING' ? total + transaction.gasLimit : total, 0n)
	return Promise.all(bundle.transactions.map(async (bundleTransaction) => {
		const { from, to, gasLimit, value, input, chainId, type, accessList, authorizationList } = bundleTransaction
		const isDelegationClear = isClearDelegationTransaction(bundleTransaction)
		const gasOpts = {
			maxPriorityFeePerGas: blockInfo.priorityFee,
			type: type === '7702' ? 4 : 2,
			maxFeePerGas: gasPrice,
		}
		if (from === 'FUNDING' && !isDelegationClear) {
			if (!signers.burner) throw new Error('No burner wallet provided')
			const fundingValue = fundingAmountMin - fundingWalletGas * gasPrice
			if (fundingValue < 0n) throw new Error('Funding wallet balance requirement is smaller than its transaction fees')
			return {
				signer: signers.burner,
				transaction: {
					from: signers.burner.address,
					...(to
						? {
							to: addressString(to),
						}
						: {}),
					value: fundingValue,
					data: '0x',
					gasLimit: 21000n,
					chainId: Number(chainId),
					...gasOpts,
				},
			}
		} else {
			const signer = from === 'FUNDING' ? signers.burner : signers.bundleSigners[addressString(from)]
			if (!signer) throw new Error(from === 'FUNDING' ? 'No burner wallet provided' : `No signer provided for ${addressString(from)}`)
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
				const authorityAddress = addressString(authorization.authority)
				if (isDelegationClear && authorityAddress === signer.address) throw new Error('The funding wallet must be different from the compromised account')
				const authoritySigner = signers.bundleSigners[authorityAddress]
				if (!authoritySigner) throw new Error(`No signer provided for authorization authority ${addressString(authorization.authority)}`)
				const authorizationNonce = isDelegationClear ? authorizationNonces[getAddress(authorityAddress)] : authorization.nonce
				if (authorizationNonce === undefined) throw new Error(`Missing current authorization nonce for ${authorityAddress}`)
				resolvedAuthorizations.push(await authoritySigner.authorize({
					address: addressString(authorization.address),
					chainId: authorization.chainId,
					nonce: authorizationNonce,
				}))
			}
			return {
				signer,
				transaction: {
					from: signer.address,
					...(isDelegationClear && from === 'FUNDING' ? { to: signer.address } : to ? { to: addressString(to) } : {}),
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
