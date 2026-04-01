import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import api from '../services/api';
import AppShell from '../components/ui/AppShell';
import FieldInput from '../components/ui/FieldInput';
import PrimaryButton from '../components/ui/PrimaryButton';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { data } = await api.login(name);
      const userId = data.id;
      navigation.replace('Group', { userId, userName: name });
    } catch (error) {
      console.error('Error login', error);
      Alert.alert('Error', 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    navigation.replace('Group', { userId: 999, userName: 'DemoUsuario' });
  };

  return (
    <AppShell
      eyebrow="AskUs Daily"
      title="La encuesta social del grupo"
      subtitle="Entra con tu nombre y veras preguntas, votos y resultados con la misma energia visual que acabamos de darle a la app."
    >
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Rapido</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Social</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Visual</Text>
        </View>
      </View>

      <FieldInput
        label="Tu nombre"
        placeholder="Escribe como quieres aparecer"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoCorrect={false}
      />

      <PrimaryButton
        title={loading ? 'Entrando...' : 'Empezar'}
        onPress={handleLogin}
        disabled={!name.trim()}
        loading={loading}
      />
      <PrimaryButton title="Entrar demo" onPress={handleDemo} variant="secondary" style={styles.secondaryButton} />

      <Text style={styles.footerText}>Todo el flujo mantiene ahora el mismo look social y limpio.</Text>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#e8eeff',
    marginRight: 8,
    marginBottom: 8
  },
  badgeText: {
    color: '#334a82',
    fontWeight: '800',
    fontSize: 13
  },
  secondaryButton: {
    marginTop: 10
  },
  footerText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#697692',
    fontSize: 13,
    fontWeight: '600'
  }
});

export default LoginScreen;
