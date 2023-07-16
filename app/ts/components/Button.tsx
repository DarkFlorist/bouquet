const classNames = {
	primary: 'h-12 px-4 border border-white/50 bg-white/20 outline-none focus:border-white/90 focus:bg-white/20',
	full: 'px-4 h-16 border border-white/50 text-lg bg-white/10 flex items-center gap-2 justify-center outline-none focus:border-white/90 focus:bg-white/20 disabled:opacity-50'
}

export const Button = ({
	children,
	disabled,
	variant,
	onClick,
}: {
	children: string
	disabled?: boolean
	variant?: 'primary' | 'full'
	onClick: () => unknown
}) => {
	return (
		<button onClick={onClick} disabled={disabled ?? false} className={classNames[variant ?? 'primary']} >
			{children}
		</button>
	)
}
