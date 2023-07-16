import { Signal, useComputed, useSignal } from '@preact/signals'
import { formatUnits } from 'ethers'
import { MEV_RELAY_GOERLI, MEV_RELAY_MAINNET } from '../constants.js'
import { ProviderStore } from '../library/provider.js'
import { EthereumAddress } from '../types/ethereumTypes.js'
import { AppSettings, BlockInfo, serialize } from '../types/types.js'
import { Blockie } from './Blockie.js'
import { SettingsIcon, SettingsModal } from './Settings.js'

export const Navbar = ({
	blockInfo,
	provider,
	appSettings
}: {
	blockInfo: Signal<BlockInfo>,
	provider: Signal<ProviderStore | undefined>,
	appSettings: Signal<AppSettings>
}) => {
	const switchNetwork = async (e: Event) => {
		const elm = e.target as HTMLSelectElement
		const relayEndpoint = elm.value
		if (!provider.value) {
			appSettings.value = { ...appSettings.peek(), relayEndpoint }
		} else {
			provider.peek()?.provider.send('wallet_switchEthereumChain', [{ chainId: relayEndpoint === MEV_RELAY_MAINNET ? '0x1' : '0x5' }])
		}
	}

	const blockieScale = useSignal(5)
	const showSettings = useSignal(false)
	const walletAddress = useComputed(() => provider.value?.walletAddress ?? 0n)

	return (
		<div className='flex flex-col w-full sm:flex-row items-center justify-between gap-4 border-slate-400/30'>
			<h1 className='font-extrabold text-4xl'>💐</h1>
			<div className='flex gap-4 items-center justify-center w-min max-w-full px-4 sm:px-0 text-sm sm:text-md'>
				{provider.value ? (
					<>
						<div className='flex flex-col items-end justify-around h-max w-full'>
							<p className='font-bold text-right w-min max-w-full truncate'>{serialize(EthereumAddress, provider.value.walletAddress)}</p>
							<span className='text-gray-400 text-md w-max flex gap-1 items-center'>
								<svg width='1em' height='1em' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg' className='inline-block'><path fill='currentColor' d='M44 32h-2v-8a2 2 0 0 0-2-2H26v-6h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2v6H8a2 2 0 0 0-2 2v8H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2v-6h12v6h-2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2v-6h12v6h-2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-34 8H6v-4h4ZM22 8h4v4h-4Zm4 32h-4v-4h4Zm16 0h-4v-4h4Z' data-name='icons Q2'></path></svg>
								<select
									value={appSettings.value.relayEndpoint}
									onChange={switchNetwork}
									className='px-2 py-1 bg-black'
								>
									<option value={MEV_RELAY_MAINNET}>Ethereum</option>
									<option value={MEV_RELAY_GOERLI}>Goerli</option>
									{appSettings.value.relayEndpoint !== MEV_RELAY_MAINNET && appSettings.value.relayEndpoint !== MEV_RELAY_GOERLI ?
										<option value={appSettings.value.relayEndpoint}>Custom</option>
										: null}
								</select>
							</span>
						</div >
						<Blockie address={walletAddress} scale={blockieScale} />
												<div className='flex flex-col gap-1'>
							<span className='flex items-center gap-2 w-max'>
								<svg
									className='inline-block h-4'
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
							<span className='flex items-center gap-2 w-max'>
								<svg
									className='h-4'
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
								{Number(formatUnits(blockInfo.value.baseFee, 'gwei')).toLocaleString('en-us')} gwei
							</span>
						</div>
					</>
				) : (
					<>
						<p className='w-max'>No Wallet Connected</p>
					</>
				)}
				<button class='hover:rotate-45 duration-200' onClick={() => (showSettings.value = true)}>
					<SettingsIcon />
				</button>
			</div>
			<SettingsModal display={showSettings} appSettings={appSettings} />
		</div>
	)
}
