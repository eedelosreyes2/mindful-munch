import React, { useState } from 'react';
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
import { Snack } from '../types/snack';
import { updateSnack, deleteSnack } from '../storage/snackStorage';
import SnackForm, { SnackFormValues } from '../components/SnackForm';

export default function EditSnackScreen({ navigation, route }: any) {
  const colors = useTheme();
  const styles = getStyles(colors);
  const snack: Snack = route.params.snack;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);

  const handleSave = async (values: SnackFormValues) => {
    await updateSnack(snack.id, values);
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert('Delete this entry?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSnack(snack.id);
          navigation.goBack();
        },
      },
    ]);
  };

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
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
      paddingTop: 80,
      paddingBottom: 24,
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
