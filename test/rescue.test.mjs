import assert from 'node:assert/strict'
import test from 'node:test'
import { Transaction, Wallet, verifyAuthorization } from 'ethers'
import { createBundleTransactions, getRawTransactionsAndCalculateFeesAndNonces, getTransactionCountBeforeSimulation } from '../app/js/library/bundleUtils.js'
import { createBundle } from '../app/js/library/bundle.js'
import { createClearDelegationTransaction, createRescueBundle, ensureDelegationClearFunding, getActiveEip7702DelegationTarget, isClearDelegationTransaction, parseEip7702DelegationTarget, validateBundle } from '../app/js/library/rescue.js'
import { convertInterceptorTransactions, markSyntheticFunding, requestInterceptorStackAfterConnection, simulationStackRequestError } from '../app/js/library/interceptorImport.js'
import { GetSimulationStackReply } from '../app/js/types/interceptorTypes.js'
import { fetchBundleFromStorage, initializeBundleFromStorage } from '../app/js/stores.js'
import { TransactionList } from '../app/js/types/bouquetTypes.js'

const chainId = 11155111n
const sponsor = Wallet.createRandom()
const authority = Wallet.createRandom()
const recipient = Wallet.createRandom()
const burner = Wallet.createRandom()
const asAddress = (address) => BigInt(address)

test('waits for the wallet connection before requesting the Interceptor simulation stack', async () => {
	let finishConnection
	let stackRequestCount = 0
	const connectionReady = new Promise((resolve) => { finishConnection = resolve })
	const importRequest = requestInterceptorStackAfterConnection(
		() => connectionReady,
		async () => {
			stackRequestCount += 1
			return 'simulation stack'
		},
	)

	await Promise.resolve()
	assert.equal(stackRequestCount, 0)
	finishConnection()
	assert.equal(await importRequest, 'simulation stack')
	assert.equal(stackRequestCount, 1)
})

test('turns simulation stack provider failures into actionable messages', () => {
	assert.equal(
		simulationStackRequestError({ code: 123456, name: 'EthereumJsonRpcError' }).message,
		'Interceptor encountered an internal error while exporting the simulation stack. Close any pending Interceptor request and try again.',
	)
	assert.equal(simulationStackRequestError({ code: 4001 }).message, 'Simulation stack export was rejected in Interceptor.')
	assert.equal(simulationStackRequestError({ code: -32601 }).message, 'Wallet does not support returning simulations')
	assert.equal(simulationStackRequestError({ code: -32000, message: 'Request already pending' }).message, 'Interceptor could not return the simulation stack: Request already pending')
})

const clearDelegation = {
	from: asAddress(sponsor.address),
	to: asAddress(authority.address),
	value: 0n,
	input: new Uint8Array(),
	chainId,
	gasLimit: 100000n,
	type: '7702',
	accessList: [],
	authorizationList: [{
		chainId,
		address: 0n,
		nonce: 3n,
		authority: asAddress(authority.address),
	}],
}

const funding = {
	from: 'FUNDING',
	to: asAddress(authority.address),
	value: 10000000000000000n,
	input: new Uint8Array(),
	chainId,
	gasLimit: 21000n,
}

const sweep = {
	from: asAddress(authority.address),
	to: asAddress(recipient.address),
	value: 1n,
	input: new Uint8Array(),
	chainId,
	gasLimit: 21000n,
}

test('orders delegation clearing before funding and sweeps', () => {
	const bundle = createRescueBundle([funding, sweep, clearDelegation])
	assert.equal(bundle.rescueMode, true)
	assert.equal(isClearDelegationTransaction(bundle.transactions[0]), true)
	assert.equal(bundle.transactions[1].from, 'FUNDING')
	assert.deepEqual(bundle.uniqueSigners.sort(), [sponsor.address, authority.address].sort())
	assert.equal(validateBundle(bundle), undefined)
})

test('adds funding for the compromised account when the imported stack has none', () => {
	const automaticClear = createClearDelegationTransaction({ authority: authority.address, chainId })
	const transactions = ensureDelegationClearFunding([automaticClear, sweep])
	assert.equal(transactions.length, 3)
	assert.equal(transactions[2].from, 'FUNDING')
	assert.equal(transactions[2].to, asAddress(authority.address))
	assert.equal(transactions[2].value, 0n)
	assert.equal(transactions[2].gasLimit, 21_000n)
})

