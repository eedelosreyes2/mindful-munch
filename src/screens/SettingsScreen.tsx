import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ThemeColors, ThemePreference, useTheme, useThemeSettings } from '../theme/colors';
import { exportSnacks } from '../storage/exportSnacks';
import SegmentedControl from '../components/SegmentedControl';

export default function SettingsScreen({ navigation }: any) {
  const colors = useTheme();
  const styles = getStyles(colors);
  const { preference, setPreference } = useThemeSettings();

  const handleExport = async () => {
    try {
      await exportSnacks();
    } catch (err) {
      Alert.alert("Couldn't export", 'Something went wrong while preparing your data.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Settings</Text>

        <Text style={styles.sectionLabel}>Appearance</Text>
        <SegmentedControl<ThemePreference>
          options={[
            { label: 'System', value: 'system' },
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
          ]}
          value={preference}
          onChange={setPreference}
        />

        <Text style={styles.sectionLabel}>Data</Text>
        <TouchableOpacity style={styles.row} onPress={handleExport}>
          <Text style={styles.rowText}>Export data</Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>About</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('Onboarding', { viewOnly: true })}
        >
          <Text style={styles.rowText}>View onboarding</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.doneText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 80,
      paddingBottom: 40,
    },
    content: {
      flex: 1,
    },
    heading: {
      fontSize: 26,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 28,
    },
    sectionLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    row: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 14,
      paddingHorizontal: 18,
      paddingVertical: 16,
      marginBottom: 28,
    },
    rowText: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    doneText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
    },
  });
}
