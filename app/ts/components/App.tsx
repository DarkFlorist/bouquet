import { Import } from './Import.js'
import { Configure } from './Configure.js'
import { Submit } from './Submit.js'
import { Button } from './Button.js'
import { Transactions } from './Transactions.js'
import { connectBrowserProvider } from '../library/provider.js'
import { Navbar } from './Navbar.js'
import { createGlobalState } from '../stores.js'

export function App() {
	const state = createGlobalState()

	return (
		<main class='bg-background text-primary w-full min-h-screen sm:px-6 font-serif flex flex-col items-center'>
			<article className='p-4 max-w-screen-lg w-full'>
				<Navbar {...state} />
				<div className='p-4 mt-4 flex flex-col gap-8'>
					{!state.provider.value && state.interceptorPayload.value ? (
						<article className='items-center flex flex-col gap-4 py-8'>
							<h2 class='text-2xl font-bold'>Welcome Back</h2>
							<Button
								onClick={() => connectBrowserProvider(state.provider, state.appSettings, state.blockInfo, state.interceptorPayload.peek()?.containsFundingTx ? state.signers : undefined)}
							>
								Connect Wallet
							</Button>
						</article>
					) : (
						<>
							<Import {...state} />
							{state.interceptorPayload.value ? <Transactions {...state} /> : null}
							<Configure {...state} />
							<Submit {...state} />
						</>
					)}
				</div>
			</article>
		</main>
	)
}
