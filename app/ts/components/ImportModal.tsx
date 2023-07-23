import { Signal, useComputed, useSignal } from "@preact/signals"
import { getAddress } from "ethers"
import { JSX } from "preact/jsx-runtime"
import { TransactionList } from "../types/bouquetTypes.js"
import { EthereumAddress } from "../types/ethereumTypes.js"
import { Bundle, serialize } from "../types/types.js"
import { Button } from "./Button.js"

const placeholder = `[
  {
    "from": "0xb3cd36cfaa07652dbfecca76f438ff8998a4f539",
    "to": "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6",
    "value": "0x16345785d8a0000",
    "input": "0xd0e30db0",
    "chainId": "0x1",
    "gasLimit": "0x15f90"
  },
  {
    "from": "0xb3cd36cfaa07652dbfecca76f438ff8998a4f539",
    "to": "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6",
    "value": "0x0",
    "input": "0x2e1a7d4d000000000000000000000000000000000000000000000000016345785d8a0000",
    "chainId": "0x1",
    "gasLimit": "0x15f90"
  }
]`

export const ImportModal = ({ display, bundle, clearError }: { display: Signal<boolean>, clearError: () => void, bundle: Signal<Bundle | undefined> }) => {
	const jsonInput = useSignal<string>('')

	const isValid = useComputed(() => {
		if (!jsonInput.value) return false
		try {
			const { success } = TransactionList.safeParse(JSON.parse(jsonInput.value))
			return success
		} catch {
			return false
		}
	})

	function importJson() {
		if (!isValid.peek()) return
		const txList = TransactionList.parse(JSON.parse(jsonInput.value))

		localStorage.setItem('payload', JSON.stringify(TransactionList.serialize(txList)))

		const uniqueToAddresses = [...new Set(txList.map(({ from }) => from))]
		const containsFundingTx = uniqueToAddresses.includes('FUNDING')
		const uniqueSigners = uniqueToAddresses.filter((address): address is EthereumAddress => address !== 'FUNDING').map(address => getAddress(serialize(EthereumAddress, address)))

		const totalGas = txList.reduce((sum, tx) => tx.gasLimit + sum, 0n)
		const inputValue = txList.reduce((sum, tx) => (tx.from === 'FUNDING' ? tx.value : 0n) + sum, 0n)

		bundle.value = { transactions: txList, containsFundingTx, uniqueSigners, totalGas, inputValue }
		clearError()
		close()
	}

	function close() {
		jsonInput.value = ''
		display.value = false
	}
	return display.value ? (
		<div onClick={close} className='bg-white/10 w-full h-full inset-0 fixed p-4 flex flex-col items-center md:pt-24'>
			<div class='h-max px-8 py-4 flex flex-col gap-4 bg-black' onClick={(e) => e.stopPropagation()}>
				<h2 className='text-xl font-semibold'>Import Transactions From JSON</h2>
				<div>
					<textarea
						placeholder={placeholder}
						onInput={(e: JSX.TargetedEvent<HTMLTextAreaElement>) => jsonInput.value = e.currentTarget.value}
						value={jsonInput.value}
						type="url"
						className={`p-2 w-96 h-96 border ${jsonInput.value && isValid.value ? 'border-green-400' : jsonInput.value && !isValid.value ? 'border-red-400' : 'border-white/50 focus-within:border-white/90'} bg-transparent outline-none focus-within:bg-white/5 px-4`}
					/>
				</div>
				<div className='flex gap-2'>
					<Button onClick={importJson} disabled={!isValid.value} variant='primary'>Import</Button>
				</div>
			</div>
		</div>
	) : null
}
