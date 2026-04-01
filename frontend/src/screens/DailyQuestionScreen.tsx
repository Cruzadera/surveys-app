import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import api from '../services/api';
import AppShell from '../components/ui/AppShell';
import PrimaryButton from '../components/ui/PrimaryButton';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DailyQuestion'>;
  route: RouteProp<RootStackParamList, 'DailyQuestion'>;
};

const DailyQuestionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { userId, groupId, groupName } = route.params;
  const [question, setQuestion] = useState('Cargando pregunta...');
  const [questionId, setQuestionId] = useState<number | null>(null);
  const [questionType, setQuestionType] = useState<'single' | 'multiple' | 'text'>('text');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuestion = async () => {
      if (groupId === 999) {
        setQuestionId(999);
        setQuestion('¿Quién es el/la más divertido/a del grupo?');
        setQuestionType('multiple');
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.getDailyQuestion(groupId);
        setQuestionId(data.question?.id || 0);
        setQuestion(data.question?.text || 'No hay pregunta diaria aún');
        const rawType = data.question?.tipoSeleccion || 'text';
        setQuestionType(rawType === 'single' || rawType === 'multiple' ? rawType : 'text');
      } catch (error) {
        console.error('Error pregunta diaria', error);
        Alert.alert('Error', 'No se pudo obtener la pregunta diaria');
        setQuestion('No hay pregunta diaria aún');
        setQuestionType('text');
      } finally {
        setLoading(false);
      }
    };

    loadQuestion();
  }, [groupId]);

  const goAnswer = () => {
    if (!questionId) {
      Alert.alert('Espera', 'No hay pregunta disponible aún');
      return;
    }
    const type = questionType === 'single' || questionType === 'multiple' ? questionType : 'text';
    navigation.navigate('Answer', { userId, groupId, groupName, questionId, questionText: question, questionType: type });
  };

  const goResults = () => navigation.navigate('Results', { userId, groupId, groupName, questionText: question });

  return (
    <AppShell eyebrow="Pregunta del dia" title={groupName} subtitle="Una sola pantalla clara para leer, responder y saltar a resultados.">
      <View style={styles.questionCard}>
        <Text style={styles.questionLabel}>Hoy toca</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#4f6cff" />
        ) : (
          <>
            <Text style={styles.question}>{question}</Text>
            <View style={styles.typePill}>
              <Text style={styles.typePillText}>{questionType === 'multiple' ? 'Seleccion multiple' : questionType === 'single' ? 'Seleccion unica' : 'Respuesta libre'}</Text>
            </View>
          </>
        )}
      </View>

      <PrimaryButton title="Responder" onPress={goAnswer} disabled={loading || !questionId} />
      <PrimaryButton title="Ver resultados" onPress={goResults} variant="secondary" style={styles.secondaryButton} />
    </AppShell>
  );
};

const styles = StyleSheet.create({
  questionCard: {
    borderRadius: 24,
    backgroundColor: '#eaf0ff',
    padding: 18,
    marginBottom: 18
  },
  questionLabel: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#5a6a92',
    marginBottom: 10
  },
  question: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '900',
    color: '#11182c',
    marginBottom: 14
  },
  typePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff'
  },
  typePillText: {
    color: '#38518f',
    fontWeight: '800',
    fontSize: 13
  },
  secondaryButton: {
    marginTop: 10
  }
});

export default DailyQuestionScreen;
