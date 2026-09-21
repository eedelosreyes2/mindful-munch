import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { colors, reasonColors, reasonColorsMuted } from '../theme/colors';
import { REASON_TAGS, REASON_LABELS, ReasonTag } from '../types/snack';
import { addSnack } from '../storage/snackStorage';

export default function LogScreen({ navigation }: any) {
  const [text, setText] = useState('');
  const [selectedReason, setSelectedReason] = useState<ReasonTag | undefined>(undefined);
  const [confirmAnim] = useState(new Animated.Value(0));
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLog = async () => {
    if (!text.trim()) return;

    await addSnack({
      text: text.trim(),
      timestamp: Date.now(),
      reason: selectedReason,
    });

    setText('');
    setSelectedReason(undefined);

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
      <View style={styles.content}>
        <Text style={styles.heading}>Log a snack</Text>

        <TextInput
          style={styles.input}
          placeholder="Cookie, chips, leftovers…"
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          returnKeyType="done"
          onSubmitEditing={handleLog}
          autoFocus
        />

        <Text style={styles.subheading}>Why? (optional)</Text>
        <View style={styles.tagRow}>
          {REASON_TAGS.map((tag) => {
            const isSelected = selectedReason === tag;
            return (
              <TouchableOpacity
                key={tag}
                onPress={() => setSelectedReason(isSelected ? undefined : tag)}
                style={[
                  styles.tagChip,
                  {
                    backgroundColor: isSelected ? reasonColors[tag] : reasonColorsMuted[tag],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {REASON_LABELS[tag]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.logButton, !text.trim() && styles.logButtonDisabled]}
          onPress={handleLog}
          disabled={!text.trim()}
        >
          <Text style={styles.logButtonText}>Log it</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Today')}>
          <Text style={styles.linkText}>See today →</Text>
        </TouchableOpacity>
      </View>

      {showConfirm && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.confirmBadge,
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
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 17,
    color: colors.textPrimary,
    marginBottom: 32,
  },
  subheading: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 40,
  },
  tagChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  logButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  logButtonDisabled: {
    opacity: 0.35,
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
  confirmBadge: {
    position: 'absolute',
    top: 24,
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
