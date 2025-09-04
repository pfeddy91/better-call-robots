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
			   TYPOGRAPHY CONFIGURATION - Simplified 4-size system
			   ============================================== */
			fontFamily: {
				// Noto Sans for all text
				'sans': ['Noto Sans', 'system-ui', '-apple-system', 'sans-serif'],
				'primary': ['Noto Sans', 'system-ui', '-apple-system', 'sans-serif'],
				// Monospace for code only
				'mono': ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
			},

			fontSize: {
				// Simplified 4-size typography system
				'header': ['1.5rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.01em' }],     // 24px
				'sub-header': ['1.25rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: 'normal' }], // 20px
				'standard': ['1rem', { lineHeight: '1.6', fontWeight: '400', letterSpacing: 'normal' }],      // 16px
				'small': ['0.875rem', { lineHeight: '1.5', fontWeight: '400', letterSpacing: 'normal' }],     // 14px
			},

			fontWeight: {
				// Essential font weights only
				'normal': '400',
				'medium': '500',
				'semibold': '600',
				'bold': '700',
			},

			letterSpacing: {
				// Simplified letter spacing
				'tighter': '-0.01em',
				'normal': '0em',
				'wide': '0.01em',
			},

			/* ==============================================
			   SPACING SYSTEM - 8px Base Grid
			   ============================================== */
			spacing: {
				'xs': '0.25rem',    // 4px
				'sm': '0.5rem',     // 8px
				'md': '1rem',       // 16px
				'lg': '1.5rem',     // 24px
				'xl': '2rem',       // 32px
				'2xl': '3rem',      // 48px
				'3xl': '4rem',      // 64px
				'4xl': '5rem',      // 80px
				'5xl': '6rem',      // 96px
			},

			/* ==============================================
			   BORDER RADIUS SCALE - Premium B2B Design
			   ============================================== */
			borderRadius: {
				'none': '0',
				'xs': '0.125rem',   // 2px
				'sm': '0.25rem',    // 4px
				'md': '0.375rem',   // 6px
				'lg': '0.5rem',     // 8px
				'xl': '0.75rem',    // 12px
				'2xl': '1rem',      // 16px
				'3xl': '1.5rem',    // 24px
				'full': '9999px',
			},

			/* ==============================================
			   COLORS - Custom B2B Palette
			   ============================================== */
			colors: {
				// Base system colors
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				
				// Background variants
				'background-secondary': 'hsl(var(--background-secondary))',
				'background-tertiary': 'hsl(var(--background-tertiary))',
				
				// Interactive colors
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
				
				// Semantic colors
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				info: {
					DEFAULT: 'hsl(var(--info))',
					foreground: 'hsl(var(--info-foreground))'
				},
				
				// Shape/box colors
				'shape-green': 'hsl(var(--shape-green))',
				'shape-blue': '#00457C',
				'shape-grey': 'hsl(var(--shape-grey))',
				'second-grey': '#FAFAFA',
				
				// Text colors
				'text-primary': 'hsl(var(--text-primary))',
				'text-secondary': 'hsl(var(--text-secondary))',
				'text-accent': 'hsl(var(--text-accent))',
				
				// Chart colors
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				},
				
				// Sidebar colors
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

			/* ==============================================
			   BOX SHADOW SYSTEM - Professional Elevation
			   ============================================== */
			boxShadow: {
				'none': 'none',
				'xs': 'var(--shadow-xs)',
				'sm': 'var(--shadow-sm)',
				'md': 'var(--shadow-md)',
				'lg': 'var(--shadow-lg)',
				'xl': 'var(--shadow-xl)',
				'2xl': 'var(--shadow-2xl)',
				'elegant': 'var(--shadow-elegant)',
				'subtle': 'var(--shadow-subtle)',
				'strong': 'var(--shadow-strong)',
			},

			/* ==============================================
			   BACKGROUND GRADIENTS
			   ============================================== */
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-success': 'var(--gradient-success)',
				'gradient-accent': 'var(--gradient-accent)',
				'gradient-warm': 'var(--gradient-warm)',
			},

			/* ==============================================
			   ANIMATION TIMING - Modern B2B Interactions
			   ============================================== */
			transitionDuration: {
				'fastest': 'var(--animation-duration-fastest)',
				'fast': 'var(--animation-duration-fast)',
				'normal': 'var(--animation-duration-normal)',
				'slow': 'var(--animation-duration-slow)',
				'slowest': 'var(--animation-duration-slowest)',
			},

			transitionTimingFunction: {
				'ease': 'var(--animation-easing-ease)',
				'ease-in': 'var(--animation-easing-ease-in)',
				'ease-out': 'var(--animation-easing-ease-out)',
				'ease-in-out': 'var(--animation-easing-ease-in-out)',
				'bounce': 'var(--animation-easing-bounce)',
				'smooth': 'var(--animation-easing-smooth)',
			},

			/* ==============================================
			   Z-INDEX SCALE - Layering System
			   ============================================== */
			zIndex: {
				'hide': 'var(--z-index-hide)',
				'auto': 'var(--z-index-auto)',
				'base': 'var(--z-index-base)',
				'docked': 'var(--z-index-docked)',
				'dropdown': 'var(--z-index-dropdown)',
				'sticky': 'var(--z-index-sticky)',
				'banner': 'var(--z-index-banner)',
				'overlay': 'var(--z-index-overlay)',
				'modal': 'var(--z-index-modal)',
				'popover': 'var(--z-index-popover)',
				'skip-link': 'var(--z-index-skip-link)',
				'toast': 'var(--z-index-toast)',
				'tooltip': 'var(--z-index-tooltip)',
			},

			/* ==============================================
			   ANIMATIONS
			   ============================================== */
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
				'accordion-down': 'accordion-down var(--animation-duration-normal) var(--animation-easing-ease-out)',
				'accordion-up': 'accordion-up var(--animation-duration-normal) var(--animation-easing-ease-out)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
