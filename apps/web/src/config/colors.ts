/**
 * COLOR CONFIGURATION
 * 
 * This file contains all color-related configuration for easy customization.
 * Custom palette for Better Call Robots B2B application.
 */

// Helper function to convert hex to HSL
const hexToHsl = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export const colorConfig = {
  /* ==============================================
     LIGHT MODE COLORS - Custom B2B Palette
     ============================================== */
  light: {
    // Background colors - warm, professional palette
    background: hexToHsl('#F3E9DC'),        // off-brown - Main background
    foreground: hexToHsl('#0A0A0A'),        // text-black - Main text color
    
    // Secondary backgrounds
    backgroundSecondary: hexToHsl('#FAF9F6'), // off-white - Cards, panels
    backgroundTertiary: hexToHsl('#EEEEEE'),  // off-grey - Subtle backgrounds
    
    // Card colors
    card: hexToHsl('#FAF9F6'),              // off-white - Card backgrounds
    cardForeground: hexToHsl('#0A0A0A'),    // text-black - Card text
    
    // Interactive colors
    primary: hexToHsl('#3E5F44'),           // text-green - Primary buttons, links
    primaryForeground: hexToHsl('#FAF9F6'), // off-white - Text on primary elements
    
    secondary: hexToHsl('#EEEEEE'),         // off-grey - Secondary buttons
    secondaryForeground: hexToHsl('#2E2E2E'), // text-grey - Text on secondary elements
    
    // Muted colors for subtle elements
    muted: hexToHsl('#EEEEEE'),             // off-grey - Subtle backgrounds
    mutedForeground: hexToHsl('#2E2E2E'),   // text-grey - Subtle text
    
    // Accent colors
    accent: hexToHsl('#F3E9DC'),            // off-brown - Hover states
    accentForeground: hexToHsl('#2E2E2E'),  // text-grey - Text on accent elements
    
    // Border and form colors
    border: hexToHsl('#EEEEEE'),            // off-grey - Borders, dividers
    input: hexToHsl('#FAF9F6'),             // off-white - Input backgrounds
    ring: hexToHsl('#3E5F44'),              // text-green - Focus rings
    
    // Shape/box colors for components
    shapeGreen: hexToHsl('#90C67C'),        // Boxes, success elements
    shapeOrange: hexToHsl('#DF6D14'),       // Warning, accent boxes
    shapeGrey: hexToHsl('#4C585B'),         // Neutral boxes, borders
    
    // Text color variants
    textPrimary: hexToHsl('#0A0A0A'),       // text-black - Primary text
    textSecondary: hexToHsl('#2E2E2E'),     // text-grey - Secondary text
    textAccent: hexToHsl('#3E5F44'),        // text-green - Accent text
    
    // Sidebar colors
    sidebarBackground: hexToHsl('#F3E9DC'),    // off-brown
    sidebarForeground: hexToHsl('#2E2E2E'),    // text-grey
    sidebarPrimary: hexToHsl('#3E5F44'),       // text-green
    sidebarPrimaryForeground: hexToHsl('#FAF9F6'), // off-white
    sidebarAccent: hexToHsl('#EEEEEE'),        // off-grey
    sidebarAccentForeground: hexToHsl('#2E2E2E'), // text-grey
    sidebarBorder: hexToHsl('#EEEEEE'),        // off-grey
  },

  /* ==============================================
     DARK MODE COLORS - Adapted for custom palette
     ============================================== */
  dark: {
    background: '220 15% 8%',               // Dark background
    foreground: hexToHsl('#FAF9F6'),        // off-white text
    
    backgroundSecondary: '220 15% 12%',     // Slightly lighter dark
    backgroundTertiary: '220 15% 15%',      // Card backgrounds
    
    card: '220 15% 12%',
    cardForeground: hexToHsl('#FAF9F6'),
    
    primary: hexToHsl('#90C67C'),           // Brighter green for dark mode
    primaryForeground: '220 15% 8%',
    
    secondary: '220 15% 20%',
    secondaryForeground: hexToHsl('#FAF9F6'),
    
    muted: '220 15% 18%',
    mutedForeground: '220 10% 70%',
    
    accent: '220 15% 20%',
    accentForeground: hexToHsl('#FAF9F6'),
    
    border: '220 15% 20%',
    input: '220 15% 15%',
    ring: hexToHsl('#90C67C'),
    
    // Shape colors adapted for dark mode
    shapeGreen: hexToHsl('#90C67C'),
    shapeOrange: hexToHsl('#DF6D14'),
    shapeGrey: '220 10% 60%',
    
    textPrimary: hexToHsl('#FAF9F6'),
    textSecondary: '220 10% 80%',
    textAccent: hexToHsl('#90C67C'),
    
    sidebarBackground: '220 15% 10%',
    sidebarForeground: '220 10% 80%',
    sidebarPrimary: hexToHsl('#90C67C'),
    sidebarPrimaryForeground: '220 15% 8%',
    sidebarAccent: '220 15% 18%',
    sidebarAccentForeground: '220 10% 80%',
    sidebarBorder: '220 15% 20%',
  },

  /* ==============================================
     SEMANTIC COLORS - Context-specific colors
     ============================================== */
  semantic: {
    // Success colors (using shape-green)
    success: hexToHsl('#90C67C'),
    successForeground: hexToHsl('#0A0A0A'),
    
    // Warning colors (using shape-orange)
    warning: hexToHsl('#DF6D14'),
    warningForeground: hexToHsl('#FAF9F6'),
    
    // Destructive/Error colors
    destructive: '0 75% 55%',
    destructiveForeground: hexToHsl('#FAF9F6'),
    
    // Info colors (using text-green)
    info: hexToHsl('#3E5F44'),
    infoForeground: hexToHsl('#FAF9F6'),
  },

  /* ==============================================
     CHART COLORS - For data visualization
     ============================================== */
  chart: {
    1: hexToHsl('#90C67C'),  // shape-green
    2: hexToHsl('#DF6D14'),  // shape-orange
    3: hexToHsl('#4C585B'),  // shape-grey
    4: hexToHsl('#3E5F44'),  // text-green
    5: '220 15% 50%',        // neutral
  },

  /* ==============================================
     GRADIENT DEFINITIONS
     ============================================== */
  gradients: {
    primary: `linear-gradient(135deg, ${hexToHsl('#3E5F44')}, ${hexToHsl('#90C67C')})`,
    success: `linear-gradient(135deg, ${hexToHsl('#90C67C')}, ${hexToHsl('#3E5F44')})`,
    accent: `linear-gradient(135deg, ${hexToHsl('#F3E9DC')}, ${hexToHsl('#FAF9F6')})`,
    warm: `linear-gradient(135deg, ${hexToHsl('#DF6D14')}, ${hexToHsl('#90C67C')})`,
  },

  /* ==============================================
     SPACING SYSTEM - 8px Base Grid
     ============================================== */
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
    '4xl': '5rem',    // 80px
    '5xl': '6rem',    // 96px
  },

  /* ==============================================
     BORDER RADIUS SCALE - Premium B2B Design
     ============================================== */
  borderRadius: {
    none: '0',
    xs: '0.125rem',   // 2px - Subtle elements
    sm: '0.25rem',    // 4px - Small components
    md: '0.375rem',   // 6px - Default buttons, inputs
    lg: '0.5rem',     // 8px - Cards, panels
    xl: '0.75rem',    // 12px - Large cards
    '2xl': '1rem',    // 16px - Hero sections
    '3xl': '1.5rem',  // 24px - Special elements
    full: '9999px',   // Pills, avatars
  },

  /* ==============================================
     BOX SHADOW SYSTEM - Professional Elevation
     ============================================== */
  shadows: {
    none: 'none',
    xs: `0 1px 2px 0 ${hexToHsl('#0A0A0A')} / 0.05`,
    sm: `0 1px 3px 0 ${hexToHsl('#0A0A0A')} / 0.1, 0 1px 2px -1px ${hexToHsl('#0A0A0A')} / 0.1`,
    md: `0 4px 6px -1px ${hexToHsl('#0A0A0A')} / 0.1, 0 2px 4px -2px ${hexToHsl('#0A0A0A')} / 0.1`,
    lg: `0 10px 15px -3px ${hexToHsl('#0A0A0A')} / 0.1, 0 4px 6px -4px ${hexToHsl('#0A0A0A')} / 0.1`,
    xl: `0 20px 25px -5px ${hexToHsl('#0A0A0A')} / 0.1, 0 8px 10px -6px ${hexToHsl('#0A0A0A')} / 0.1`,
    '2xl': `0 25px 50px -12px ${hexToHsl('#0A0A0A')} / 0.25`,
    elegant: `0 4px 20px -4px ${hexToHsl('#0A0A0A')} / 0.15`,
    subtle: `0 2px 8px -2px ${hexToHsl('#0A0A0A')} / 0.1`,
    strong: `0 16px 48px -16px ${hexToHsl('#0A0A0A')} / 0.3`,
  },

  /* ==============================================
     ANIMATION TIMING - Modern B2B Interactions
     ============================================== */
  animation: {
    duration: {
      fastest: '100ms',   // Micro-interactions
      fast: '150ms',      // Hover states
      normal: '250ms',    // Default transitions
      slow: '350ms',      // Complex animations
      slowest: '500ms',   // Page transitions
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    },
  },

  /* ==============================================
     Z-INDEX SCALE - Layering System
     ============================================== */
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,      // Sticky elements
    dropdown: 1000,  // Dropdowns, selects
    sticky: 1100,    // Sticky headers
    banner: 1200,    // Banners, alerts
    overlay: 1300,   // Overlays, backdrops
    modal: 1400,     // Modals, dialogs
    popover: 1500,   // Popovers, tooltips
    skipLink: 1600,  // Skip links
    toast: 1700,     // Toast notifications
    tooltip: 1800,   // Tooltips (highest)
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