import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import AvatarStack from './AvatarStack';
import { ResultDetail } from './types';

type Props = {
  item: ResultDetail;
  isLeader?: boolean;
};

const ResultDetailItem: React.FC<Props> = ({ item, isLeader = false }) => {
  return (
    <View
      style={[
        styles.card,
        isLeader && styles.cardLeader,
        {
          borderColor: `${item.color}22`,
          backgroundColor: isLeader ? `${item.color}14` : '#ffffff'
        }
      ]}
    >
      <View style={[styles.glow, { backgroundColor: `${item.color}${isLeader ? '30' : '18'}` }]} />

      <View style={styles.header}>
        <View style={styles.identityBlock}>
          <View style={[styles.avatarRing, { borderColor: item.color }]}>
            <Image source={{ uri: item.avatar || undefined }} style={styles.avatar} />
          </View>

          <View style={styles.nameBlock}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{item.name}</Text>
              {isLeader && <Text style={styles.leaderTag}>Top</Text>}
            </View>
            {/* <Text style={styles.helperText}>Quien le voto se entiende al instante</Text> */}
          </View>
        </View>

        <View style={[styles.scoreBadge, { backgroundColor: item.color }]}>
          <Text style={styles.scoreValue}>{item.score}</Text>
          <Text style={styles.scoreLabel}>votos</Text>
        </View>
      </View>

      <Pressable style={[styles.stackPanel, { backgroundColor: `${item.color}12` }]}>
        <Text style={styles.stackLabel}>Le votaron</Text>
        <AvatarStack voters={item.voters} accentColor={item.color} size={isLeader ? 40 : 36} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    overflow: 'hidden'
  },
  cardLeader: {
    padding: 20
  },
  glow: {
    position: 'absolute',
    top: -20,
    right: 10,
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  identityBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
    minWidth: 0,
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    padding: 3,
    backgroundColor: '#fff'
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 999
  },
  nameBlock: {
    marginLeft: 14,
    flex: 1,
    minWidth: 0, // 👈 🔥 clave para evitar overflow de texto
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  name: {
    fontSize: 19,
    fontWeight: '800',
    color: '#101a33',
    flexShrink: 1, // 👈 🔥 importante
  },
  leaderTag: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    backgroundColor: '#101a33'
  },
  helperText: {
    marginTop: 6,
    fontSize: 13,
    color: '#556079',
    fontWeight: '600'
  },
  scoreBadge: {
    minWidth: 60,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0, // 👈 evita comportamientos raros
  },
  scoreValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900'
  },
  scoreLabel: {
    color: '#eef4ff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4
  },
  stackPanel: {
    marginTop: 18,
    borderRadius: 18,
    padding: 14
  },
  stackLabel: {
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '700',
    color: '#52607d',
    textTransform: 'uppercase',
    letterSpacing: 0.8
  }
});

export default ResultDetailItem;
