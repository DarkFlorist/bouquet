import { Signal, useComputed, useSignal } from '@preact/signals'
import { ProviderStore } from '../library/provider.js'
import { EthereumAddress } from '../types/ethereumTypes.js'
import { BlockInfo, Bundle, serialize, Signers } from '../types/types.js'
import { Blockie } from './Blockie.js'
import { SettingsIcon, SettingsModal } from './Settings.js'
import { Button } from './Button.js'
import { importFromInterceptor } from './Import.js'
import { BouquetSettings } from '../types/bouquetTypes.js'
import { getNetwork } from '../constants.js'

export const Navbar = ({
	provider,
	bouquetSettings,
	blockInfo,
	bundle,
	signers
}: {
	provider: Signal<ProviderStore | undefined>,
	blockInfo: Signal<BlockInfo>,
	bouquetSettings: Signal<BouquetSettings>,
	bundle: Signal<Bundle | undefined>,
	signers: Signal<Signers>,
}) => {
	const switchNetwork = async (e: Event) => {
		const elm = e.target as HTMLSelectElement
		provider.peek()?.provider.send('wallet_switchEthereumChain', [{ chainId: `0x${ BigInt(elm.value).toString(16) }` }])
	}

	const blockieScale = useSignal(5)
	const showSettings = useSignal(false)
	const walletAddress = useComputed(() => provider.value?.walletAddress ?? 0n)
	//const bouquetNetwork = useSignal(getNetwork(bouquetSettings.value, provider.value?.chainId || 1n))
	const bouquetNetwork = useComputed(() => getNetwork(bouquetSettings.value, provider.value?.chainId || 1n))
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
									value={provider.value.chainId.toString()}
									onChange={switchNetwork}
									className='px-2 py-1 bg-black'
								>
									{bouquetSettings.value.map((network) => <option value={network.chainId.toString()}>{ network.networkName }</option>)}
								</select>
							</span>
						</div >
						<Blockie address={walletAddress} scale={blockieScale} />
					</>
				) : (!provider.value && bundle.value ? <p className='w-max'> No Wallet Connected </p> :
					<div className='w-max'>
						<Button onClick={() => importFromInterceptor(bundle, provider, blockInfo, signers, bouquetSettings)} >
							Connect Wallet
						</Button>
					</div>
				)}
				<button class='hover:rotate-45 duration-200 ml-2' onClick={() => (showSettings.value = true)}>
					<SettingsIcon />
				</button>
			</div>
			<SettingsModal display={showSettings} bouquetNetwork={bouquetNetwork} bouquetSettings = {bouquetSettings}/>
		</div>
	)
}
