import assert from 'node:assert/strict'
import test from 'node:test'
import { Transaction, Wallet, verifyAuthorization } from 'ethers'
import { createBundleTransactions, getRawTransactionsAndCalculateFeesAndNonces, getTransactionCountBeforeSimulation } from '../app/js/library/bundleUtils.js'
import { createBundle } from '../app/js/library/bundle.js'
import { createClearDelegationTransaction, createRescueBundle, getActiveEip7702DelegationTarget, isClearDelegationTransaction, parseEip7702DelegationTarget, validateBundle } from '../app/js/library/rescue.js'
import { convertInterceptorTransactions, markSyntheticFunding, requestInterceptorStackAfterConnection, simulationStackRequestError } from '../app/js/library/interceptorImport.js'
import { GetSimulationStackReply } from '../app/js/types/interceptorTypes.js'

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

test('creates a safe unsigned delegation-clearing transaction for later signing', async () => {
	const transaction = createClearDelegationTransaction({
		sponsor: sponsor.address,
		authority: authority.address,
		chainId,
		authorizationNonce: 3n,
	})
	assert.equal(transaction.type, '7702')
	assert.equal(transaction.from, asAddress(sponsor.address))
	assert.equal(transaction.to, asAddress(sponsor.address))
	assert.equal(transaction.authorizationList[0].authority, asAddress(authority.address))
	assert.equal(transaction.authorizationList[0].address, 0n)
	assert.equal(transaction.authorizationList[0].nonce, 3n)
	const createdBundle = createRescueBundle([funding, sweep, transaction])
	assert.equal(validateBundle(createdBundle), undefined)
	const [signedClear] = await createBundleTransactions(createdBundle, {
		burner,
		burnerBalance: 100000000000000000n,
		bundleSigners: { [sponsor.address]: sponsor, [authority.address]: authority },
	}, { blockNumber: 1n, baseFee: 1n, priorityFee: 1n }, 1n, 10000000000000000n)
	assert.equal(verifyAuthorization(signedClear.transaction.authorizationList[0], signedClear.transaction.authorizationList[0].signature), authority.address)
	assert.equal(signedClear.transaction.authorizationList[0].address, '0x0000000000000000000000000000000000000000')
	assert.throws(() => createClearDelegationTransaction({
		sponsor: authority.address,
		authority: authority.address,
		chainId,
		authorizationNonce: 3n,
	}), /sponsor must be different/)
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
	const transactions = await createBundleTransactions(bundle, signers, blockInfo, 1n, 10000000000000000n)
	const provider = {
		send: async () => ({ payload: [] }),
		getTransactionCount: async (address) => {
			if (address === sponsor.address) return 7
			if (address === burner.address) return 2
			if (address === authority.address) return 3
			throw new Error(`Unexpected account ${address}`)
		},
	}
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
	}, { blockNumber: 1n, baseFee: 1n, priorityFee: 1n }, 1n, 0n)
	assert.equal(verifyAuthorization(transaction.transaction.authorizationList[0], transaction.transaction.authorizationList[0].signature), authority.address)
})
