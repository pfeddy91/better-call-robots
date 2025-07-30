import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			/* ==============================================
			   TYPOGRAPHY CONFIGURATION - Easily Configurable
			   ============================================== */
			fontFamily: {
				// Default sans-serif font (Noto Sans)
				'sans': ['Noto Sans', 'system-ui', '-apple-system', 'sans-serif'],
				// Primary font for UI elements, body text
				'primary': ['Noto Sans', 'system-ui', '-apple-system', 'sans-serif'],
				// Secondary font for headings, display text
				'secondary': ['Noto Sans', 'system-ui', 'sans-serif'],
				// Monospace font for code, technical content
				'mono': ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
			},

			fontSize: {
				// Configurable font sizes with line heights
				'display-xl': ['4rem', { lineHeight: '1.1', fontWeight: '800' }],      // 64px
				'display-lg': ['3.5rem', { lineHeight: '1.1', fontWeight: '700' }],    // 56px
				'display-md': ['3rem', { lineHeight: '1.15', fontWeight: '700' }],     // 48px
				'display-sm': ['2.5rem', { lineHeight: '1.2', fontWeight: '600' }],    // 40px
				
				'heading-xl': ['2.25rem', { lineHeight: '1.25', fontWeight: '600' }],  // 36px
				'heading-lg': ['2rem', { lineHeight: '1.3', fontWeight: '600' }],      // 32px
				'heading-md': ['1.75rem', { lineHeight: '1.35', fontWeight: '600' }],  // 28px
				'heading-sm': ['1.5rem', { lineHeight: '1.4', fontWeight: '500' }],    // 24px
				'heading-xs': ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],   // 20px
				
				'body-xl': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],     // 18px
				'body-lg': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],         // 16px
				'body-md': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],     // 14px
				'body-sm': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],    // 13px
				'body-xs': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],      // 12px
				
				'caption': ['0.6875rem', { lineHeight: '1.3', fontWeight: '400' }],    // 11px
				'overline': ['0.625rem', { lineHeight: '1.2', fontWeight: '500', letterSpacing: '0.08em' }], // 10px
			},

			fontWeight: {
				// Easily configurable font weights
				'light': '300',
				'normal': '400',
				'medium': '500',
				'semibold': '600',
				'bold': '700',
				'extrabold': '800',
			},

			letterSpacing: {
				// Typography letter spacing
				'tighter': '-0.02em',
				'tight': '-0.01em',
				'normal': '0em',
				'wide': '0.01em',
				'wider': '0.02em',
				'widest': '0.08em',
			},

			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-success': 'var(--gradient-success)'
			},
			boxShadow: {
				'elegant': 'var(--shadow-elegant)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
