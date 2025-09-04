/**
 * TYPOGRAPHY CONFIGURATION
 * 
 * This file contains all typography-related configuration for easy customization.
 * Simplified 4-size system for Better Call Robots B2B application.
 */

export const typographyConfig = {
  /* ==============================================
     FONT FAMILIES - Noto Sans only
     ============================================== */
  fonts: {
    primary: 'Noto Sans', // Main UI font for all text
    mono: 'JetBrains Mono', // Code and technical content only
  },

  /* ==============================================
     SIMPLIFIED FONT SIZES - 4 sizes only
     ============================================== */
  sizes: {
    // Headers - For main page titles, major headings
    header: {
      size: '1.5rem',      // 24px (2xl equivalent)
      lineHeight: '1.3',
      fontWeight: '600',
      letterSpacing: '-0.01em',
    },
    
    // Sub-Headers - For section titles, card headers
    subHeader: {
      size: '1.25rem',     // 20px (xl equivalent)
      lineHeight: '1.4',
      fontWeight: '500',
      letterSpacing: 'normal',
    },
    
    // Standard Text - Default body text, descriptions
    standard: {
      size: '1rem',        // 16px (lg equivalent)
      lineHeight: '1.6',
      fontWeight: '400',
      letterSpacing: 'normal',
    },
    
    // Small Text - Captions, metadata, fine print
    small: {
      size: '0.875rem',    // 14px (sm equivalent)
      lineHeight: '1.5',
      fontWeight: '400',
      letterSpacing: 'normal',
    }
  },

  /* ==============================================
     FONT WEIGHTS - Essential weights only
     ============================================== */
  weights: {
    normal: 400,    // Standard text
    medium: 500,    // Sub-headers, emphasis
    semibold: 600,  // Headers, important text
    bold: 700,      // Strong emphasis (if needed)
  },

  /* ==============================================
     LINE HEIGHTS - Optimized for readability
     ============================================== */
  lineHeights: {
    tight: 1.3,     // Headers
    normal: 1.4,    // Sub-headers
    relaxed: 1.5,   // Small text
    loose: 1.6,     // Standard body text
  },

  /* ==============================================
     LETTER SPACING - Subtle adjustments
     ============================================== */
  letterSpacing: {
    tighter: '-0.01em',  // Headers
    normal: '0em',       // Everything else
    wide: '0.01em',      // Special cases
  },

  /* ==============================================
     TEXT COLORS - Semantic color mapping
     ============================================== */
  colors: {
    // Primary text colors
    primary: 'hsl(var(--text-primary))',      // text-black
    secondary: 'hsl(var(--text-secondary))',  // text-grey
    accent: 'hsl(var(--text-accent))',        // text-green
    
    // Contextual colors
    success: 'hsl(var(--success-foreground))',
    warning: 'hsl(var(--warning-foreground))',
    destructive: 'hsl(var(--destructive-foreground))',
    
    // Interactive colors
    link: 'hsl(var(--primary))',
    linkHover: 'hsl(var(--primary)) / 0.8',
  },

  /* ==============================================
     RESPONSIVE SCALING - Mobile optimization
     ============================================== */
  responsive: {
    mobile: {
      header: '1.375rem',     // 22px - Slightly smaller on mobile
      subHeader: '1.125rem',  // 18px
      standard: '1rem',       // 16px - Same
      small: '0.875rem',      // 14px - Same
    },
    desktop: {
      header: '1.5rem',       // 24px - Full size
      subHeader: '1.25rem',   // 20px
      standard: '1rem',       // 16px
      small: '0.875rem',      // 14px
    },
  }
};

/* ==============================================
   UTILITY FUNCTIONS for Typography
   ============================================== */

/**
 * Get font family CSS value with fallbacks
 */
export const getFontFamily = (type: keyof typeof typographyConfig.fonts = 'primary') => {
  const font = typographyConfig.fonts[type];
  const fallbacks = {
    primary: 'system-ui, -apple-system, sans-serif',
    mono: 'Consolas, Monaco, monospace',
  };
  return `${font}, ${fallbacks[type]}`;
};

/**
 * Get complete text styles for a size
 */
export const getTextStyles = (
  size: keyof typeof typographyConfig.sizes,
  breakpoint: 'mobile' | 'desktop' = 'desktop'
) => {
  const sizeConfig = typographyConfig.sizes[size];
  const responsiveSize = typographyConfig.responsive[breakpoint][size];
  
  return {
    fontSize: responsiveSize,
    lineHeight: sizeConfig.lineHeight,
    fontWeight: sizeConfig.fontWeight,
    letterSpacing: sizeConfig.letterSpacing,
    fontFamily: getFontFamily('primary'),
  };
};

/**
 * Generate CSS classes for typography
 */
export const generateTypographyClasses = () => {
  const sizes = Object.keys(typographyConfig.sizes) as Array<keyof typeof typographyConfig.sizes>;
  
  return sizes.map(size => {
    const config = typographyConfig.sizes[size];
    const className = `text-${size}`;
    
    return `
  .${className} {
    font-family: ${getFontFamily('primary')};
    font-size: ${config.size};
    line-height: ${config.lineHeight};
    font-weight: ${config.fontWeight};
    letter-spacing: ${config.letterSpacing};
  }`;
  }).join('\n');
};

export default typographyConfig;