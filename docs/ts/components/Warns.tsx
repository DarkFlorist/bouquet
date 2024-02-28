import { JSX } from 'preact/jsx-runtime'

export const SingleNotice = ({ variant, title, description }: { variant: 'warn' | 'error' | 'success', title: string, description?: string | JSX.Element }) => {
	const variantColors = {
		warn: 'border-orange-400/50 bg-orange-400/10',
		error: 'border-red-400/50 bg-red-400/10',
		success: 'border-green-400/50 bg-green-400/10'
	}
	const variantEmoji = {
		warn: '⚠',
		error: '🛑',
		success: '🎉'
	}

	return (<div class={`flex items-center items-center border ${variantColors[variant]} px-4 py-2 gap-4`}>
		<span class='text-2xl'>{variantEmoji[variant]}</span>
		<div class='py-3 flex-grow'>
			<h3 class='font-lg font-semibold'>{title}</h3>
			{description ? (<div class='leading-tight text-white/75 break-all text-sm'>{description}</div>) : null}
		</div>
	</div>)
}
