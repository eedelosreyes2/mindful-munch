import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { ThemeColors, useTheme } from '../theme/colors';
import { useScreenTopPadding } from '../theme/layout';
import { Snack } from '../types/snack';
import { deleteSnack, getAllSnacks, updateSnack } from '../storage/snackStorage';
import SnackForm, { SnackFormValues } from '../components/SnackForm';
import { notify } from '../lib/notify';

export default function EditSnackScreen({ navigation, route }: any) {
  const colors = useTheme();
  const styles = getStyles(colors);
  const topPadding = useScreenTopPadding(80);
  const snackId: string = route.params.snackId;
  const [snack, setSnack] = useState<Snack | null | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);

  useEffect(() => {
    getAllSnacks().then((all) => setSnack(all.find((s) => s.id === snackId) ?? null));
  }, [snackId]);

  const handleSave = async (values: SnackFormValues) => {
    await updateSnack(snackId, values);
    navigation.goBack();
  };

  const confirmDelete = async () => {
    try {
      await deleteSnack(snackId);
      navigation.goBack();
    } catch (err) {
      console.error('Failed to delete snack', err);
      notify("Couldn't delete", 'Check your connection and try again.');
    }
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this entry?')) confirmDelete();
      return;
    }

    Alert.alert('Delete this entry?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: confirmDelete },
    ]);
  };

  if (snack === undefined) return <View style={styles.container} />;

  if (snack === null) {
    return (
      <View style={[styles.container, styles.missing, { paddingTop: topPadding }]}>
        <Text style={styles.missingText}>This entry isn't available anymore.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Today')}>
          <Text style={styles.linkText}>Back to log</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={styles.footer}
        pointerEvents={pickerOpen ? 'none' : 'auto'}
        onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
      >
        <TouchableOpacity onPress={handleDelete}>
          <Text style={styles.deleteLinkText}>Delete this entry</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={[styles.avoider, { bottom: pickerOpen ? 0 : footerHeight }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingTop: topPadding }]}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
            disabled={Platform.OS === 'web'}
          >
            <View>
              <Text style={styles.heading}>Edit snack</Text>

              <SnackForm
                initialText={snack.text}
                initialReason={snack.reason}
                initialTimestamp={snack.timestamp}
                startWithCustomTime
                submitLabel="Save changes"
                onSubmit={handleSave}
                onPickerVisibilityChange={setPickerOpen}
              />

              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.linkText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      position: 'relative',
    },
    avoider: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
    missing: {
      paddingHorizontal: 24,
      gap: 16,
    },
    missingText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    heading: {
      fontSize: 26,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 20,
    },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background,
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 40,
    },
    linkText: {
      color: colors.textSecondary,
      fontSize: 15,
      textAlign: 'center',
    },
    deleteLinkText: {
      color: colors.danger,
      fontSize: 15,
      textAlign: 'center',
    },
  });
}
