import React from 'react';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme, useThemeSettings } from '../theme/colors';

export type { DateTimePickerEvent };

interface Props {
  value: Date;
  mode?: 'date' | 'time' | 'datetime';
  display?: string;
  themeVariant?: 'light' | 'dark';
  maximumDate?: Date;
  onChange: (event: DateTimePickerEvent, date?: Date) => void;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// datetime-local inputs take and return local time as "YYYY-MM-DDTHH:mm".
function toInputValue(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

export default function DateTimePicker({ value, maximumDate, onChange }: Props) {
  const colors = useTheme();
  const { isDark } = useThemeSettings();

  return (
    <input
      type="datetime-local"
      value={toInputValue(value)}
      max={maximumDate ? toInputValue(maximumDate) : undefined}
      onChange={(e) => {
        if (!e.target.value) return;
        const date = new Date(e.target.value);
        onChange(
          { type: 'set', nativeEvent: { timestamp: date.getTime(), utcOffset: -date.getTimezoneOffset() } },
          date
        );
      }}
      style={{
        alignSelf: 'stretch',
        fontSize: 16,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        padding: '12px 14px',
        borderRadius: 14,
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.surface,
        color: colors.textPrimary,
        colorScheme: isDark ? 'dark' : 'light',
      }}
    />
  );
}
