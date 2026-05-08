import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppShell from '../components/ui/AppShell';
import FieldInput from '../components/ui/FieldInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import api from '../services/api';

type Props = {
  token?: string;
  onBackToLogin: () => void;
};

const ResetPasswordScreen: React.FC<Props> = ({ token, onBackToLogin }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleReset = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!token) {
      setErrorMessage('El enlace de recuperacion no es valido.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('La contrasena debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contrasenas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.resetPassword({ token, password });
      setSuccessMessage(data.message || 'Contrasena actualizada. Ya puedes iniciar sesion.');
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'No se pudo actualizar la contrasena.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      eyebrow="Seguridad"
      title="Nueva contrasena"
      subtitle="Define una nueva contrasena para recuperar tu cuenta."
    >
      <FieldInput
        label="Nueva contrasena"
        placeholder="Minimo 8 caracteres"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />

      <FieldInput
        label="Confirmar contrasena"
        placeholder="Repite tu contrasena"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

      <PrimaryButton
        title={loading ? 'Guardando...' : 'Actualizar contrasena'}
        onPress={handleReset}
        loading={loading}
        disabled={!password || !confirmPassword}
      />

      <View style={styles.linkWrap}>
        <TouchableOpacity onPress={onBackToLogin} accessibilityRole="button">
          <Text style={styles.linkText}>Volver a iniciar sesion</Text>
        </TouchableOpacity>
      </View>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  errorText: {
    marginBottom: 12,
    color: '#b42318',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600'
  },
  successText: {
    marginBottom: 12,
    color: '#067647',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600'
  },
  linkWrap: {
    marginTop: 14,
    alignItems: 'center'
  },
  linkText: {
    color: '#355ad8',
    fontSize: 14,
    fontWeight: '700'
  }
});

export default ResetPasswordScreen;
