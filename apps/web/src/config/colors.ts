/**
 * COLOR CONFIGURATION
 * 
 * This file contains all color-related configuration for easy customization.
 * Modify these HSL values to change the entire app's color scheme.
 */

export const colorConfig = {
  /* ==============================================
     LIGHT MODE COLORS - Easily configurable
     ============================================== */
  light: {
    // Background colors - subtle off-white theme
    background: '0 0% 98%',           // Main background
    foreground: '0 0% 15%',           // Main text color
    
    // Card colors
    card: '0 0% 100%',                // Card backgrounds
    cardForeground: '0 0% 15%',       // Card text
    
    // Interactive colors
    primary: '0 0% 20%',              // Primary buttons, links
    primaryForeground: '0 0% 98%',    // Text on primary elements
    
    secondary: '0 0% 96%',            // Secondary buttons
    secondaryForeground: '0 0% 10%',  // Text on secondary elements
    
    // Muted colors for subtle elements
    muted: '0 0% 95%',                // Subtle backgrounds
    mutedForeground: '0 0% 45%',      // Subtle text
    
    // Accent colors
    accent: '0 0% 94%',               // Hover states, highlights
    accentForeground: '0 0% 10%',     // Text on accent elements
    
    // Border and form colors
    border: '0 0% 90%',               // Borders, dividers
    input: '0 0% 96%',                // Input backgrounds
    ring: '0 0% 30%',                 // Focus rings
    
    // Sidebar colors
    sidebarBackground: '0 0% 98%',
    sidebarForeground: '0 0% 25%',
    sidebarPrimary: '0 0% 10%',
    sidebarPrimaryForeground: '0 0% 98%',
    sidebarAccent: '0 0% 95%',
    sidebarAccentForeground: '0 0% 10%',
    sidebarBorder: '0 0% 92%',
  },

  /* ==============================================
     DARK MODE COLORS
     ============================================== */
  dark: {
    background: '222.2 84% 4.9%',
    foreground: '210 40% 98%',
    
    card: '222.2 84% 4.9%',
    cardForeground: '210 40% 98%',
    
    primary: '210 40% 98%',
    primaryForeground: '222.2 47.4% 11.2%',
    
    secondary: '217.2 32.6% 17.5%',
    secondaryForeground: '210 40% 98%',
    
    muted: '217.2 32.6% 17.5%',
    mutedForeground: '215 20.2% 65.1%',
    
    accent: '217.2 32.6% 17.5%',
    accentForeground: '210 40% 98%',
    
    border: '217.2 32.6% 17.5%',
    input: '217.2 32.6% 17.5%',
    ring: '212.7 26.8% 83.9%',
    
    sidebarBackground: '240 5.9% 10%',
    sidebarForeground: '240 4.8% 95.9%',
    sidebarPrimary: '224.3 76.3% 48%',
    sidebarPrimaryForeground: '0 0% 100%',
    sidebarAccent: '240 3.7% 15.9%',
    sidebarAccentForeground: '240 4.8% 95.9%',
    sidebarBorder: '240 3.7% 15.9%',
  },

  /* ==============================================
     SEMANTIC COLORS - Context-specific colors
     ============================================== */
  semantic: {
    // Success colors (green)
    success: '142 76% 36%',
    successForeground: '0 0% 100%',
    
    // Warning colors (orange/yellow)
    warning: '38 92% 50%',
    warningForeground: '0 0% 100%',
    
    // Destructive/Error colors (red)
    destructive: '0 84% 60%',
    destructiveForeground: '0 0% 98%',
    
    // Info colors (blue)
    info: '217 91% 60%',
    infoForeground: '0 0% 100%',
  },

  /* ==============================================
     CHART COLORS - For data visualization
     ============================================== */
  chart: {
    1: '262 83% 58%',  // Purple
    2: '142 76% 36%',  // Green
    3: '38 92% 50%',   // Orange
    4: '0 84% 60%',    // Red
    5: '197 37% 24%',  // Blue-gray
  },

  /* ==============================================
     GRADIENT DEFINITIONS
     ============================================== */
  gradients: {
    primary: 'linear-gradient(135deg, hsl(0 0% 20%), hsl(0 0% 40%))',
    success: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(162 76% 46%))',
    accent: 'linear-gradient(135deg, hsl(0 0% 94%), hsl(0 0% 98%))',
  },

  /* ==============================================
     SHADOW DEFINITIONS
     ============================================== */
  shadows: {
    elegant: '0 4px 20px -4px hsl(0 0% 0% / 0.15)',
    subtle: '0 2px 8px -2px hsl(0 0% 0% / 0.1)',
    medium: '0 8px 32px -8px hsl(0 0% 0% / 0.2)',
    strong: '0 16px 48px -16px hsl(0 0% 0% / 0.3)',
  },
};

/* ==============================================
   UTILITY FUNCTIONS for Colors
   ============================================== */

/**
 * Get HSL color value for CSS
 */
export const getColor = (
  category: keyof typeof colorConfig.light,
  mode: 'light' | 'dark' = 'light'
) => {
  return colorConfig[mode][category] || colorConfig.light[category];
};

/**
 * Generate CSS custom properties for colors
 */
export const generateColorCSS = (mode: 'light' | 'dark' = 'light') => {
  const colors = colorConfig[mode];
  return Object.entries(colors)
    .map(([key, value]) => `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
    .join('\n    ');
};

/**
 * Convert HSL to hex for external tools
 */
export const hslToHex = (hsl: string): string => {
  const [h, s, l] = hsl.split(' ').map(val => parseInt(val.replace('%', '')));
  const a = (s * Math.min(l, 100 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color / 100).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

export default colorConfig;