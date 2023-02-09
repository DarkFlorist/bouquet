/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['../app/ts/**/*.(ts|tsx)'],
	theme: {
		extend: {
			colors: {
				background: '#16161D',
				primary: '#FFFFFC',
				secondary: '#757780',
				card: '#2e2f30',
				accent: '#6CCFF6',
				success: '#98CE00',
				error: '#DB5461',
			},
			fontFamily: {
				serif: ['Inter', 'sans-serif'],
			},
			keyframes: {
				scale: {
					'0%, 100%': {
						transform: 'scale(1.0)',
					},
					'50%': {
						transform: 'scale(0)',
					},
				},
			},
			animation: {
				scale: 'scale 2s infinite',
			},
		},
	},
	plugins: [],
}
