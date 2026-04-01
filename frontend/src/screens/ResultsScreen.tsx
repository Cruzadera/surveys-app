import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import api from '../services/api';
import ResultDetailItem from '../components/results/ResultDetailItem';
import { ResultDetail, ResultVoter } from '../components/results/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Results'>;
  route: RouteProp<RootStackParamList, 'Results'>;
};

type RankingApiItem = {
  id?: string | number;
  name: string;
  avatar?: string;
  color?: string;
  score: number;
  voters: Array<{
    id?: string | number;
    name: string;
    avatar?: string;
  }>;
};

const COLORS = ['#ffb703', '#ff6b6b', '#6f42c1', '#4f6cff', '#20c997', '#fd7e14'];

const getAvatarUrl = (name: string, background = 'ffffff', color = '1f2a44', size = 96) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${background.replace('#', '')}&color=${color.replace('#', '')}&rounded=true&size=${size}`;

const normalizeVoter = (voter: RankingApiItem['voters'][number], index: number, paletteColor: string): ResultVoter => ({
  id: String(voter.id ?? `${voter.name}-${index}`),
  name: voter.name,
  avatar: voter.avatar || getAvatarUrl(voter.name, 'ffffff', paletteColor)
});

const normalizeRankingItem = (item: RankingApiItem, index: number): ResultDetail => {
  const color = item.color || COLORS[index % COLORS.length];
  return {
    id: String(item.id ?? `${item.name}-${index}`),
    name: item.name,
    avatar: item.avatar || getAvatarUrl(item.name, color, 'ffffff'),
    color,
    score: item.score,
    voters: (item.voters || []).map((voter, voterIndex) => normalizeVoter(voter, voterIndex, color))
  };
};

const ResultsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { userId, groupId, groupName, questionText } = route.params;
  const [rankings, setRankings] = useState<ResultDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(540)).current;

  useEffect(() => {
    const loadResults = async () => {
      try {
        if (groupId === 999) {
          setRankings(
            [
              {
                id: 'adrian',
                name: 'Adrian',
                avatar: getAvatarUrl('Adrian', 'ffb703', 'ffffff'),
                color: '#ffb703',
                score: 23,
                voters: [
                  { id: 'dani', name: 'Dani', avatar: getAvatarUrl('Dani', 'ffffff', 'ffb703') },
                  { id: 'el-cojo', name: 'El cojo', avatar: getAvatarUrl('El cojo', 'ffffff', 'ffb703') },
                  { id: 'marco', name: 'Marco', avatar: getAvatarUrl('Marco', 'ffffff', 'ffb703') }
                ]
              },
              {
                id: 'dani',
                name: 'Dani',
                avatar: getAvatarUrl('Dani', 'ff6b6b', 'ffffff'),
                color: '#ff6b6b',
                score: 23,
                voters: [
                  { id: 'adrian', name: 'Adrian', avatar: getAvatarUrl('Adrian', 'ffffff', 'ff6b6b') },
                  { id: 'virgi', name: 'Virgi', avatar: getAvatarUrl('Virgi', 'ffffff', 'ff6b6b') },
                  { id: 'elena', name: 'Elena', avatar: getAvatarUrl('Elena', 'ffffff', 'ff6b6b') }
                ]
              },
              {
                id: 'el-cojo',
                name: 'El cojo',
                avatar: getAvatarUrl('El cojo', '6f42c1', 'ffffff'),
                color: '#6f42c1',
                score: 23,
                voters: [
                  { id: 'adrian', name: 'Adrian', avatar: getAvatarUrl('Adrian', 'ffffff', '6f42c1') },
                  { id: 'marco', name: 'Marco', avatar: getAvatarUrl('Marco', 'ffffff', '6f42c1') },
                  { id: 'dani', name: 'Dani', avatar: getAvatarUrl('Dani', 'ffffff', '6f42c1') }
                ]
              },
              {
                id: 'marco',
                name: 'Marco',
                avatar: getAvatarUrl('Marco', '4f6cff', 'ffffff'),
                color: '#4f6cff',
                score: 15,
                voters: [
                  { id: 'virgi', name: 'Virgi', avatar: getAvatarUrl('Virgi', 'ffffff', '4f6cff') },
                  { id: 'elena', name: 'Elena', avatar: getAvatarUrl('Elena', 'ffffff', '4f6cff') }
                ]
              },
              {
                id: 'virgi',
                name: 'Virgi',
                avatar: getAvatarUrl('Virgi', '20c997', 'ffffff'),
                color: '#20c997',
                score: 7,
                voters: [{ id: 'dani', name: 'Dani', avatar: getAvatarUrl('Dani', 'ffffff', '20c997') }]
              },
              {
                id: 'elena',
                name: 'Elena',
                avatar: getAvatarUrl('Elena', 'fd7e14', 'ffffff'),
                color: '#fd7e14',
                score: 7,
                voters: [{ id: 'adrian', name: 'Adrian', avatar: getAvatarUrl('Adrian', 'ffffff', 'fd7e14') }]
              }
            ].sort((a, b) => b.score - a.score)
          );
          return;
        }

        const { data } = await api.getResults(groupId);
        setRankings(
          ((data.ranking || []) as RankingApiItem[])
            .map((item, index) => normalizeRankingItem(item, index))
            .sort((a, b) => b.score - a.score)
        );
      } catch (error) {
        console.error('Error resultados', error);
        Alert.alert('Error', 'No se pudieron obtener los resultados del grupo');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [groupId]);

  useEffect(() => {
    if (loading) {
      return;
    }

    setIsVisible(true);
    overlayOpacity.setValue(0);
    sheetTranslateY.setValue(520);

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true
      }),
      Animated.spring(sheetTranslateY, {
        toValue: 0,
        damping: 18,
        stiffness: 140,
        mass: 0.9,
        useNativeDriver: true
      })
    ]).start();
  }, [loading, overlayOpacity, sheetTranslateY]);

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 520,
        duration: 220,
        useNativeDriver: true
      })
    ]).start(({ finished }) => {
      if (finished) {
        setIsVisible(false);
        navigation.navigate('DailyQuestion', { userId, groupId, groupName });
      }
    });
  };

  const filledCount = new Set(rankings.flatMap((item) => item.voters.map((voter) => voter.id))).size;

  return (
    <View style={styles.container}>
      <View style={styles.backgroundHaloTop} />
      <View style={styles.backgroundHaloBottom} />

      {loading ? (
        <View style={styles.loaderCard}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loaderText}>Preparando el detalle social de votos...</Text>
        </View>
      ) : (
        <Modal visible={isVisible} transparent animationType="none" onRequestClose={closeModal}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
            <Pressable style={styles.overlayDismissArea} onPress={closeModal} />

            <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}>
              <View style={styles.handle} />
              <Text style={styles.eyebrow}>Resumen social</Text>
              <Text style={styles.title}>{questionText || 'Resultados de la pregunta'}</Text>
              <Text style={styles.subTitle}>{groupName}</Text>
              <Text style={styles.infoText}>{filledCount} participantes visibles en menos de 2 segundos</Text>

              {rankings.length > 0 ? (
                <FlatList
                  data={rankings}
                  keyExtractor={(item) => item.id}
                  style={styles.list}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                  renderItem={({ item, index }) => <ResultDetailItem item={item} isLeader={index === 0} />}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Aun no se han registrado votos para mostrar</Text>
                </View>
              )}

              <View style={styles.footer}>
                <Pressable style={styles.closeButton} onPress={closeModal} android_ripple={{ color: '#ffffff20' }}>
                  <Text style={styles.closeButtonText}>Cerrar</Text>
                </Pressable>
              </View>
            </Animated.View>
          </Animated.View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1324',
    alignItems: 'center',
    justifyContent: 'center'
  },
  backgroundHaloTop: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#24385f'
  },
  backgroundHaloBottom: {
    position: 'absolute',
    bottom: -70,
    left: -30,
    width: 210,
    height: 210,
    borderRadius: 120,
    backgroundColor: '#1b2742'
  },
  loaderCard: {
    width: '84%',
    borderRadius: 30,
    paddingVertical: 28,
    paddingHorizontal: 24,
    backgroundColor: '#18233dcf',
    alignItems: 'center'
  },
  loaderText: {
    marginTop: 14,
    color: '#dfe7ff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center'
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 10, 19, 0.62)',
    justifyContent: 'flex-end'
  },
  overlayDismissArea: {
    flex: 1
  },
  sheet: {
    width: '100%',
    alignSelf: 'stretch',
    maxHeight: '88%',
    minHeight: '56%',
    paddingTop: 12,
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#f6f8ff',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 18,
    overflow: 'hidden'
  },
  handle: {
    alignSelf: 'center',
    width: 54,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#d2d9ef',
    marginBottom: 14
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#63708f',
    textAlign: 'center'
  },
  title: {
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '900',
    color: '#11182c',
    textAlign: 'center',
    marginTop: 8
  },
  subTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#66738f',
    textAlign: 'center',
    marginTop: 6
  },
  infoText: {
    marginTop: 10,
    marginBottom: 18,
    textAlign: 'center',
    color: '#7b879f',
    fontSize: 14,
    fontWeight: '600'
  },
  listContent: {
    paddingBottom: 14
  },
  list: {
    flexGrow: 0
  },
  separator: {
    height: 14
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    color: '#5e6983',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center'
  },
  footer: {
    paddingTop: 10,
    backgroundColor: '#f6f8ff'
  },
  closeButton: {
    minHeight: 56,
    borderRadius: 20,
    backgroundColor: '#131c33',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800'
  }
});

export default ResultsScreen;
