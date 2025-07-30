# Configuration Files

This directory contains all the configuration files for easy customization of the app's design system.

## Files Overview

### `typography.ts`
Contains all typography-related configuration:
- **Font families**: Primary (Inter), Secondary (Poppins), Mono fonts
- **Font sizes**: Display, heading, body, and utility text sizes
- **Font weights**: Light to extrabold weights
- **Line heights**: Spacing configurations
- **Letter spacing**: Fine-tuning text appearance
- **Responsive scaling**: Different sizes for mobile/tablet/desktop

### `colors.ts`
Contains all color-related configuration:
- **Light/Dark modes**: Complete color schemes
- **Semantic colors**: Success, warning, destructive, info
- **Chart colors**: Data visualization palette
- **Gradients**: Background gradient definitions
- **Shadows**: Shadow depth system

## How to Customize

### Changing Fonts
1. Add new Google Fonts to `index.html`
2. Update font families in `typography.ts`
3. Fonts are automatically applied via Tailwind classes

### Changing Colors
1. Modify HSL values in `colors.ts`
2. Colors automatically update throughout the app
3. Both light and dark modes supported

### Changing Typography Scale
1. Adjust font sizes in `typography.ts`
2. Modify responsive scaling factors
3. Update line heights and spacing

## Usage Examples

### Typography Classes
```tsx
// Display text (hero sections)
<h1 className="text-display-xl">Hero Headline</h1>
<h2 className="text-display-lg">Large Display</h2>

// Headings (section titles)
<h3 className="text-heading-lg">Section Title</h3>
<h4 className="text-heading-md">Subsection</h4>

// Body text (content)
<p className="text-body-lg">Main content</p>
<p className="text-body-md">Secondary content</p>

// Utility text
<span className="text-caption">Image caption</span>
<span className="text-overline">Category label</span>
```

### Color Classes
```tsx
// Background colors
<div className="bg-background text-foreground">
<div className="bg-card text-card-foreground">

// Interactive elements
<button className="bg-primary text-primary-foreground">
<button className="bg-secondary text-secondary-foreground">

// Semantic colors
<div className="bg-success text-success-foreground">
<div className="bg-warning text-warning-foreground">
```

## Configuration Variables

All configuration is centralized and easily modifiable:

- **Font stack**: Easily swap fonts by changing one line
- **Color scheme**: Change entire app colors with HSL values
- **Responsive scaling**: Adjust typography for different screen sizes
- **Semantic meaning**: Colors and typography tied to meaning, not appearance

## Best Practices

1. **Use semantic classes**: `text-heading-lg` instead of `text-2xl`
2. **Modify config files**: Don't hardcode colors/sizes in components
3. **Test both modes**: Ensure light and dark modes work properly
4. **Consider accessibility**: Maintain proper contrast ratios
5. **Use design tokens**: Leverage the centralized configuration system