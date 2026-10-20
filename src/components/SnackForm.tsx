import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
  Keyboard,
  Modal,
  ScrollView,
  StyleProp,
  ViewStyle,
  useColorScheme,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from './DateTimePicker';
import { Feather } from '@expo/vector-icons';
import { ThemeColors, useTheme } from '../theme/colors';
import { notify } from '../lib/notify';
import { REASON_TAGS, REASON_LABELS, ReasonTag } from '../types/snack';

function formatWhen(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (isToday) return time;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const dayLabel =
    date.toDateString() === yesterday.toDateString()
      ? 'Yesterday'
      : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `${dayLabel}, ${time}`;
}

export interface SnackFormValues {
  text: string;
  reason?: ReasonTag;
  timestamp: number;
}

interface Props {
  initialText?: string;
  initialReason?: ReasonTag;
  initialTimestamp?: number;
  startWithCustomTime?: boolean;
  submitLabel: string;
  onSubmit: (values: SnackFormValues) => void | Promise<void>;
  resetAfterSubmit?: boolean;
  autoFocus?: boolean;
  quickSelectOptions?: string[];
  onRemoveQuickSelectOption?: (text: string) => void;
  onPickerVisibilityChange?: (visible: boolean) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  pinSubmit?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export default function SnackForm({
  initialText = '',
  initialReason,
  initialTimestamp,
  startWithCustomTime = false,
  submitLabel,
  onSubmit,
  resetAfterSubmit = false,
  autoFocus = false,
  quickSelectOptions = [],
  onRemoveQuickSelectOption,
  onPickerVisibilityChange,
  header,
  footer,
  pinSubmit = false,
  contentStyle,
}: Props) {
  const colors = useTheme();
  const styles = getStyles(colors);
  const isDark = useColorScheme() === 'dark';

  const [text, setText] = useState(initialText);
  const [selectedReason, setSelectedReason] = useState<ReasonTag | undefined>(initialReason);
  const [loggedAt, setLoggedAt] = useState(() => new Date(initialTimestamp ?? Date.now()));
  const [isCustomTime, setIsCustomTime] = useState(startWithCustomTime);
  const [activePicker, setActivePicker] = useState<'date' | 'time' | 'datetime' | null>(null);
  const [showReasonPrompt, setShowReasonPrompt] = useState(false);

  useEffect(() => {
    onPickerVisibilityChange?.(activePicker !== null);
  }, [activePicker]);

  const openTimePicker = () => {
    Keyboard.dismiss();
    setActivePicker(Platform.OS === 'android' ? 'date' : 'datetime');
  };

  const handlePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setActivePicker(null);
    if (event.type !== 'set' || !selected) return;

    if (activePicker === 'date') {
      const combined = new Date(selected);
      combined.setHours(loggedAt.getHours(), loggedAt.getMinutes());
      setLoggedAt(combined);
      setIsCustomTime(true);
      setActivePicker('time');
      return;
    }

    const clamped = selected.getTime() > Date.now() ? new Date() : selected;
    setLoggedAt(clamped);
    setIsCustomTime(true);
  };

  const resetToNow = () => {
    setLoggedAt(new Date());
    setIsCustomTime(false);
  };

  const submit = async () => {
    try {
      await onSubmit({
        text: text.trim(),
        reason: selectedReason,
        timestamp: loggedAt.getTime(),
      });
    } catch (err) {
      console.error('Failed to save snack', err);
      notify("Couldn't save", 'Check your connection and try again.');
      return;
    }

    setActivePicker(null);

    if (resetAfterSubmit) {
      setText('');
      setSelectedReason(undefined);
      resetToNow();
    }
  };

  const handleSubmit = () => {
    if (!text.trim()) return;

    if (!selectedReason) {
      setShowReasonPrompt(true);
      return;
    }

    submit();
  };

  const handleLogAnyway = () => {
    setShowReasonPrompt(false);
    submit();
  };

  const dismissPicker = () => {
    Keyboard.dismiss();
    if (activePicker) setActivePicker(null);
  };

