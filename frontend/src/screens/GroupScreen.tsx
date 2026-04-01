import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import api from '../services/api';
import AppShell from '../components/ui/AppShell';
import FieldInput from '../components/ui/FieldInput';
import PrimaryButton from '../components/ui/PrimaryButton';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Group'>;
  route: RouteProp<RootStackParamList, 'Group'>;
};

const GroupScreen: React.FC<Props> = ({ navigation, route }) => {
  const { userId, userName } = route.params;
  const [groupCode, setGroupCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);

  const goToDailyQuestion = (groupId: number, groupNameValue: string) => {
    navigation.navigate('DailyQuestion', { userId, groupId, groupName: groupNameValue });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Valida', 'Ingresa nombre de grupo');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.createGroup(groupName.trim());
      goToDailyQuestion(data.id, data.name);
    } catch (error) {
      console.error('Error crear grupo', error);
      Alert.alert('Error', 'No se pudo crear grupo');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!groupCode.trim()) {
      Alert.alert('Valida', 'Ingresa código de grupo');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.joinGroup(groupCode.trim());
      goToDailyQuestion(data.id, data.name);
    } catch (error) {
      console.error('Error unirse grupo', error);
      Alert.alert('Error', 'No se pudo unir al grupo');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoGroup = () => {
    goToDailyQuestion(999, 'Grupo Demo');
  };

  return (
    <AppShell
      eyebrow="Tu circulo"
      title={`Hola ${userName}`}
      subtitle="Crea un espacio nuevo o entra en uno existente. La pantalla ahora sigue el mismo tono social, redondeado y claro que resultados."
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Crear grupo</Text>
        <FieldInput
          label="Nombre del grupo"
          placeholder="Ej. Roomies, Oficina o Amigos"
          value={groupName}
          onChangeText={setGroupName}
        />
        <PrimaryButton title={loading ? 'Creando...' : 'Crear grupo'} onPress={handleCreateGroup} loading={loading} />
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Unirte con codigo</Text>
        <FieldInput
          label="Codigo de invitacion"
          placeholder="Pega aqui tu codigo"
          value={groupCode}
          onChangeText={setGroupCode}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <PrimaryButton
          title={loading ? 'Uniendote...' : 'Unirse al grupo'}
          onPress={handleJoinGroup}
          disabled={!groupCode.trim()}
          loading={loading}
          variant="secondary"
        />
      </View>

      <PrimaryButton title="Usar grupo demo" onPress={handleDemoGroup} variant="secondary" style={styles.demoButton} />
    </AppShell>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 8
  },
  sectionTitle: {
    marginBottom: 14,
    fontSize: 18,
    fontWeight: '800',
    color: '#11182c'
  },
  divider: {
    height: 1,
    backgroundColor: '#dde4f7',
    marginVertical: 18
  },
  demoButton: {
    marginTop: 12
  }
});

export default GroupScreen;
