// module.exports = {
// 	content: ['../app/ts/**/*.(ts|tsx)'],
// 	theme: {},
// 	plugins: [],
// 	experimental: {
// 		optimizeUniversalDefaults: true,
// 	},
// 	corePlugins: {
// 		preflight: false,
// 	},
// }

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['../app/ts/**/*.(ts|tsx)'],
	theme: {
		extend: {
			colors: {
				background: '#16161D',
				primary: '#FFFFFC',
				secondary: '#757780',
				accent: '#6CCFF6',
				success: '#98CE00',
				error: '#DB5461',
			},
			fontFamily: {
				serif: ['Poppins', 'sans-serif'],
			},
		},
	},
	plugins: [],
}
