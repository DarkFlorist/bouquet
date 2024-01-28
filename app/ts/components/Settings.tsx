import { batch, Signal, useComputed, useSignal } from '@preact/signals'
import { formatUnits, parseUnits } from 'ethers'
import { JSX } from 'preact/jsx-runtime'
import { NETWORKS } from '../constants.js'
import { AppSettings } from '../types/types.js'
import { Button } from './Button.js'

export const SettingsIcon = () => {
	return (
		<svg
			class='text-white h-8 w-8'
			aria-hidden='true'
			fill='none'
			stroke='currentColor'
			strokeWidth={1.5}
			viewBox='0 0 24 24'
			xmlns='http://www.w3.org/2000/svg'
		>
			<path
				d='M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z'
				strokeLinecap='round'
				strokeLinejoin='round'
			/>
			<path d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' strokeLinecap='round' strokeLinejoin='round' />
		</svg>
	)
}

export const SettingsModal = ({ display, appSettings }: { display: Signal<boolean>, appSettings: Signal<AppSettings> }) => {
	const simulationRelayEndpointInput = useSignal({ value: appSettings.peek().simulationRelayEndpoint, valid: true })
	const submissionRelayEndpointInput = useSignal({ value: appSettings.peek().submissionRelayEndpoint, valid: true })
	const priorityFeeInput = useSignal({ value: formatUnits(appSettings.peek().priorityFee, 'gwei'), valid: true })
	const blocksInFutureInput = useSignal({ value: appSettings.peek().blocksInFuture.toString(10), valid: true })

	const allValidInputs = useComputed(() => submissionRelayEndpointInput.value.valid && simulationRelayEndpointInput.value.valid && priorityFeeInput.value.valid && blocksInFutureInput.value.valid)

	// https://urlregex.com/
	const matchUrl = (value: string) => value.match(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/g)

	function validateSimulationRelayEndpointInput(value: string) {
		const matched = matchUrl(value)
		simulationRelayEndpointInput.value = { value, valid: !value || !matched || matched.length !== 1 }
	}
	function validateAndSetsubmissionRelayEndpointInput(value: string) {
		const matched = matchUrl(value)
		submissionRelayEndpointInput.value = { value, valid: !value || !matched || matched.length !== 1 }
	}

	function validateAndSetPriorityFeeInput(value: string) {
		if (!value) return priorityFeeInput.value = { value, valid: false }
		try {
			parseUnits(String(Number(value)), 'gwei');
			return priorityFeeInput.value = { value, valid: true }
		} catch {
			return priorityFeeInput.value = { value, valid: false }
		}
	}
	function validateBlocksInFutureInput(value: string) {
		if (!value) return blocksInFutureInput.value = { value, valid: false }
		try {
			BigInt(value)
			return blocksInFutureInput.value = { value, valid: true }
		} catch {
			return blocksInFutureInput.value = { value, valid: false }
		}
	}
	function saveSettings() {
		if (allValidInputs.value) {
			const newSettings: AppSettings = { submissionRelayEndpoint: submissionRelayEndpointInput.value.value, simulationRelayEndpoint: simulationRelayEndpointInput.value.value, priorityFee: parseUnits(String(Number(priorityFeeInput.value.value)), 'gwei'), blocksInFuture: BigInt(blocksInFutureInput.value.value) }
			appSettings.value = newSettings
			localStorage.setItem('bouquetSettings', JSON.stringify({
				priorityFee: newSettings.priorityFee.toString(),
				blocksInFuture: newSettings.blocksInFuture.toString(),
				simulationRelayEndpoint: newSettings.simulationRelayEndpoint,
				submissionRelayEndpoint: newSettings.submissionRelayEndpoint,
			}))
			close()
		}
	}
	function resetSettings() {
		batch(() => {
			appSettings.value = { blocksInFuture: 3n, priorityFee: 10n ** 9n * 3n, simulationRelayEndpoint: NETWORKS['1'].simulationRelay, submissionRelayEndpoint: NETWORKS['1'].submissionRelay };
			localStorage.setItem('bouquetSettings', JSON.stringify({
				priorityFee: appSettings.value.priorityFee.toString(),
				blocksInFuture: appSettings.value.blocksInFuture.toString(),
				simulationRelayEndpoint: appSettings.value.simulationRelayEndpoint,
				submissionRelayEndpoint: appSettings.value.submissionRelayEndpoint,
			}))
			simulationRelayEndpointInput.value = { value: appSettings.peek().simulationRelayEndpoint, valid: true }
			submissionRelayEndpointInput.value = { value: appSettings.peek().submissionRelayEndpoint, valid: true }
			priorityFeeInput.value = { value: formatUnits(appSettings.peek().priorityFee, 'gwei'), valid: true }
			blocksInFutureInput.value = { value: appSettings.peek().blocksInFuture.toString(10), valid: true }
		})
	}
	function close() {
		batch(() => {
			simulationRelayEndpointInput.value = { value: appSettings.peek().simulationRelayEndpoint, valid: true }
			submissionRelayEndpointInput.value = { value: appSettings.peek().submissionRelayEndpoint, valid: true }
			priorityFeeInput.value = { value: formatUnits(appSettings.peek().priorityFee, 'gwei'), valid: true }
			blocksInFutureInput.value = { value: appSettings.peek().blocksInFuture.toString(10), valid: true }
			display.value = false
		})
	}
	return display.value ? (
		<div onClick={close} className='bg-white/10 w-full h-full inset-0 fixed p-4 flex flex-col items-center md:pt-24'>
			<div class='h-max px-8 py-4 w-full max-w-xl flex flex-col gap-4 bg-black' onClick={(e) => e.stopPropagation()}>
				<h2 className='text-xl font-semibold'>App Settings</h2>
				<div className={`flex flex-col justify-center border h-16 outline-none px-4 focus-within:bg-white/5 bg-transparent ${!simulationRelayEndpointInput.value.valid ? 'border-red-400' : 'border-white/50 focus-within:border-white/80'}`}>
					<span className='text-sm text-gray-500'>Bundle Simulation Relay URL</span>
					<input onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => validateSimulationRelayEndpointInput(e.currentTarget.value)} value={simulationRelayEndpointInput.value.value} type='text' className='bg-transparent outline-none placeholder:text-gray-600' placeholder='https://' />
				</div>
				<div className={`flex flex-col justify-center border h-16 outline-none px-4 focus-within:bg-white/5 bg-transparent ${!submissionRelayEndpointInput.value.valid ? 'border-red-400' : 'border-white/50 focus-within:border-white/80'}`}>
					<span className='text-sm text-gray-500'>Bundle Submit Relay URL</span>
					<input onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => validateAndSetsubmissionRelayEndpointInput(e.currentTarget.value)} value={submissionRelayEndpointInput.value.value} type='text' className='bg-transparent outline-none placeholder:text-gray-600' placeholder='https://' />
				</div>
				<div className={`flex flex-col justify-center border h-16 outline-none px-4 focus-within:bg-white/5 bg-transparent ${!priorityFeeInput.value.valid ? 'border-red-400' : 'border-white/50 focus-within:border-white/80'}`}>
					<span className='text-sm text-gray-500'>Priority Fee (GWEI)</span>
					<input onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => validateAndSetPriorityFeeInput(e.currentTarget.value)} value={priorityFeeInput.value.value} type='number' className='bg-transparent outline-none placeholder:text-gray-600' placeholder='0.1' />
				</div>
				<div className={`flex flex-col justify-center border h-16 outline-none px-4 focus-within:bg-white/5 bg-transparent ${!blocksInFutureInput.value.valid ? 'border-red-400' : 'border-white/50 focus-within:border-white/80'}`}>
					<span className='text-sm text-gray-500'>Target Blocks In Future For Bundle Confirmation</span>
					<input onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => validateBlocksInFutureInput(e.currentTarget.value)} value={blocksInFutureInput.value.value} type='number' className='bg-transparent outline-none placeholder:text-gray-600' />
				</div>
				<div className='flex gap-2'>
					<Button onClick={saveSettings} disabled={!allValidInputs.value} variant='primary'>Save</Button>
					<Button onClick={resetSettings} variant='secondary'>Reset</Button>
				</div>
			</div>
		</div>
	) : null
}
