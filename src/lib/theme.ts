export interface CafeTheme {
  name: string;
  tagline: string;
  logoUrl?: string;
  primaryColor: string; // Hex code or valid CSS color
  accentColor: string;  // Hex code or valid CSS color
  primaryForeground: string; // Hex code for text on top of primary color
  creamBackground: string;
  darkCocoa: string;
}

// Default brand configurations (using the coffee house/warm latte & terracotta palette)
export const defaultTheme: CafeTheme = {
  name: process.env.NEXT_PUBLIC_CAFE_NAME || 'Neon Bistro',
  tagline: process.env.NEXT_PUBLIC_CAFE_TAGLINE || 'Fresh Gourmet Brews & Gen-Z Bites',
  logoUrl: process.env.NEXT_PUBLIC_CAFE_LOGO_URL || '',
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#E07A5F', // Terracotta
  accentColor: process.env.NEXT_PUBLIC_ACCENT_COLOR || '#F3CC8F',   // Latte
  primaryForeground: process.env.NEXT_PUBLIC_PRIMARY_FOREGROUND || '#FAF7EE', // Cream White
  creamBackground: '#FAF7EE', // Cream White background
  darkCocoa: '#3D2C2E', // Dark Cocoa
};

/**
 * Returns a React CSS properties object with custom variables mapped to the theme
 */
export function getThemeStyles(theme: CafeTheme = defaultTheme): React.CSSProperties {
  return {
    '--brand-primary': theme.primaryColor,
    '--brand-accent': theme.accentColor,
    '--brand-primary-foreground': theme.primaryForeground,
    '--brand-cream': theme.creamBackground,
    '--brand-cocoa': theme.darkCocoa,
  } as React.CSSProperties;
}