test('keeps an existing funding transaction instead of adding a duplicate', () => {
	const automaticClear = createClearDelegationTransaction({ authority: authority.address, chainId })
	const transactions = ensureDelegationClearFunding([automaticClear, funding, sweep])
	assert.equal(transactions.length, 3)
	assert.equal(transactions[1], funding)
})

test('migrates a stored clear-and-sweep payload by inserting funding in the correct order', () => {
	const automaticClear = createClearDelegationTransaction({ authority: authority.address, chainId })
	const storage = new Map([['payload', JSON.stringify(TransactionList.serialize([automaticClear, sweep]))]])
	globalThis.localStorage = {
		getItem: (key) => storage.get(key) ?? null,
		setItem: (key, value) => storage.set(key, value),
		removeItem: (key) => storage.delete(key),
	}

	const storedBundle = fetchBundleFromStorage()
	assert.equal(storedBundle.transactions.length, 2)
	assert.equal(TransactionList.parse(JSON.parse(storage.get('payload'))).length, 2)

	const migratedBundle = initializeBundleFromStorage()
	assert.equal(migratedBundle.transactions.length, 3)
	assert.equal(isClearDelegationTransaction(migratedBundle.transactions[0]), true)
	assert.equal(migratedBundle.transactions[1].from, 'FUNDING')
	assert.equal(migratedBundle.transactions[1].to, asAddress(authority.address))
	assert.equal(migratedBundle.transactions[2].from, asAddress(authority.address))
	assert.equal(TransactionList.parse(JSON.parse(storage.get('payload'))).length, 3)
})

test('creates a safe unsigned delegation-clearing transaction for later signing', async () => {
	const transaction = createClearDelegationTransaction({
		authority: authority.address,
		chainId,
	})
	assert.equal(transaction.type, '7702')
	assert.equal(transaction.from, 'FUNDING')
	assert.equal(transaction.to, null)
	assert.equal(transaction.authorizationList[0].authority, asAddress(authority.address))
	assert.equal(transaction.authorizationList[0].address, 0n)
	assert.equal(transaction.authorizationList[0].nonce, 0n)
	const createdBundle = createRescueBundle([funding, sweep, transaction])
	assert.equal(validateBundle(createdBundle), undefined)
	const [signedClear] = await createBundleTransactions(createdBundle, {
		burner,
		burnerBalance: 100000000000000000n,
		bundleSigners: { [authority.address]: authority },
	}, { blockNumber: 1n, baseFee: 1n, priorityFee: 1n }, 1n, 10000000000000000n, {
		send: async () => ({ payload: [{ from: authority.address }] }),
		getTransactionCount: async () => 4,
	})
	assert.equal(signedClear.signer.address, burner.address)
	assert.equal(signedClear.transaction.from, burner.address)
	assert.equal(signedClear.transaction.to, burner.address)
	assert.equal(verifyAuthorization(signedClear.transaction.authorizationList[0], signedClear.transaction.authorizationList[0].signature), authority.address)
	assert.equal(signedClear.transaction.authorizationList[0].nonce, 3n)
	assert.equal(signedClear.transaction.authorizationList[0].address, '0x0000000000000000000000000000000000000000')
})

test('refreshes the delegation authorization nonce before each signing attempt', async () => {
	const transaction = createClearDelegationTransaction({ authority: authority.address, chainId })
	const bundle = createRescueBundle([funding, sweep, transaction])
	let transactionCount = 4
	const provider = {
		send: async () => ({ payload: [{ from: authority.address }] }),
		getTransactionCount: async () => transactionCount,
	}
	const signers = {
		burner,
		burnerBalance: 100000000000000000n,
		bundleSigners: { [authority.address]: authority },
	}
	const blockInfo = { blockNumber: 1n, baseFee: 1n, priorityFee: 1n }

	const [firstAttempt] = await createBundleTransactions(bundle, signers, blockInfo, 1n, 10000000000000000n, provider)
	transactionCount = 5
	const [secondAttempt] = await createBundleTransactions(bundle, signers, blockInfo, 1n, 10000000000000000n, provider)

	assert.equal(firstAttempt.transaction.authorizationList[0].nonce, 3n)
	assert.equal(secondAttempt.transaction.authorizationList[0].nonce, 4n)
})

