import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, useTheme } from '../theme/colors';

const ONBOARDING_KEY = 'onboarded:v1';

const SLIDES = [
  'Log snacks in seconds. See when and why they happen.',
  'No calories. No goals. Just patterns.',
];

export async function hasOnboarded(): Promise<boolean> {
  const val = await AsyncStorage.getItem(ONBOARDING_KEY);
  return val === 'true';
}

export default function OnboardingScreen({ navigation }: any) {
  const colors = useTheme();
  const styles = getStyles(colors);
  const [step, setStep] = useState(0);
  const isLast = step === SLIDES.length - 1;

  const handleNext = async () => {
    if (isLast) {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      navigation.replace('Log');
    } else {
      setStep(step + 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>{SLIDES[step]}</Text>
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
          <Text style={styles.buttonText}>{isLast ? 'Get started' : 'Next'}</Text>
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
    content: {
      flex: 1,
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
