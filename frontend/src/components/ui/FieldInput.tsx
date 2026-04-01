import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

type Props = TextInputProps & {
  label: string;
};

const FieldInput: React.FC<Props> = ({ label, style, ...props }) => {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#8a95b3"
        {...props}
        style={[styles.input, style]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14
  },
  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#53607f',
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  input: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d7def4',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#101a33',
    fontSize: 16
  }
});

export default FieldInput;
