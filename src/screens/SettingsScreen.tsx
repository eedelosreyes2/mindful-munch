import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { ThemeColors, ThemePreference, useTheme, useThemeSettings } from '../theme/colors';
import { useScreenTopPadding } from '../theme/layout';
import { exportSnacks } from '../storage/exportSnacks';
import { isImportAvailable, pickAndImportSnacks } from '../storage/importSnacks';
import SegmentedControl from '../components/SegmentedControl';
import { isCloudSyncAvailable, signInWithGoogle, signOut, useSession } from '../lib/auth';
import { notify } from '../lib/notify';
import {
  disableWeeklyPush,
  enableWeeklyPush,
  getWeeklyPushAvailability,
  isWeeklyPushEnabled,
} from '../lib/weeklyPush';

export default function SettingsScreen({ navigation }: any) {
  const colors = useTheme();
  const styles = getStyles(colors);
  const topPadding = useScreenTopPadding(80);
  const { preference, setPreference } = useThemeSettings();
  const session = useSession();
  const pushAvailability = getWeeklyPushAvailability();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    isWeeklyPushEnabled().then(setPushEnabled);
  }, [session]);

  const handleExport = async () => {
    try {
      await exportSnacks();
    } catch (err) {
      notify("Couldn't export", 'Something went wrong while preparing your data.');
    }
  };

  const handleImport = async () => {
    try {
      const result = await pickAndImportSnacks();
      if (result.status === 'invalid') {
        notify("Couldn't import", "That file doesn't look like a MindfulMunch export.");
      } else if (result.status === 'imported') {
        const snackWord = result.count === 1 ? 'snack' : 'snacks';
        notify('Import complete', `Imported ${result.count} ${snackWord}.`);
      }
    } catch (err) {
      console.error('Failed to import snacks', err);
      notify("Couldn't import", 'Check your connection and try again.');
    }
  };

  const handleTogglePush = async (turnOn: boolean) => {
    setPushBusy(true);
    try {
      if (turnOn) {
        const result = await enableWeeklyPush();
        if (result === 'denied') {
          notify(
            'Notifications are off',
            'Allow notifications for MindfulMunch in your browser or device settings, then try again.'
          );
        }
        setPushEnabled(result === 'enabled');
      } else {
        await disableWeeklyPush();
        setPushEnabled(false);
      }
    } catch (err) {
      console.error('Failed to update the weekly insight', err);
      notify("Couldn't update notifications", 'Check your connection and try again.');
    } finally {
      setPushBusy(false);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Failed to sign in', err);
      notify("Couldn't sign in", 'Something went wrong. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Failed to sign out', err);
      notify("Couldn't sign out", 'Check your connection and try again.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Settings</Text>

        {isCloudSyncAvailable && (
          <>
            <Text style={styles.sectionLabel}>Account</Text>
            {session ? (
              <View style={[styles.row, styles.accountRow]}>
                <View style={styles.accountText}>
                  <Text style={styles.rowHint}>Signed in as</Text>
                  <Text style={styles.rowText} numberOfLines={1}>
                    {session.user.email}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleSignOut}>
                  <Text style={styles.signOutText}>Sign out</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.row} onPress={handleSignIn}>
                <Text style={styles.rowText}>Sign in with Google</Text>
                <Text style={[styles.rowHint, styles.rowHintBelow]}>
                  Keep your snacks in sync across devices.
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {session && pushAvailability !== 'unsupported' && (
          <>
            <Text style={styles.sectionLabel}>Notifications</Text>
            <View style={[styles.row, styles.accountRow]}>
              <View style={styles.accountText}>
                <Text style={styles.rowText}>Weekly insight</Text>
                <Text style={styles.rowHint}>
                  {pushAvailability === 'available'
                    ? 'A short summary of your week, Sundays at 6 PM.'
                    : 'Add MindfulMunch to your Home Screen (Share → Add to Home Screen) to turn this on.'}
                </Text>
              </View>
              {pushAvailability === 'available' && (
                <Switch
                  value={pushEnabled}
                  onValueChange={handleTogglePush}
                  disabled={pushBusy}
                  trackColor={{ true: colors.accent, false: colors.border }}
                />
              )}
            </View>
          </>
        )}

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
        <View style={styles.rowGroup}>
          <TouchableOpacity style={[styles.row, styles.rowInGroup]} onPress={handleExport}>
            <Text style={styles.rowText}>Export data</Text>
          </TouchableOpacity>
          {isImportAvailable && (
            <TouchableOpacity style={[styles.row, styles.rowInGroup]} onPress={handleImport}>
              <Text style={styles.rowText}>Import data</Text>
              <Text style={[styles.rowHint, styles.rowHintBelow]}>
                Add snacks from an exported MindfulMunch file.
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionLabel}>About</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('Onboarding', { viewOnly: true })}
        >
          <Text style={styles.rowText}>View onboarding</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity style={styles.doneButton} onPress={() => navigation.goBack()}>
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
      paddingBottom: 40,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 8,
    },
    doneButton: {
      paddingTop: 16,
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
    rowGroup: {
      gap: 8,
      marginBottom: 28,
    },
    rowInGroup: {
      marginBottom: 0,
    },
    rowHint: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    rowHintBelow: {
      marginTop: 4,
    },
    accountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    accountText: {
      flex: 1,
      gap: 2,
    },
    signOutText: {
      fontSize: 15,
      fontWeight: '600',
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
