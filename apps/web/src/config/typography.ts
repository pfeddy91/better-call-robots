/**
 * TYPOGRAPHY CONFIGURATION
 * 
 * This file contains all typography-related configuration for easy customization.
 * Modify these values to change the entire app's typography system.
 */

export const typographyConfig = {
  /* ==============================================
     FONT FAMILIES - Easily swap out fonts here
     ============================================== */
  fonts: {
    primary: 'Inter', // Main UI font (body text, forms, etc.)
    secondary: 'Poppins', // Headings and display text
    mono: 'JetBrains Mono', // Code and technical content
  },

  /* ==============================================
     FONT SIZES - Adjust scaling and hierarchy
     ============================================== */
  sizes: {
    // Display sizes for hero sections, major headings
    display: {
      xl: '4rem',      // 64px - Hero headlines
      lg: '3.5rem',    // 56px - Large display text
      md: '3rem',      // 48px - Medium display text
      sm: '2.5rem',    // 40px - Small display text
    },
    
    // Heading sizes for section titles, card headers
    heading: {
      xl: '2.25rem',   // 36px - Major section headings
      lg: '2rem',      // 32px - Section headings
      md: '1.75rem',   // 28px - Subsection headings
      sm: '1.5rem',    // 24px - Card/component headings
      xs: '1.25rem',   // 20px - Small headings
    },
    
    // Body text sizes for content
    body: {
      xl: '1.125rem',  // 18px - Large body text
      lg: '1rem',      // 16px - Default body text
      md: '0.875rem',  // 14px - Small body text
      sm: '0.8125rem', // 13px - Fine print
      xs: '0.75rem',   // 12px - Extra small text
    },
    
    // Utility text sizes
    utility: {
      caption: '0.6875rem',  // 11px - Image captions, metadata
      overline: '0.625rem',  // 10px - Labels, categories
    }
  },

  /* ==============================================
     FONT WEIGHTS - Control text emphasis
     ============================================== */
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  /* ==============================================
     LINE HEIGHTS - Control text spacing
     ============================================== */
  lineHeights: {
    tight: 1.1,     // For large headings
    snug: 1.25,     // For headings
    normal: 1.4,    // For most text
    relaxed: 1.6,   // For body content
    loose: 1.8,     // For long-form content
  },

  /* ==============================================
     LETTER SPACING - Fine-tune text appearance
     ============================================== */
  letterSpacing: {
    tighter: '-0.02em',
    tight: '-0.01em',
    normal: '0em',
    wide: '0.01em',
    wider: '0.02em',
    widest: '0.08em', // For overlines/labels
  },

  /* ==============================================
     TEXT COLORS - Semantic color mapping
     ============================================== */
  colors: {
    // Primary text colors
    primary: 'hsl(var(--foreground))',
    secondary: 'hsl(var(--muted-foreground))',
    
    // Contextual colors
    success: 'hsl(var(--success-foreground))',
    warning: 'hsl(var(--warning-foreground))',
    destructive: 'hsl(var(--destructive-foreground))',
    
    // Interactive colors
    link: 'hsl(var(--primary))',
    linkHover: 'hsl(var(--primary)) / 0.8',
  },

  /* ==============================================
     RESPONSIVE BREAKPOINTS for Typography
     ============================================== */
  responsive: {
    // Scale factors for different screen sizes
    mobile: {
      displayScale: 0.75,  // Smaller displays on mobile
      headingScale: 0.85,  // Slightly smaller headings
      bodyScale: 1,        // Normal body text
    },
    tablet: {
      displayScale: 0.9,
      headingScale: 0.95,
      bodyScale: 1,
    },
    desktop: {
      displayScale: 1,     // Full size on desktop
      headingScale: 1,
      bodyScale: 1,
    },
  }
};

/* ==============================================
   UTILITY FUNCTIONS for Typography
   ============================================== */

/**
 * Get font family CSS value
 */
export const getFontFamily = (type: keyof typeof typographyConfig.fonts) => {
  const font = typographyConfig.fonts[type];
  const fallbacks = {
    primary: 'system-ui, -apple-system, sans-serif',
    secondary: 'system-ui, -apple-system, sans-serif',
    mono: 'Consolas, Monaco, monospace',
  };
  return `${font}, ${fallbacks[type]}`;
};

/**
 * Get responsive font size
 */
export const getResponsiveFontSize = (
  category: keyof typeof typographyConfig.sizes,
  size: string,
  breakpoint: keyof typeof typographyConfig.responsive = 'desktop'
) => {
  const baseSize = typographyConfig.sizes[category][size as keyof typeof typographyConfig.sizes[typeof category]];
  const scale = typographyConfig.responsive[breakpoint][`${category}Scale` as keyof typeof typographyConfig.responsive[typeof breakpoint]];
  return `calc(${baseSize} * ${scale})`;
};

export default typographyConfig;