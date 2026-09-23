import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeColors, useTheme } from '../theme/colors';

interface Option<T extends string> {
  label: string;
  value: T;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export default function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const colors = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.segment, isActive && styles.segmentActive]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceMuted,
      borderRadius: 12,
      padding: 4,
      marginBottom: 24,
    },
    segment: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 9,
      alignItems: 'center',
    },
    segmentActive: {
      backgroundColor: colors.surface,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    labelActive: {
      color: colors.textPrimary,
      fontWeight: '600',
    },
  });
}
