import { batch, Signal } from '@preact/signals'
import { providers, utils } from 'ethers'
import { useState } from 'preact/hooks'
import { updateLatestBlock } from '../library/provider.js'
import { GetSimulationStackReply, serialize, EthereumAddress } from '../library/interceptor-types.js'
import { Button } from './Button.js'
import { AppStages, BundleState } from '../library/types.js'

export async function importFromInterceptor(
	interceptorPayload: Signal<BundleState | undefined>,
	provider: Signal<providers.Web3Provider | undefined>,
	blockInfo: Signal<{
		blockNumber: bigint
		baseFee: bigint
		priorityFee: bigint
	}>,
	stage: Signal<AppStages>,
) {
	if (!window.ethereum || !window.ethereum.request) throw Error('Import Error: No Ethereum wallet detected')

	await window.ethereum.request({ method: 'eth_requestAccounts' }).catch((err: { code: number }) => {
		if (err.code === 4001) {
			throw new Error('Import Error: Wallet connection rejected')
		} else {
			throw new Error(`Unknown Error: ${JSON.stringify(err)}`)
		}
	})

	// We only support goerli right now
	const ethereumProvider = new providers.Web3Provider(window.ethereum, 'any')
	const { chainId } = await ethereumProvider.getNetwork()
	if (chainId !== 5) {
		await ethereumProvider.send('wallet_switchEthereumChain', [{ chainId: '0x5' }])
	}

	const blockCallback = (blockNumber: number) => {
		updateLatestBlock(blockNumber, provider, blockInfo)
	}

	const { payload } = await window.ethereum
		.request({
			method: 'interceptor_getSimulationStack',
			params: ['1.0.0'],
		})
		.catch((err: { code: number }) => {
			if (err?.code === -32601) {
				throw new Error('Import Error: Wallet does not support returning simulations')
			} else {
				throw new Error(`Unknown Error: ${JSON.stringify(err)}`)
			}
		})

	const parsed = GetSimulationStackReply.parse(payload)
	if (parsed.length === 0) throw new Error('Import Error: You have no transactions on your simulation')

	localStorage.setItem('payload', JSON.stringify(GetSimulationStackReply.serialize(parsed)))

	const containsFundingTx = parsed.length > 1 && parsed[0].to === parsed[1].from
	const uniqueSigners = [...new Set(parsed.map((x) => utils.getAddress(serialize(EthereumAddress, x.from))))].filter(
		(_, index) => !(index === 0 && containsFundingTx),
	)

	const totalGas = parsed.reduce((sum, tx, index) => (index === 0 && containsFundingTx ? 21000n : BigInt(tx.gasLimit.toString()) + sum), 0n)
	// // @TODO: Change this to track minimum amount of ETH needed to deposit
	const inputValue = parsed.reduce((sum, tx, index) => (index === 0 && containsFundingTx ? 0n : BigInt(tx.value.toString()) + sum), 0n)

	batch(() => {
		provider.value = ethereumProvider
		provider.value.on('block', blockCallback)

		interceptorPayload.value = { payload: parsed, containsFundingTx, uniqueSigners, totalGas, inputValue }
		stage.value = 'configure'
	})
}

export const Import = ({
	interceptorPayload,
	provider,
	blockInfo,
	stage,
}: {
	interceptorPayload: Signal<BundleState | undefined>
	provider: Signal<providers.Web3Provider | undefined>
	blockInfo: Signal<{
		blockNumber: bigint
		baseFee: bigint
		priorityFee: bigint
	}>
	stage: Signal<AppStages>
}) => {
	const [error, setError] = useState<string | undefined>(undefined)

	return (
		<>
			<h2 className='font-extrabold text-3xl'>Import Transaction Payload</h2>
			<div className='flex flex-col w-full gap-6'>
				<Button onClick={() => importFromInterceptor(interceptorPayload, provider, blockInfo, stage).catch((err: Error) => setError(err.message))}>
					Import Payload from The Interceptor
				</Button>
				{error ? <span>{error}</span> : ''}
				{error && error === 'Import Error: Wallet does not support returning simulations' ? (
					<h3 className='text-xl'>
						Don't have The Interceptor Installed? Install it here{' '}
						<a className='font-bold hover:underline' href='https://dark.florist'>
							here
						</a>
						.
					</h3>
				) : (
					''
				)}
			</div>
		</>
	)
}
