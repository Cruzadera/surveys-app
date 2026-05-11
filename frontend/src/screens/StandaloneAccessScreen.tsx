import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppShell from '../components/ui/AppShell';
import FieldInput from '../components/ui/FieldInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import api from '../services/api';

type AuthenticatedParams = {
  token: string;
  pollId?: string;
  userName?: string | null;
  avatarColor?: string | null;
  avatarImage?: string | null;
};

type Props = {
  pollId?: string;
  onAuthenticated?: (params: AuthenticatedParams) => void;
};

type Mode = 'login' | 'register' | 'forgot';

const StandaloneAccessScreen: React.FC<Props> = ({ pollId, onAuthenticated }) => {
  const [mode, setMode] = useState<Mode>('login');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const switchMode = (next: Mode) => {
    setMode(next);
    setErrorMessage('');
    setSuccessMessage('');
    setFieldErrors({});
    if (next === 'forgot') {
      setForgotEmail(loginEmail || regEmail || '');
    }
  };

  const handleLogin = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setFieldErrors({});

    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword;

    if (!email || !email.includes('@')) {
      setFieldErrors({ email: 'Introduce un email válido.' });
      return;
    }
    if (!password) {
      setFieldErrors({ password: 'La contraseña es obligatoria.' });
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.loginWithPassword({ email, password });
      onAuthenticated?.({
        token: data.token,
        pollId: data.pollId ?? pollId,
        userName: data.user?.name,
        avatarColor: data.user?.avatarColor,
        avatarImage: data.user?.avatarImage
      });
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'No se pudo iniciar sesión.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setFieldErrors({});

    const name = regName.trim();
    const email = regEmail.trim().toLowerCase();
    const password = regPassword;
    const age = parseInt(regAge, 10);

    const errors: Record<string, string> = {};
    if (!name) errors.name = 'El nombre es obligatorio.';
    if (!email || !email.includes('@')) errors.email = 'Introduce un email válido.';
    if (isNaN(age) || age < 1) errors.age = 'Introduce una edad válida.';
    if (password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.register({ name, age, email, password });
      onAuthenticated?.({
        token: data.token,
        pollId: data.pollId ?? pollId,
        userName: data.user?.name,
        avatarColor: data.user?.avatarColor,
        avatarImage: data.user?.avatarImage
      });
    } catch (error: any) {
      const field = error?.response?.data?.field as string | undefined;
      const msg = error?.response?.data?.message || 'No se pudo completar el registro.';
      if (field) {
        setFieldErrors({ [field]: msg });
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = forgotEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setFieldErrors({ email: 'Introduce un email valido.' });
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setFieldErrors({});

    try {
      const { data } = await api.forgotPassword({ email });
      setErrorMessage('');
      setFieldErrors({});
      setSuccessMessage(data.message || 'Si el correo existe, te enviaremos instrucciones.');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'No se pudo iniciar la recuperacion de contrasena.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      eyebrow="Acceso"
      title={mode === 'login' ? 'Entrar en Yoice' : mode === 'register' ? 'Crear cuenta' : 'Recuperar contrasena'}
      subtitle={
        mode === 'login'
          ? 'Accede con tu email y contrasena.'
          : mode === 'register'
            ? 'Registrate con tu nombre, edad, email y contrasena.'
            : 'Te enviaremos un enlace para restablecer tu contrasena.'
      }
    >
      {mode !== 'forgot' ? (
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === 'login' && styles.tabActive]}
            onPress={() => switchMode('login')}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === 'login' }}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
              Iniciar sesion
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'register' && styles.tabActive]}
            onPress={() => switchMode('register')}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === 'register' }}
          >
            <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
              Crear cuenta
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {mode === 'login' ? (
        <>
          <FieldInput
            label="Email"
            placeholder="tu@email.com"
            value={loginEmail}
            onChangeText={setLoginEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          {fieldErrors.email ? <Text style={styles.fieldError}>{fieldErrors.email}</Text> : null}

          <FieldInput
            label="Contraseña"
            placeholder="••••••••"
            value={loginPassword}
            onChangeText={setLoginPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          {fieldErrors.password ? <Text style={styles.fieldError}>{fieldErrors.password}</Text> : null}

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <PrimaryButton
            title={loading ? 'Entrando...' : 'Entrar'}
            onPress={handleLogin}
            loading={loading}
            disabled={!loginEmail.trim() || !loginPassword}
          />

          <View style={styles.linkWrap}>
            <TouchableOpacity onPress={() => switchMode('forgot')} accessibilityRole="button">
              <Text style={styles.linkText}>Has olvidado tu contrasena?</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : mode === 'register' ? (
        <>
          <FieldInput
            label="Nombre"
            placeholder="Tu nombre"
            value={regName}
            onChangeText={setRegName}
            autoCapitalize="words"
            autoCorrect={false}
          />
          {fieldErrors.name ? <Text style={styles.fieldError}>{fieldErrors.name}</Text> : null}

          <FieldInput
            label="Edad"
            placeholder="Ej. 25"
            value={regAge}
            onChangeText={setRegAge}
            keyboardType="number-pad"
            autoCorrect={false}
          />
          {fieldErrors.age ? <Text style={styles.fieldError}>{fieldErrors.age}</Text> : null}

          <FieldInput
            label="Email"
            placeholder="tu@email.com"
            value={regEmail}
            onChangeText={setRegEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          {fieldErrors.email ? <Text style={styles.fieldError}>{fieldErrors.email}</Text> : null}

          <FieldInput
            label="Contraseña"
            placeholder="Mínimo 8 caracteres"
            value={regPassword}
            onChangeText={setRegPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          {fieldErrors.password ? <Text style={styles.fieldError}>{fieldErrors.password}</Text> : null}

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <PrimaryButton
            title={loading ? 'Registrando...' : 'Crear cuenta'}
            onPress={handleRegister}
            loading={loading}
            disabled={!regName.trim() || !regEmail.trim() || !regPassword || !regAge}
          />
        </>
      ) : (
        <>
          <FieldInput
            label="Email"
            placeholder="tu@email.com"
            value={forgotEmail}
            onChangeText={setForgotEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          {fieldErrors.email ? <Text style={styles.fieldError}>{fieldErrors.email}</Text> : null}
          {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <PrimaryButton
            title={loading ? 'Enviando...' : 'Enviar enlace'}
            onPress={handleForgotPassword}
            loading={loading}
            disabled={!forgotEmail.trim()}
          />

          <View style={styles.linkWrap}>
            <TouchableOpacity onPress={() => switchMode('login')} accessibilityRole="button">
              <Text style={styles.linkText}>Volver a iniciar sesion</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {pollId ? (
        <Text style={styles.contextText}>Accediendo a la encuesta: {pollId}</Text>
      ) : null}
    </AppShell>
  );
};

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    padding: 4
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10
  },
  tabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5e6983'
  },
  tabTextActive: {
    color: '#4f6cff'
  },
  fieldError: {
    marginTop: -8,
    marginBottom: 10,
    color: '#b42318',
    fontSize: 13,
    lineHeight: 18
  },
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
    marginTop: 12,
    alignItems: 'center'
  },
  linkText: {
    color: '#355ad8',
    fontSize: 14,
    fontWeight: '700'
  },
  contextText: {
    marginTop: 12,
    fontSize: 13,
    color: '#475467',
    textAlign: 'center'
  }
});

export default StandaloneAccessScreen;
