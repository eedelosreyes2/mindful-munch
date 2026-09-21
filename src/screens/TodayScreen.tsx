import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { REASON_LABELS, Snack } from '../types/snack';
import { getAllSnacks, getSnacksForDay } from '../storage/snackStorage';
import StackedBarChart, { Bucket } from '../components/StackedBarChart';
import ReasonLegend from '../components/ReasonLegend';

const START_HOUR = 6;
const END_HOUR = 23; // inclusive

function hourLabel(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour < 12 ? 'a' : 'p';
  return `${h}${suffix}`;
}

function buildHourlyBuckets(snacks: Snack[]): Bucket[] {
  const buckets: Bucket[] = [];
  for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
    const counts: Bucket['counts'] = {};
    for (const s of snacks) {
      const d = new Date(s.timestamp);
      if (d.getHours() === hour) {
        if (s.reason) {
          counts[s.reason] = (counts[s.reason] ?? 0) + 1;
        } else {
          counts.untagged = (counts.untagged ?? 0) + 1;
        }
      }
    }
    buckets.push({ label: hourLabel(hour), counts });
  }
  return buckets;
}

export default function TodayScreen({ navigation }: any) {
  const [todaySnacks, setTodaySnacks] = useState<Snack[]>([]);

  const load = useCallback(async () => {
    const all = await getAllSnacks();
    setTodaySnacks(getSnacksForDay(all, new Date()));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const buckets = buildHourlyBuckets(todaySnacks);
  const reasonCounts = todaySnacks.reduce<Record<string, number>>((acc, s) => {
    if (s.reason) acc[s.reason] = (acc[s.reason] ?? 0) + 1;
    return acc;
  }, {});
  const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Snacks today</Text>
          <Text style={styles.statValue}>{todaySnacks.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Most common</Text>
          <Text style={styles.statValue}>
            {topReason ? REASON_LABELS[topReason as keyof typeof REASON_LABELS] : '—'}
          </Text>
        </View>
      </View>

      <ReasonLegend />

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <StackedBarChart buckets={buckets} showEveryNthLabel={2} />
      </ScrollView>

      <View style={styles.listSection}>
        <Text style={styles.listHeading}>Today's log</Text>
        {todaySnacks.length === 0 && (
          <Text style={styles.emptyText}>Nothing yet today.</Text>
        )}
        {[...todaySnacks].reverse().map((s) => (
          <View key={s.id} style={styles.listItem}>
            <Text style={styles.listItemText}>{s.text}</Text>
            <Text style={styles.listItemMeta}>
              {new Date(s.timestamp).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              })}
              {s.reason ? ` · ${REASON_LABELS[s.reason]}` : ''}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.logMoreButton} onPress={() => navigation.navigate('Log')}>
        <Text style={styles.logMoreText}>+ Log a snack</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 14,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  listSection: {
    marginTop: 28,
  },
  listHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  listItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listItemText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  listItemMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  logMoreButton: {
    marginTop: 24,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 14,
    marginBottom: 40,
  },
  logMoreText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
