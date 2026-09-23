import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ThemeColors, useTheme } from '../theme/colors';
import { addSnack, getAllSnacks, getFrequentSnackTexts } from '../storage/snackStorage';
import SnackForm, { SnackFormValues } from '../components/SnackForm';

export default function LogScreen({ navigation }: any) {
  const colors = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const [confirmAnim] = useState(new Animated.Value(0));
  const [showConfirm, setShowConfirm] = useState(false);
  const [quickSelectOptions, setQuickSelectOptions] = useState<string[]>([]);

  const loadQuickSelectOptions = useCallback(() => {
    getAllSnacks().then((all) => setQuickSelectOptions(getFrequentSnackTexts(all)));
  }, []);

  useFocusEffect(loadQuickSelectOptions);

  const handleLog = async (values: SnackFormValues) => {
    await addSnack(values);
    loadQuickSelectOptions();

    // Quick, satisfying confirmation — this is the "reward" moment.
    setShowConfirm(true);
    confirmAnim.setValue(0);
    Animated.sequence([
      Animated.spring(confirmAnim, { toValue: 1, useNativeDriver: true, friction: 5 }),
      Animated.delay(700),
      Animated.timing(confirmAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setShowConfirm(false));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.heading}>Log a snack</Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Feather name="settings" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <SnackForm
            submitLabel="Log it"
            onSubmit={handleLog}
            resetAfterSubmit
            quickSelectOptions={quickSelectOptions}
          />

          <TouchableOpacity onPress={() => navigation.navigate('Today')}>
            <Text style={styles.linkText}>View log →</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>

      {showConfirm && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.confirmBadge,
            { top: insets.top + 12 },
            {
              opacity: confirmAnim,
              transform: [
                {
                  scale: confirmAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.85, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.confirmText}>Logged</Text>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 80,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    heading: {
      fontSize: 26,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    settingsButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    linkText: {
      color: colors.textSecondary,
      fontSize: 15,
      textAlign: 'center',
    },
    confirmBadge: {
      position: 'absolute',
      alignSelf: 'center',
      backgroundColor: colors.accent,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
    },
    confirmText: {
      color: colors.onAccent,
      fontSize: 14,
      fontWeight: '500',
    },
  });
}
