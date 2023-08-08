import { ComponentChildren } from 'preact'

const classNames = {
	primary: 'h-12 px-4 border border-white/50 bg-gray-500/50 outline-none focus:border-white/90 focus:bg-gray-500/20 flex items-center gap-2 justify-center',
	secondary: 'h-12 px-4 border border-white/50 bg-black outline-none focus:border-white/90 focus:bg-gray-500/20 text-white flex items-center gap-2 justify-center',
	full: 'px-4 h-16 border border-white/50 text-lg bg-white/10 flex items-center gap-2 justify-center outline-none focus:border-white/90 focus:bg-gray-500 disabled:opacity-50'
}

export const Button = ({
	children,
	disabled,
	variant,
	onClick,
}: {
	children: ComponentChildren,
	disabled?: boolean
	variant?: 'primary' | 'secondary' | 'full'
	onClick: () => unknown
}) => {
	return (
		<button onClick={onClick} disabled={disabled ?? false} className={classNames[variant ?? 'primary']} >
			{children}
		</button>
	)
}
