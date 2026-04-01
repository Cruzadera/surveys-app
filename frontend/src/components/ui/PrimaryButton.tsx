import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
};

const PrimaryButton: React.FC<Props> = ({ title, onPress, disabled = false, loading = false, variant = 'primary', style }) => {
  const isInactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        isInactive && styles.disabled,
        pressed && !isInactive && styles.pressed,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#101a33'} />
      ) : (
        <Text style={[styles.text, variant === 'primary' ? styles.primaryText : styles.secondaryText]}>{title}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18
  },
  primary: {
    backgroundColor: '#131c33'
  },
  secondary: {
    backgroundColor: '#e6ecff'
  },
  disabled: {
    opacity: 0.55
  },
  pressed: {
    transform: [{ scale: 0.985 }]
  },
  text: {
    fontSize: 16,
    fontWeight: '800'
  },
  primaryText: {
    color: '#fff'
  },
  secondaryText: {
    color: '#233257'
  }
});

export default PrimaryButton;
