import { Signal } from '@preact/signals'
import { providers, utils } from 'ethers'
import { MEV_RELAY_GOERLI, MEV_RELAY_MAINNET } from '../constants.js'
import { AppSettings, BlockInfo } from '../library/types.js'

export const NetworkDetails = ({
	blockInfo,
	provider,
	appSettings,
}: {
	blockInfo: Signal<BlockInfo>
	provider: Signal<providers.Web3Provider | undefined>
	appSettings: Signal<AppSettings>
}) => {
	// @TODO: Manage disconnected wallets and listners
	const switchNetwork = async (e: Event) => {
		const elm = e.target as HTMLSelectElement
		const relayEndpoint = elm.value
		if (!provider.value) {
			appSettings.value = { ...appSettings.peek(), relayEndpoint }
		} else {
			try {
				await provider.peek()?.send('wallet_switchEthereumChain', [{ chainId: relayEndpoint === MEV_RELAY_MAINNET ? '0x1' : '0x5' }])
				const { chainId } = await provider.value.getNetwork()
				const block = await provider.peek()?.getBlockNumber()
				provider
					.peek()
					?._events.find((x) => x.tag === 'block')
					?.listener(block)
				if ([1, 5].includes(chainId)) {
					appSettings.value = { ...appSettings.peek(), relayEndpoint: chainId === 1 ? MEV_RELAY_MAINNET : MEV_RELAY_GOERLI }
				}
			} catch {
				const { chainId } = await provider.value.getNetwork()
				if ([1, 5].includes(chainId)) {
					appSettings.value = { ...appSettings.peek(), relayEndpoint: chainId === 1 ? MEV_RELAY_MAINNET : MEV_RELAY_GOERLI }
				}
			}
		}
	}

	return (
		<div className='flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-slate-400/30'>
			<h1 className='font-extrabold text-4xl'>💐</h1>
			<div class='flex flex-col sm:flex-row items-center gap-4'>
				<div className='flex flex-col sm:flex-row gap-4'>
					{provider.value ? (
						<>
							<span className='flex items-center gap-2'>
								<svg
									className='inline-block h-6'
									aria-hidden='true'
									fill='none'
									stroke='currentColor'
									stroke-width='1.5'
									viewBox='0 0 24 24'
									xmlns='http://www.w3.org/2000/svg'
								>
									<path
										d='M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9'
										stroke-linecap='round'
										stroke-linejoin='round'
									></path>
								</svg>{' '}
								{Number(blockInfo.value.blockNumber.toString()).toLocaleString('en-us')}
							</span>
							<span className='flex items-center gap-2'>
								<svg
									className='h-6'
									aria-hidden='true'
									fill='none'
									stroke='currentColor'
									stroke-width='1.5'
									viewBox='0 0 24 24'
									xmlns='http://www.w3.org/2000/svg'
								>
									<path
										d='M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z'
										stroke-linecap='round'
										stroke-linejoin='round'
									></path>
									<path
										d='M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z'
										stroke-linecap='round'
										stroke-linejoin='round'
									></path>
								</svg>
								Base {Number(utils.formatUnits(blockInfo.value.baseFee, 'gwei')).toLocaleString('en-us')} gwei
							</span>
						</>
					) : (
						<p>No Wallet Connected</p>
					)}
				</div>
				<div>
					<select
						value={appSettings.value.relayEndpoint}
						onChange={switchNetwork}
						className='px-4 py-2 rounded-xl border border-slate-200/70 border-2 bg-background'
					>
						<option value={MEV_RELAY_MAINNET}>Ethereum</option>
						<option value={MEV_RELAY_GOERLI}>Goerli</option>
					</select>
				</div>
			</div>
		</div>
	)
}
