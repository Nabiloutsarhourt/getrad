// Composant Bouton réutilisable pour GETRAD
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';

const Button = ({
  title,
  onPress,
  variant = 'primary',  // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  disabled = false,
  loading = false,
  icon,                 // nom d'icône Ionicons (optionnel)
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  const getContainerStyle = () => {
    if (isDisabled) return [styles.button, styles.disabled, style];
    switch (variant) {
      case 'secondary': return [styles.button, styles.secondary, style];
      case 'outline':   return [styles.button, styles.outline, style];
      case 'danger':    return [styles.button, styles.danger, style];
      case 'ghost':     return [styles.button, styles.ghost, style];
      default:          return [styles.button, styles.primary, style];
    }
  };

  const getTextColor = () => {
    if (isDisabled) return COLORS.onSurfaceVariant;
    if (variant === 'outline' || variant === 'ghost') return COLORS.primary;
    return COLORS.onPrimary;
  };

  const iconColor = getTextColor();

  return (
    <TouchableOpacity
      style={getContainerStyle()}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.onPrimary} />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={18} color={iconColor} style={styles.iconLeft} />
          )}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={18} color={iconColor} style={styles.iconRight} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primary: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  danger: {
    backgroundColor: COLORS.error,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: COLORS.primaryFixed,
  },
  disabled: {
    backgroundColor: COLORS.surfaceContainerHigh,
    shadowOpacity: 0,
    elevation: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Button;
