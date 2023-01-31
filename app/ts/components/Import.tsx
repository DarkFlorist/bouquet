import { useState } from 'preact/hooks'
import { importFromInterceptor } from '../library/import.js'
import { Button } from './Button.js'

export const Import = () => {
	const [error, setError] = useState<string | undefined>(undefined)

	return (
		<article className='p-6 max-w-screen-lg w-full flex flex-col gap-6'>
			<h2 className='font-extrabold text-3xl'>Import Transaction Payload</h2>
			<div className='flex flex-col w-full gap-6'>
				<Button
					onClick={() =>
						importFromInterceptor().catch((err: Error) => setError(err.message))
					}
				>
					Import Payload from The Interceptor
				</Button>
				{error ? <span>{error}</span> : ''}
				{error &&
				error ===
					'Import Error: Wallet does not support returning simulations' ? (
					<h3 className='text-xl'>
						Don't have The Interceptor Installed? Install it here{' '}
						<a
							className='font-bold hover:underline'
							href='https://dark.florist'
						>
							here
						</a>
						.
					</h3>
				) : (
					''
				)}
			</div>
		</article>
	)
}
