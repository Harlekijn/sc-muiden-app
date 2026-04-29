export const colors = {
  navy: '#011d50',
  blue: '#046bba',
  yellow: '#f5c518',
  white: '#ffffff',
  light: '#f0f4f9',
  mid: '#dde5f0',
  text: '#0d1f3c',
  text2: '#5a6e8a',
  success: '#1a8c5c',
  error: '#d63c3c',
  warning: '#e07b12',
  info: '#046bba',
  navy90: 'rgba(1, 29, 80, 0.90)',
  navy70: 'rgba(1, 29, 80, 0.70)',
  navy40: 'rgba(1, 29, 80, 0.40)',
  navy12: 'rgba(1, 29, 80, 0.12)',
  navy06: 'rgba(1, 29, 80, 0.06)',
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

export const typography = {
  fontBody: 'Barlow',
  fontDisplay: 'Barlow Condensed',
  fontMono: 'Barlow Condensed',
  scale: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 30,
    '3xl': 38,
    '4xl': 48,
    '5xl': 64,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 10,
  xl: 16,
  pill: 999,
  full: '50%' as const,
} as const;

export const shadows = {
  subtle: {
    rn: {
      shadowColor: '#011d50',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    css: '0 1px 4px rgba(1, 29, 80, 0.08)',
  },
  card: {
    rn: {
      shadowColor: '#011d50',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.10,
      shadowRadius: 8,
      elevation: 3,
    },
    css: '0 2px 8px rgba(1, 29, 80, 0.10)',
  },
  elevated: {
    rn: {
      shadowColor: '#011d50',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
      elevation: 6,
    },
    css: '0 4px 16px rgba(1, 29, 80, 0.16)',
  },
  nav: {
    rn: {
      shadowColor: '#011d50',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 12,
      elevation: 8,
    },
    css: '0 2px 12px rgba(1, 29, 80, 0.18)',
  },
  modal: {
    rn: {
      shadowColor: '#011d50',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.22,
      shadowRadius: 32,
      elevation: 12,
    },
    css: '0 8px 32px rgba(1, 29, 80, 0.22)',
  },
} as const;

export const transitions = {
  fast: '150ms ease-out',
  base: '200ms ease',
  slow: '300ms ease',
} as const;

export const zIndex = {
  base: 0,
  card: 10,
  sticky: 100,
  modal: 200,
  toast: 300,
} as const;
