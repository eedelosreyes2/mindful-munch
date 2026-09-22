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
import { colors } from '../theme/colors';
import { Snack } from '../types/snack';
import { updateSnack, deleteSnack } from '../storage/snackStorage';
import SnackForm, { SnackFormValues } from '../components/SnackForm';

export default function EditSnackScreen({ navigation, route }: any) {
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.content}>
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

          <TouchableOpacity style={styles.deleteLink} onPress={handleDelete}>
            <Text style={styles.deleteLinkText}>Delete this entry</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  linkText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
  deleteLink: {
    marginTop: 20,
  },
  deleteLinkText: {
    color: colors.danger,
    fontSize: 15,
    textAlign: 'center',
  },
});