test('keeps enough ETH in the shared funding wallet for clearing and funding gas', async () => {
	const transaction = createClearDelegationTransaction({ authority: authority.address, chainId })
	const bundle = createRescueBundle([funding, sweep, transaction])
	const blockInfo = { blockNumber: 1n, baseFee: 1n, priorityFee: 1n }
	const fundingAmount = bundle.totalGas * 3n + bundle.inputValue
	const transactions = await createBundleTransactions(bundle, {
		burner,
		burnerBalance: fundingAmount,
		bundleSigners: { [authority.address]: authority },
	}, blockInfo, 1n, fundingAmount, {
		send: async () => ({ payload: [{ from: authority.address }] }),
		getTransactionCount: async () => 4,
	})

	assert.equal(transactions[1].signer.address, burner.address)
	assert.equal(transactions[1].transaction.value, fundingAmount - (transaction.gasLimit + funding.gasLimit) * 3n)
})

test('signs the complete rescue sequence with the funding wallet as clear sponsor', async () => {
	const transaction = createClearDelegationTransaction({ authority: authority.address, chainId })
	const bundle = createRescueBundle(ensureDelegationClearFunding([transaction, sweep]))
	const blockInfo = { blockNumber: 1n, baseFee: 1n, priorityFee: 1n }
	const fundingAmount = bundle.totalGas * 3n + bundle.inputValue
	const provider = {
		send: async () => ({ payload: [{ from: authority.address }] }),
		getTransactionCount: async (address) => {
			if (address === burner.address) return 2
			if (address === authority.address) return 4
			throw new Error(`Unexpected account ${address}`)
		},
	}
	const transactions = await createBundleTransactions(bundle, {
		burner,
		burnerBalance: fundingAmount,
		bundleSigners: { [authority.address]: authority },
	}, blockInfo, 1n, fundingAmount, provider)
	const signed = await getRawTransactionsAndCalculateFeesAndNonces(transactions, provider, blockInfo, 2n)
	const clear = Transaction.from(signed[0].rawTransaction)

	assert.equal(clear.from, burner.address)
	assert.equal(clear.nonce, 2)
	assert.equal(clear.authorizationList[0].nonce, 3n)
	assert.equal(verifyAuthorization(clear.authorizationList[0], clear.authorizationList[0].signature), authority.address)
	assert.equal(signed[1].transaction.nonce, 3)
	assert.equal(signed[1].transaction.value, sweep.gasLimit * 3n)
	assert.equal(signed[2].transaction.nonce, 4)
})

test('rejects using the compromised account as its own funding sponsor', async () => {
	const transaction = createClearDelegationTransaction({ authority: authority.address, chainId })
	const bundle = createRescueBundle([funding, sweep, transaction])
	await assert.rejects(createBundleTransactions(bundle, {
		burner: authority,
		burnerBalance: 100000000000000000n,
		bundleSigners: { [authority.address]: authority },
	}, { blockNumber: 1n, baseFee: 1n, priorityFee: 1n }, 1n, 10000000000000000n, {
		send: async () => ({ payload: [{ from: authority.address }] }),
		getTransactionCount: async () => 4,
	}), /funding wallet must be different/)
})

test('detects active EIP-7702 delegation bytecode and rejects ordinary code', async () => {
	const target = Wallet.createRandom().address
	const delegationCode = `0xef0100${target.slice(2).toLowerCase()}`
	assert.equal(parseEip7702DelegationTarget(delegationCode), target)
	assert.equal(parseEip7702DelegationTarget('0x'), undefined)
	assert.equal(parseEip7702DelegationTarget('0x60006000'), undefined)
	assert.equal(await getActiveEip7702DelegationTarget({ getCode: async () => delegationCode }, authority.address), target)
	assert.equal(await getActiveEip7702DelegationTarget({ getCode: async () => '0x' }, authority.address), undefined)
})

test('loads the authorization nonce from before the Interceptor simulation stack', async () => {
	const provider = {
		send: async () => ({ payload: [{ from: authority.address }] }),
		getTransactionCount: async () => 4,
	}
	assert.equal(await getTransactionCountBeforeSimulation(provider, authority.address), 3)
	await assert.rejects(
		getTransactionCountBeforeSimulation({ ...provider, send: async () => { throw new Error('stack denied') } }, authority.address),
		/stack denied/,
	)
})

test('detects simulated funding when the next transaction is sponsored by a different account', () => {
	const makeRich = { ...funding, from: asAddress(burner.address), value: 200000n * 10n ** 18n }
	const marked = markSyntheticFunding([makeRich, clearDelegation, sweep])
	assert.equal(marked[0].from, 'FUNDING')
})

