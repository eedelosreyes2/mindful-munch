import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, useTheme } from '../theme/colors';

const ONBOARDING_KEY = 'onboarded:v1';
const SWIPE_THRESHOLD = 60;

const SLIDES = [
  'Log snacks in seconds. See when and why they happen.',
  'No calories. No goals. Just patterns.',
];

export async function hasOnboarded(): Promise<boolean> {
  const val = await AsyncStorage.getItem(ONBOARDING_KEY);
  return val === 'true';
}

export default function OnboardingScreen({ navigation, route }: any) {
  const colors = useTheme();
  const styles = getStyles(colors);
  const [step, setStep] = useState(0);
  const stepRef = useRef(step);
  const isLast = step === SLIDES.length - 1;
  const viewOnly = route?.params?.viewOnly ?? false;

  const paneWidth = Dimensions.get('window').width;
  const drag = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    stepRef.current = step;
    Animated.spring(drag, { toValue: -step * paneWidth, friction: 8, useNativeDriver: true }).start();
  }, [step]);

  useEffect(() => {
    if (viewOnly) {
      navigation.setOptions({ gestureEnabled: false });
    }
  }, [navigation, viewOnly]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderMove: (_, gestureState) => {
        const base = -stepRef.current * paneWidth;
        let next = base + gestureState.dx;
        if (next > 0) {
          next = next / (1 + Math.abs(next) / 60);
        }
        const maxNegative = -(SLIDES.length - 1) * paneWidth;
        if (next < maxNegative) {
          const over = next - maxNegative;
          next = maxNegative + over / (1 + Math.abs(over) / 60);
        }
        drag.setValue(next);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx <= -SWIPE_THRESHOLD && stepRef.current < SLIDES.length - 1) {
          setStep(stepRef.current + 1);
        } else if (gestureState.dx >= SWIPE_THRESHOLD && stepRef.current > 0) {
          setStep(stepRef.current - 1);
        } else {
          Animated.spring(drag, {
            toValue: -stepRef.current * paneWidth,
            friction: 8,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(drag, {
          toValue: -stepRef.current * paneWidth,
          friction: 8,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const handleNext = async () => {
    if (!isLast) {
      setStep(step + 1);
      return;
    }
    if (viewOnly) {
      navigation.goBack();
      return;
    }
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    navigation.replace('Log');
  };

  return (
    <View style={styles.container}>
      <View style={styles.viewport} {...panResponder.panHandlers}>
        <Animated.View style={[styles.track, { transform: [{ translateX: drag }] }]}>
          {SLIDES.map((slide, i) => (
            <View key={i} style={[styles.pane, { width: paneWidth }]}>
              <Text style={styles.text}>{slide}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === step && styles.dotActive]}
            />
          ))}
        </View>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {isLast ? (viewOnly ? 'Done' : 'Get started') : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'space-between',
    },
    viewport: {
      flex: 1,
      overflow: 'hidden',
    },
    track: {
      flex: 1,
      flexDirection: 'row',
    },
    pane: {
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    text: {
      fontSize: 24,
      fontWeight: '500',
      color: colors.textPrimary,
      lineHeight: 32,
    },
    footer: {
      paddingHorizontal: 32,
      paddingBottom: 48,
    },
    dots: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 24,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
    },
    dotActive: {
      backgroundColor: colors.textPrimary,
    },
    button: {
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
    },
    buttonText: {
      color: colors.onAccent,
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
