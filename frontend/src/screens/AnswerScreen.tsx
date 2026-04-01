import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import api from '../services/api';
import { mockUsers } from '../data/mockUsers';
import AppShell from '../components/ui/AppShell';
import PrimaryButton from '../components/ui/PrimaryButton';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Answer'>;
  route: RouteProp<RootStackParamList, 'Answer'>;
};

const AnswerScreen: React.FC<Props> = ({ navigation, route }) => {
  const { userId, groupId, groupName, questionId, questionText, questionType } = route.params;
  const [answerText, setAnswerText] = useState('');
  const [selectedTargetIds, setSelectedTargetIds] = useState<number[]>([]);
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleTarget = (selectedId: number) => {
    if (questionType === 'single') {
      setSelectedTargetIds([selectedId]);
      return;
    }
    setSelectedTargetIds((prev) =>
      prev.includes(selectedId) ? prev.filter((id) => id !== selectedId) : [...prev, selectedId]
    );
  };

  const submitAnswer = async () => {
    if (questionType === 'single' && selectedTargetIds.length !== 1) {
      Alert.alert('Selecciona', 'Debes elegir exactamente una persona.');
      return;
    }

    if (questionType === 'multiple' && selectedTargetIds.length === 0) {
      Alert.alert('Selecciona', 'Debes elegir al menos una persona.');
      return;
    }

    if (questionType === 'text' && !answerText.trim()) {
      Alert.alert('Texto requerido', 'Escribe una respuesta.');
      return;
    }

    setLoading(true);
    try {
      if (groupId === 999) {
        navigation.replace('Results', { userId, groupId, groupName, questionText });
        return;
      }

      if (questionType === 'single' || questionType === 'multiple') {
        const targetAnswers = selectedTargetIds.map((targetId) => {
          const targetUser = mockUsers.find((u) => u.id === targetId);
          return {
            questionId,
            userFromId: userId,
            userTargetId: targetId,
            groupId,
            isAnonymous: anonymous,
            answerText: targetUser ? targetUser.name : 'Seleccionado',
            date: new Date().toISOString()
          };
        });

        for (const payload of targetAnswers) {
          await api.submitAnswer(payload);
        }
      } else {
        await api.submitAnswer({
          questionId,
          userFromId: userId,
          userTargetId: null,
          groupId,
          isAnonymous: anonymous,
          answerText: answerText.trim(),
          date: new Date().toISOString()
        });
      }

      navigation.replace('Results', { userId, groupId, groupName, questionText });
    } catch (error) {
      console.error('Error enviar respuesta', error);
      Alert.alert('Error', 'No se pudo enviar la respuesta');
    } finally {
      setLoading(false);
    }
  };

  const isSelectionMode = questionType === 'single' || questionType === 'multiple';

  return (
    <AppShell eyebrow="Responder" title={groupName} subtitle={questionText}>
      {isSelectionMode ? (
        <ScrollView style={styles.pickerContainer} showsVerticalScrollIndicator={false}>
          {mockUsers.map((user) => {
            const selected = selectedTargetIds.includes(user.id);
            return (
              <TouchableOpacity
                key={user.id}
                style={[
                  styles.userItem,
                  selected && {
                    backgroundColor: `${user.color}14`,
                    borderColor: user.color
                  }
                ]}
                onPress={() => toggleTarget(user.id)}
                activeOpacity={0.9}
              >
                <View style={styles.userIdentity}>
                  <View style={[styles.avatarRing, { borderColor: user.color }]}>
                    <Image source={{ uri: user.avatar }} style={styles.avatar} />
                  </View>
                  <View>
                    <Text style={styles.userItemText}>{user.name}</Text>
                    <Text style={styles.userItemHint}>{selected ? 'Seleccionado' : 'Toca para votar'}</Text>
                  </View>
                </View>
                <View style={[styles.checkBadge, selected && { backgroundColor: user.color }]}>
                  <Text style={[styles.checkMark, selected && styles.checkMarkSelected]}>{selected ? '✓' : '+'}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <TextInput
          style={styles.input}
          placeholder="Escribe tu respuesta..."
          placeholderTextColor="#8a95b3"
          value={answerText}
          onChangeText={setAnswerText}
          multiline
          maxLength={500}
        />
      )}

      <View style={styles.switchRow}>
        <View>
          <Text style={styles.switchTitle}>Responder de forma anonima</Text>
          <Text style={styles.switchHint}>Tu nombre no aparecera al enviar</Text>
        </View>
        <Switch value={anonymous} onValueChange={setAnonymous} trackColor={{ false: '#ced7f2', true: '#aab9ff' }} thumbColor={anonymous ? '#4f6cff' : '#ffffff'} />
      </View>

      <PrimaryButton
        title={
          loading
            ? 'Enviando...'
            : isSelectionMode
              ? questionType === 'single'
                ? 'Elegir y enviar'
                : 'Enviar seleccion'
              : 'Enviar respuesta'
        }
        onPress={submitAnswer}
        loading={loading}
      />
    </AppShell>
  );
};

const styles = StyleSheet.create({
  pickerContainer: {
    maxHeight: 360,
    marginBottom: 16
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: '#dbe2f5',
    borderRadius: 22,
    marginBottom: 10,
    backgroundColor: '#fff'
  },
  userIdentity: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    padding: 2,
    backgroundColor: '#fff',
    marginRight: 12
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 999
  },
  userItemText: {
    fontSize: 16,
    color: '#1a2440',
    fontWeight: '800'
  },
  userItemHint: {
    marginTop: 4,
    fontSize: 13,
    color: '#66738f',
    fontWeight: '600'
  },
  checkBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#edf1ff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkMark: {
    fontSize: 18,
    fontWeight: '900',
    color: '#3b4e7f'
  },
  checkMarkSelected: {
    color: '#fff'
  },
  input: {
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#d7def4',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
    color: '#101a33',
    fontSize: 16,
    marginBottom: 16
  },
  switchRow: {
    marginBottom: 18,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#18233d'
  },
  switchHint: {
    marginTop: 4,
    fontSize: 13,
    color: '#65718d',
    fontWeight: '600'
  }
});

export default AnswerScreen;
