import { Import } from './Import.js'
import { Submit } from './Submit.js'
import { Button } from './Button.js'
import { Transactions } from './Transactions.js'
import { connectBrowserProvider } from '../library/provider.js'
import { Navbar } from './Navbar.js'
import { createGlobalState } from '../stores.js'
import { Footer } from './Footer.js'
import { ConfigureKeys } from './ConfigureKeys.js'
import { ConfigureFunding } from './ConfigureFunding.js'

export function App() {
	const state = createGlobalState()

	return (
		<main class='bg-black text-primary w-screen max-w-screen overflow-hidden min-h-screen sm:p-4 p-6 gap-4 font-serif flex flex-col items-center max-w-screen-xl'>
				<Navbar {...state} />
				<div className='p-4 mt-4 flex flex-col gap-8 w-full'>
					{!state.provider.value ? (
						<article className='items-center flex flex-col gap-4 py-8'>
							<h2 class='text-2xl font-bold'>Welcome Back</h2>
							<Button
								onClick={() => connectBrowserProvider(state.provider, state.blockInfo, state.bundle.peek()?.containsFundingTx ? state.signers : undefined, state.appSettings)}
							>
								Connect Wallet
							</Button>
						</article>
					) : (
						<>
							<Import {...state} />
							{state.bundle.value ? <Transactions {...state} /> : null}
							<h2 className='font-bold text-2xl'><span class='text-gray-500'>2.</span> Configure</h2>
							{state.bundle.value ? (<><ConfigureKeys {...state} /><ConfigureFunding {...state} /></>) : <p>No transactions imported yet.</p>}
							<Submit {...state} />
						</>
					)}
				</div>
			<Footer />
		</main>
	)
}
