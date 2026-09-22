import React, { useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { addSnack } from '../storage/snackStorage';
import SnackForm, { SnackFormValues } from '../components/SnackForm';

export default function LogScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [confirmAnim] = useState(new Animated.Value(0));
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLog = async (values: SnackFormValues) => {
    await addSnack(values);

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
          <Text style={styles.heading}>Log a snack</Text>

          <SnackForm submitLabel="Log it" onSubmit={handleLog} resetAfterSubmit />

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
  confirmBadge: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: colors.textPrimary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
