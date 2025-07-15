interface ColorPalette {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
    like: string;
    pass: string;
    superLike: string;
    match: string;
  }
  
  export const COLORS: ColorPalette = {
    primary: '#E91E63',
    secondary: '#FF4081',
    accent: '#FFC107',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#212121',
    textSecondary: '#757575',
    border: '#E0E0E0',
    error: '#F44336',
    success: '#4CAF50',
    warning: '#FF9800',
    like: '#4CAF50',
    pass: '#F44336',
    superLike: '#2196F3',
    match: '#FF4081',
  };
  
  export const FONTS = {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    light: 'System',
  } as const;
  
  export type FontWeight = keyof typeof FONTS;
  
  export const FONT_SIZES = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  } as const;
  
  export type FontSize = keyof typeof FONT_SIZES;
  
  export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  } as const;
  
  export type SpacingSize = keyof typeof SPACING;
  
  export const BORDER_RADIUS = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 50,
  } as const;
  
  export type BorderRadiusSize = keyof typeof BORDER_RADIUS;
  
  interface ShadowStyle {
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  }
  
  export const SHADOWS: Record<'sm' | 'md' | 'lg', ShadowStyle> = {
    sm: {
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    md: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 4,
    },
    lg: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.32,
      shadowRadius: 5.46,
      elevation: 9,
    },
  };
  
  export type ShadowSize = keyof typeof SHADOWS;