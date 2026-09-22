import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Keyboard } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, reasonColors, reasonColorsMuted } from '../theme/colors';
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
}: Props) {
  const [text, setText] = useState(initialText);
  const [selectedReason, setSelectedReason] = useState<ReasonTag | undefined>(initialReason);
  const [loggedAt, setLoggedAt] = useState(() => new Date(initialTimestamp ?? Date.now()));
  const [isCustomTime, setIsCustomTime] = useState(startWithCustomTime);
  const [activePicker, setActivePicker] = useState<'date' | 'time' | 'datetime' | null>(null);

  const openTimePicker = () => {
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

  const handleSubmit = async () => {
    if (!text.trim()) return;

    await onSubmit({
      text: text.trim(),
      reason: selectedReason,
      timestamp: loggedAt.getTime(),
    });

    if (resetAfterSubmit) {
      setText('');
      setSelectedReason(undefined);
      resetToNow();
    }
  };

  return (
    <View>
      <TextInput
        style={styles.input}
        placeholder="Cookie, chips, leftovers…"
        placeholderTextColor={colors.textMuted}
        value={text}
        onChangeText={setText}
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        autoFocus={autoFocus}
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
                { backgroundColor: isSelected ? reasonColors[tag] : reasonColorsMuted[tag] },
              ]}
            >
              <Text
                style={[styles.tagText, { color: isSelected ? '#FFFFFF' : colors.textSecondary }]}
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
        <View style={Platform.OS === 'ios' ? styles.pickerContainer : undefined}>
          <DateTimePicker
            value={loggedAt}
            mode={activePicker}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={handlePickerChange}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.pickerDoneButton} onPress={() => setActivePicker(null)}>
              <Text style={styles.pickerDoneText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, !text.trim() && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!text.trim()}
      >
        <Text style={styles.submitButtonText}>{submitLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
  submitButtonDisabled: {
    opacity: 0.35,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
