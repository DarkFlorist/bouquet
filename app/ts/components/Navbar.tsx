import { Signal, useComputed, useSignal } from '@preact/signals'
import { NETWORKS } from '../constants.js'
import { ProviderStore } from '../library/provider.js'
import { EthereumAddress } from '../types/ethereumTypes.js'
import { AppSettings, serialize } from '../types/types.js'
import { Blockie } from './Blockie.js'
import { SettingsIcon, SettingsModal } from './Settings.js'

export const Navbar = ({
	provider,
	appSettings
}: {
	provider: Signal<ProviderStore | undefined>,
	appSettings: Signal<AppSettings>
}) => {
	const switchNetwork = async (e: Event) => {
		const elm = e.target as HTMLSelectElement
		const simulationRelayEndpoint = elm.value
		const submitRelayEndpoint = elm.value
		if (!provider.value) {
			appSettings.value = { ...appSettings.peek(), simulationRelayEndpoint, submitRelayEndpoint }
		} else {
			provider.peek()?.provider.send('wallet_switchEthereumChain', [{ chainId: simulationRelayEndpoint === NETWORKS['1'].simulationRelay ? '0x1' : '0x5' }])
		}
	}

	const blockieScale = useSignal(5)
	const showSettings = useSignal(false)
	const walletAddress = useComputed(() => provider.value?.walletAddress ?? 0n)

	return (
		<div className='flex flex-col w-full sm:flex-row items-center justify-between gap-4 border-slate-400/30 h-12'>
			<h1 className='font-extrabold text-4xl'>💐</h1>
			<div className='flex gap-4 items-center justify-center w-min max-w-full px-4 sm:px-0 text-sm sm:text-md'>
				{provider.value ? (
					<>
						<div className='flex flex-col items-end justify-around h-full w-full'>
							<p className='font-bold text-right w-min max-w-full truncate'>{serialize(EthereumAddress, provider.value.walletAddress)}</p>
							<span className='text-gray-500 text-md w-max flex gap-1 items-center'>
								<svg width='1em' height='1em' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg' className='inline-block'><path fill='currentColor' d='M44 32h-2v-8a2 2 0 0 0-2-2H26v-6h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2v6H8a2 2 0 0 0-2 2v8H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2v-6h12v6h-2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2v-6h12v6h-2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-34 8H6v-4h4ZM22 8h4v4h-4Zm4 32h-4v-4h4Zm16 0h-4v-4h4Z' data-name='icons Q2'></path></svg>
								<select
									value={appSettings.value.simulationRelayEndpoint}
									onChange={switchNetwork}
									className='px-2 py-1 bg-black'
								>
									<option value={NETWORKS['1'].simulationRelay}>Ethereum</option>
									<option value={NETWORKS['5'].simulationRelay}>Goerli</option>
									{appSettings.value.simulationRelayEndpoint !== NETWORKS['1'].simulationRelay && appSettings.value.simulationRelayEndpoint !== NETWORKS['5'].simulationRelay ?
										<option value={appSettings.value.simulationRelayEndpoint}>Custom</option>
										: null}
								</select>
							</span>
						</div >
						<Blockie address={walletAddress} scale={blockieScale} />
					</>
				) : (
					<>
						<p className='w-max'>No Wallet Connected</p>
					</>
				)}
				<button class='hover:rotate-45 duration-200 ml-2' onClick={() => (showSettings.value = true)}>
					<SettingsIcon />
				</button>
			</div>
			<SettingsModal display={showSettings} appSettings={appSettings} />
		</div>
	)
}
