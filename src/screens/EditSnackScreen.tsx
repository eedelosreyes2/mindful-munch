import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  KeyboardAvoidingView,
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
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
            />

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.linkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={styles.deleteLinkText}>Delete this entry</Text>
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
      paddingHorizontal: 24,
      paddingTop: 80,
    },
    heading: {
      fontSize: 26,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 20,
    },
    footer: {
      paddingHorizontal: 24,
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
