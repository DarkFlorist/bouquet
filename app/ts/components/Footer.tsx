export const Footer = () => (
	<footer className='mt-auto w-full'>
		<div className='flex flex-col sm:flex-row w-full gap-6 justify-around items-center'>
			<div className='flex flex-col gap-2'>
				<h2 className='font-semibold'>Contact</h2>
				<a href='https://discord.com/invite/aCSKcvf5VW' target='_blank' className='hover:underline text-gray-500'>Discord</a>
				<a href='https://twitter.com/DarkFlorist' target='_blank' className='hover:underline text-gray-500'>Twitter</a>
				<a href='https://github.com/DarkFlorist/bouquet' target='_blank' className='hover:underline text-gray-500'>Github</a>
			</div>
			<div className='flex flex-col gap-2'>
				<h2 className='font-semibold'>Our other tools</h2>
				<a href='https://dark.florist/' className='hover:underline text-gray-500'>The Interceptor</a>
				<a href='https://lunaria.dark.florist/' className='hover:underline text-gray-500'>Lunaria</a>
				<a href='https://nftsender.dark.florist/' className='hover:underline text-gray-500'>NFT Sender</a>
			</div>
		</div>
		<div className='font-xs py-8 sm:py-6 flex items-center justify-center'><p className='hidden sm:block'>💐 Bouquet by <a href='https://dark.florist' className='hover:underline'>DarkFlorist</a></p></div>
	</footer>
)
