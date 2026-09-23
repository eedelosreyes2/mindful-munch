import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors, useTheme } from '../theme/colors';
import { REASON_TAGS, REASON_LABELS } from '../types/snack';

export default function ReasonLegend() {
  const colors = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.row}>
      {REASON_TAGS.map((tag) => (
        <View key={tag} style={styles.item}>
          <View style={[styles.swatch, { backgroundColor: colors.reasonColors[tag] }]} />
          <Text style={styles.label}>{REASON_LABELS[tag]}</Text>
        </View>
      ))}
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 14,
      marginBottom: 16,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    swatch: {
      width: 8,
      height: 8,
      borderRadius: 2,
    },
    label: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });
}
