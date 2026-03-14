import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const colors = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.md,
    };

    // Size
    switch (size) {
      case 'sm':
        base.paddingVertical = Spacing.sm;
        base.paddingHorizontal = Spacing.lg;
        break;
      case 'lg':
        base.paddingVertical = Spacing.lg;
        base.paddingHorizontal = Spacing.xxl;
        break;
      default:
        base.paddingVertical = Spacing.md;
        base.paddingHorizontal = Spacing.xl;
    }

    // Variant
    switch (variant) {
      case 'secondary':
        base.backgroundColor = colors.surfaceElevated;
        break;
      case 'outline':
        base.backgroundColor = 'transparent';
        base.borderWidth = 1.5;
        base.borderColor = colors.primary;
        break;
      case 'ghost':
        base.backgroundColor = 'transparent';
        break;
      case 'danger':
        base.backgroundColor = colors.error;
        break;
      default:
        base.backgroundColor = colors.primary;
    }

    if (disabled || loading) {
      base.opacity = 0.6;
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontWeight: '600',
      fontSize: size === 'sm' ? FontSize.sm : size === 'lg' ? FontSize.lg : FontSize.md,
    };

    switch (variant) {
      case 'secondary':
        base.color = colors.text;
        break;
      case 'outline':
      case 'ghost':
        base.color = colors.primary;
        break;
      case 'danger':
        base.color = '#FFFFFF';
        break;
      default:
        base.color = '#FFFFFF';
    }

    return base;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[getButtonStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#FFFFFF'}
          style={{ marginRight: title ? Spacing.sm : 0 }}
        />
      ) : icon ? (
        <>{icon}</>
      ) : null}
      {title ? <Text style={[getTextStyle(), textStyle]}>{title}</Text> : null}
    </TouchableOpacity>
  );
}
