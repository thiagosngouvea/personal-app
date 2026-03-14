// ==========================================
// Theme & Design System
// ==========================================

export const Colors = {
  light: {
    primary: '#0EA5E9',       // Sky blue
    primaryDark: '#0284C7',
    primaryLight: '#38BDF8',
    accent: '#10B981',        // Emerald green
    accentDark: '#059669',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#F1F5F9',
    text: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    error: '#EF4444',
    errorLight: '#FEF2F2',
    success: '#10B981',
    successLight: '#ECFDF5',
    warning: '#F59E0B',
    warningLight: '#FFFBEB',
    card: '#FFFFFF',
    cardShadow: 'rgba(0, 0, 0, 0.06)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E2E8F0',
    inputBackground: '#F8FAFC',
    skeleton: '#E2E8F0',
  },
  dark: {
    primary: '#38BDF8',
    primaryDark: '#0EA5E9',
    primaryLight: '#7DD3FC',
    accent: '#34D399',
    accentDark: '#10B981',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceElevated: '#334155',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    border: '#334155',
    borderLight: '#1E293B',
    error: '#F87171',
    errorLight: '#451A1A',
    success: '#34D399',
    successLight: '#1A3A2A',
    warning: '#FBBF24',
    warningLight: '#3A3520',
    card: '#1E293B',
    cardShadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    tabBar: '#1E293B',
    tabBarBorder: '#334155',
    inputBackground: '#1E293B',
    skeleton: '#334155',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  hero: 36,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export type ThemeColors = typeof Colors.light;
