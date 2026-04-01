import React, { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ResultVoter } from './types';

type Props = {
  voters: ResultVoter[];
  accentColor: string;
  maxVisible?: number;
  size?: number;
};

const AvatarStack: React.FC<Props> = ({ voters, accentColor, maxVisible = 5, size = 38 }) => {
  const visibleVoters = voters.slice(0, maxVisible);
  const animationRefs = useRef<Animated.Value[]>([]);
  const animationKey = visibleVoters.map((voter) => voter.id).join('|');

  if (animationRefs.current.length !== visibleVoters.length) {
    animationRefs.current = visibleVoters.map(() => new Animated.Value(0));
  }

  useEffect(() => {
    animationRefs.current.forEach((value) => value.setValue(0));

    Animated.stagger(
      70,
      animationRefs.current.map((value) =>
        Animated.parallel([
          Animated.timing(value, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true
          })
        ])
      )
    ).start();
  }, [animationKey, visibleVoters.length]);

  if (voters.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>Sin votos todavia</Text>
      </View>
    );
  }

  const hiddenCount = Math.max(voters.length - maxVisible, 0);

  return (
    <View style={[styles.row, { minHeight: size + 6 }]}>
      {visibleVoters.map((voter, index) => {
        const animation = animationRefs.current[index];
        const translateY = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0]
        });
        const scale = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.82, 1]
        });

        return (
          <Animated.View
            key={voter.id}
            style={[
              styles.avatarWrapper,
              {
                marginLeft: index === 0 ? 0 : -12,
                opacity: animation,
                transform: [{ translateY }, { scale }]
              }
            ]}
          >
            <Pressable style={styles.pressable} android_ripple={{ color: '#ffffff30', borderless: true }}>
              <Image
                source={{ uri: voter.avatar || undefined }}
                style={[
                  styles.avatar,
                  {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderColor: accentColor
                  }
                ]}
              />
            </Pressable>
          </Animated.View>
        );
      })}

      {hiddenCount > 0 && (
        <View
          style={[
            styles.moreBadge,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: visibleVoters.length === 0 ? 0 : -12,
              backgroundColor: accentColor
            }
          ]}
        >
          <Text style={styles.moreText}>+{hiddenCount}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  avatarWrapper: {
    shadowColor: '#091224',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4
  },
  pressable: {
    borderRadius: 999,
    overflow: 'hidden'
  },
  avatar: {
    borderWidth: 2,
    backgroundColor: '#dfe8ff'
  },
  moreBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  moreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800'
  },
  emptyState: {
    minHeight: 38,
    justifyContent: 'center'
  },
  emptyStateText: {
    color: '#6e7892',
    fontSize: 13,
    fontWeight: '600'
  }
});

export default AvatarStack;