  const fields = (
    <>
      {quickSelectOptions.length > 0 && (
        <>
          <Text style={styles.subheading}>Recent</Text>
          <View style={styles.quickSelectRow}>
            {quickSelectOptions.map((option) => (
              <View key={option} style={styles.quickSelectChip}>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setText(option);
                  }}
                >
                  <Text style={styles.quickSelectText}>{option}</Text>
                </TouchableOpacity>
                {onRemoveQuickSelectOption && (
                  <TouchableOpacity
                    style={styles.quickSelectRemove}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => onRemoveQuickSelectOption(option)}
                  >
                    <Feather name="x" size={12} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </>
      )}

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Cookie, chips, leftovers…"
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          returnKeyType="done"
          onSubmitEditing={Platform.OS === 'web' ? handleSubmit : Keyboard.dismiss}
          autoFocus={autoFocus}
        />
        {text.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={() => setText('')}>
            <Feather name="x" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.subheading}>Why? (optional)</Text>
      <View style={styles.tagRow}>
        {REASON_TAGS.map((tag) => {
          const isSelected = selectedReason === tag;
          return (
            <TouchableOpacity
              key={tag}
              onPress={() => {
                Keyboard.dismiss();
                setSelectedReason(isSelected ? undefined : tag);
              }}
              style={[
                styles.tagChip,
                {
                  backgroundColor: isSelected
                    ? colors.reasonColors[tag]
                    : colors.reasonColorsMuted[tag],
                },
              ]}
            >
              <Text
                style={[styles.tagText, { color: isSelected ? colors.onAccent : colors.textSecondary }]}
              >
                {REASON_LABELS[tag]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.subheading}>When?</Text>
      <View style={styles.whenRow}>
        <TouchableOpacity style={styles.whenChip} onPress={openTimePicker}>
          <Text style={styles.whenChipText}>{isCustomTime ? formatWhen(loggedAt) : 'Now'}</Text>
        </TouchableOpacity>
        {isCustomTime && (
          <TouchableOpacity onPress={resetToNow}>
            <Text style={styles.whenResetText}>Reset to now</Text>
          </TouchableOpacity>
        )}
      </View>

      {activePicker && (
        <View style={Platform.OS !== 'android' ? styles.pickerContainer : undefined}>
          <DateTimePicker
            value={loggedAt}
            mode={activePicker}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            themeVariant={isDark ? 'dark' : 'light'}
            maximumDate={new Date()}
            onChange={handlePickerChange}
          />
          {Platform.OS !== 'android' && (
            <TouchableOpacity style={styles.pickerDoneButton} onPress={() => setActivePicker(null)}>
              <Text style={styles.pickerDoneText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  );

  const submitButton = (
    <TouchableOpacity
      style={[
        styles.submitButton,
        pinSubmit && styles.submitButtonPinned,
        !text.trim() && styles.submitButtonDisabled,
      ]}
      onPress={handleSubmit}
      disabled={!text.trim()}
    >
      <Text style={styles.submitButtonText}>{submitLabel}</Text>
    </TouchableOpacity>
  );

  const reasonPrompt = (
    <Modal
      visible={showReasonPrompt}
      transparent
      animationType="fade"
      onRequestClose={() => setShowReasonPrompt(false)}
    >
      <View style={styles.promptBackdrop}>
        <View style={styles.promptCard}>
          <Text style={styles.promptTitle}>Log without a reason?</Text>
          <TouchableOpacity
            style={styles.promptPrimaryButton}
            onPress={() => setShowReasonPrompt(false)}
          >
            <Text style={styles.promptPrimaryButtonText}>Add a reason</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.promptSecondaryButton} onPress={handleLogAnyway}>
            <Text style={styles.promptSecondaryText}>Log anyway</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const dismissArea = (content: React.ReactNode) => (
    <TouchableWithoutFeedback
      onPress={dismissPicker}
      accessible={false}
      disabled={Platform.OS === 'web'}
    >
      <View>{content}</View>
    </TouchableWithoutFeedback>
  );

  if (pinSubmit) {
    return (
      <View style={styles.pinnedRoot}>
        <ScrollView
          style={styles.pinnedRoot}
          contentContainerStyle={contentStyle}
          keyboardShouldPersistTaps="handled"
        >
          {dismissArea(
            <>
              {header}
              {fields}
            </>
          )}
        </ScrollView>
        <View style={styles.pinnedActions}>
          {submitButton}
          {footer}
        </View>
        {reasonPrompt}
      </View>
    );
  }

  return dismissArea(
    <>
      {header}
      {fields}
      {submitButton}
      {footer}
      {reasonPrompt}
    </>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    quickSelectRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    quickSelectChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      paddingLeft: 14,
      paddingRight: 10,
      paddingVertical: 8,
      borderRadius: 16,
    },
    quickSelectRemove: {
      marginLeft: 6,
    },
    quickSelectText: {
      fontSize: 13,
      color: colors.textPrimary,
    },
    inputWrapper: {
      position: 'relative',
      marginBottom: 32,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingLeft: 18,
      paddingRight: 44,
      paddingVertical: 16,
      fontSize: 17,
      color: colors.textPrimary,
    },
    clearButton: {
      position: 'absolute',
      right: 18,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
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
      marginBottom: 28,
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
    whenRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 24,
    },
    whenChip: {
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
    },
    whenChipText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    whenResetText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    pickerContainer: {
      marginBottom: 16,
      alignItems: 'flex-end',
    },
    pickerDoneButton: {
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    pickerDoneText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    submitButton: {
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 24,
    },
    submitButtonPinned: {
      marginBottom: 16,
    },
    pinnedRoot: {
      flex: 1,
    },
    pinnedActions: {
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 32,
    },
    submitButtonDisabled: {
      opacity: 0.35,
    },
    submitButtonText: {
      color: colors.onAccent,
      fontSize: 16,
      fontWeight: '600',
    },
    promptBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    promptCard: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      alignItems: 'stretch',
    },
    promptTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 20,
    },
    promptPrimaryButton: {
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 14,
    },
    promptPrimaryButtonText: {
      color: colors.onAccent,
      fontSize: 15,
      fontWeight: '600',
    },
    promptSecondaryButton: {
      alignItems: 'center',
    },
    promptSecondaryText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
  });
}