test('imports the Interceptor 1.0.1 type-4 wire payload without losing authorization data', () => {
	const payload = GetSimulationStackReply.parse([{
		type: '0x4',
		from: sponsor.address,
		to: authority.address,
		nonce: '0x7',
		maxFeePerGas: '0x2',
		maxPriorityFeePerGas: '0x1',
		gas: '0x186a0',
		value: '0x0',
		input: '0x',
		chainId: '0xaa36a7',
		accessList: [],
		authorizationList: [{
			chainId: '0xaa36a7',
			address: '0x0000000000000000000000000000000000000000',
			nonce: '0x3',
			authority: authority.address,
			yParity: '0x0',
			r: '0x1',
			s: '0x2',
		}],
		statusCode: 1,
		gasSpent: '0x5208',
		returnValue: '0x',
		events: [],
		balanceChanges: [],
		realizedGasPrice: '0x2',
		gasLimit: '0x186a0',
	}])
	const [transaction] = convertInterceptorTransactions(payload)
	assert.equal(transaction.type, '7702')
	assert.equal(transaction.authorizationList[0].authority, asAddress(authority.address))
	assert.equal(transaction.authorizationList[0].r, 1n)
})

test('rejects unsafe or malformed rescue authorizations', () => {
	const bundle = createRescueBundle([clearDelegation, funding, sweep])
	assert.equal(validateBundle({ ...bundle, transactions: [funding, clearDelegation, sweep] }), 'The delegation-clearing transaction must be first.')
	const malformed = createBundle([{ ...clearDelegation, authorizationList: [{ ...clearDelegation.authorizationList[0], r: 1n }] }])
	assert.equal(validateBundle(malformed), 'An EIP-7702 authorization has an incomplete signature.')
})

test('signs a sponsored type-4 clear and advances the authority nonce before its sweep', async () => {
	const bundle = createRescueBundle([funding, sweep, clearDelegation])
	const signers = {
		burner,
		burnerBalance: 100000000000000000n,
		bundleSigners: {
			[sponsor.address]: sponsor,
			[authority.address]: authority,
		},
	}
	const blockInfo = { blockNumber: 1n, baseFee: 1n, priorityFee: 1n }
	const provider = {
		send: async () => ({ payload: [] }),
		getTransactionCount: async (address) => {
			if (address === sponsor.address) return 7
			if (address === burner.address) return 2
			if (address === authority.address) return 3
			throw new Error(`Unexpected account ${address}`)
		},
	}
	const transactions = await createBundleTransactions(bundle, signers, blockInfo, 1n, 10000000000000000n, provider)
	const signed = await getRawTransactionsAndCalculateFeesAndNonces(transactions, provider, blockInfo, 2n)
	const clear = Transaction.from(signed[0].rawTransaction)
	assert.equal(clear.type, 4)
	assert.equal(clear.from, sponsor.address)
	assert.equal(clear.authorizationList.length, 1)
	assert.equal(verifyAuthorization(clear.authorizationList[0], clear.authorizationList[0].signature), authority.address)
	assert.equal(signed[2].transaction.nonce, 4)
})

test('preserves imported authorization signatures without requiring the authority key', async () => {
	const authorization = await authority.authorize({ address: '0x0000000000000000000000000000000000000000', chainId, nonce: 3n })
	const signedClear = {
		...clearDelegation,
		authorizationList: [{
			chainId: authorization.chainId,
			address: BigInt(authorization.address),
			nonce: authorization.nonce,
			r: BigInt(authorization.signature.r),
			s: BigInt(authorization.signature.s),
			yParity: authorization.signature.yParity === 0 ? 'even' : 'odd',
		}],
	}
	const bundle = createBundle([signedClear])
	assert.deepEqual(bundle.uniqueSigners, [sponsor.address])
	const [transaction] = await createBundleTransactions(bundle, {
		burner: undefined,
		burnerBalance: 0n,
		bundleSigners: { [sponsor.address]: sponsor },
	}, { blockNumber: 1n, baseFee: 1n, priorityFee: 1n }, 1n, 0n, {
		send: async () => ({ payload: [] }),
		getTransactionCount: async () => 0,
	})
	assert.equal(verifyAuthorization(transaction.transaction.authorizationList[0], transaction.transaction.authorizationList[0].signature), authority.address)
})
