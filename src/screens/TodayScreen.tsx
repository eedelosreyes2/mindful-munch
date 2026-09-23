import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  PanResponder,
  PanResponderInstance,
  Animated,
  Easing,
  Dimensions,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ThemeColors, useTheme } from '../theme/colors';
import { REASON_LABELS, REASON_TAGS, Snack } from '../types/snack';
import {
  getAllSnacks,
  getSnacksForDay,
  getSnacksForWeek,
  getCurrentWeekStart,
} from '../storage/snackStorage';
import { exportSnacks } from '../storage/exportSnacks';
import StackedBarChart, { Bucket } from '../components/StackedBarChart';
import ReasonLegend from '../components/ReasonLegend';
import SegmentedControl from '../components/SegmentedControl';

type ViewMode = 'today' | 'week';

const START_HOUR = 6;
const END_HOUR = 23; // inclusive
const HOUR_LABELS_COUNT = END_HOUR - START_HOUR + 1;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SWIPE_THRESHOLD = 50;
const CONTENT_PADDING = 24;

function computeBarDims(totalWidth: number, count: number) {
  const slot = totalWidth / count;
  const gap = Math.max(2, Math.round(slot * 0.3));
  const barWidth = Math.max(1, Math.round(slot) - gap);
  return { barWidth, gap };
}

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

function buildDailyBuckets(snacks: Snack[], weekStart: Date): Bucket[] {
  const buckets: Bucket[] = [];
  for (let i = 0; i < 7; i++) {
    const dayStart = new Date(weekStart);
    dayStart.setDate(dayStart.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const counts: Bucket['counts'] = {};
    for (const s of snacks) {
      if (s.timestamp >= dayStart.getTime() && s.timestamp < dayEnd.getTime()) {
        if (s.reason) {
          counts[s.reason] = (counts[s.reason] ?? 0) + 1;
        } else {
          counts.untagged = (counts.untagged ?? 0) + 1;
        }
      }
    }
    buckets.push({ label: DAY_LABELS[i], counts });
  }
  return buckets;
}

function topReasonLabel(snacks: Snack[]): string {
  const reasonCounts = snacks.reduce<Record<string, number>>((acc, s) => {
    if (s.reason) acc[s.reason] = (acc[s.reason] ?? 0) + 1;
    return acc;
  }, {});
  const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  return topReason ? REASON_LABELS[topReason as keyof typeof REASON_LABELS] : '—';
}

function formatWeekRange(weekStart: Date, weekOffset: number): string {
  if (weekOffset === 0) return 'This week';
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const start = weekStart.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const end = weekEnd.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `${start} – ${end}`;
}

function formatDayLabel(date: Date, dayOffset: number): string {
  if (dayOffset === 0) return 'Today';
  if (dayOffset === 1) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function summarizeBucket(bucket: Bucket): string | null {
  const segments: { name: string; count: number }[] = [];
  let total = 0;
  for (const tag of REASON_TAGS) {
    const count = bucket.counts[tag] ?? 0;
    if (count > 0) {
      segments.push({ name: REASON_LABELS[tag], count });
      total += count;
    }
  }
  const untaggedCount = bucket.counts.untagged ?? 0;
  if (untaggedCount > 0) {
    segments.push({ name: 'Untagged', count: untaggedCount });
    total += untaggedCount;
  }
  if (total === 0) return null;

  const reasonsText = segments
    .map((s) => (s.count > 1 ? `${s.name} (${s.count})` : s.name))
    .join(', ');
  const snackWord = total === 1 ? 'snack' : 'snacks';
  return `${bucket.label} · ${total} ${snackWord} · ${reasonsText}`;
}

function useSwipeCarousel(
  paneWidth: number,
  offset: number,
  setOffset: React.Dispatch<React.SetStateAction<number>>,
  maxOffset: number = Infinity
) {
  const offsetRef = useRef(offset);
  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  const maxOffsetRef = useRef(maxOffset);
  useEffect(() => {
    maxOffsetRef.current = maxOffset;
  }, [maxOffset]);

  const drag = useRef(new Animated.Value(-paneWidth)).current;

  useLayoutEffect(() => {
    drag.setValue(-paneWidth);
  }, [offset, drag, paneWidth]);

  const animateTo = (direction: 'next' | 'previous') => {
    if (direction === 'next' && offsetRef.current === 0) return;
    if (direction === 'previous' && offsetRef.current >= maxOffsetRef.current) return;
    Animated.timing(drag, {
      toValue: direction === 'next' ? -2 * paneWidth : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      if (direction === 'next') {
        setOffset((prev) => Math.max(0, prev - 1));
      } else {
        setOffset((prev) => prev + 1);
      }
    });
  };

  const swipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderMove: (_, gestureState) => {
        const goingToNext = gestureState.dx < 0;
        if (goingToNext) {
          if (offsetRef.current > 0) {
            const clamped = Math.max(-paneWidth, Math.min(paneWidth, gestureState.dx));
            drag.setValue(-paneWidth + clamped);
          } else {
            const resisted = gestureState.dx / (1 + Math.abs(gestureState.dx) / 40);
            drag.setValue(-paneWidth + resisted);
          }
        } else if (offsetRef.current < maxOffsetRef.current) {
          const clamped = Math.max(-paneWidth, Math.min(paneWidth, gestureState.dx));
          drag.setValue(-paneWidth + clamped);
        } else {
          drag.setValue(-paneWidth);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx <= -SWIPE_THRESHOLD && offsetRef.current > 0) {
          animateTo('next');
        } else if (gestureState.dx >= SWIPE_THRESHOLD && offsetRef.current < maxOffsetRef.current) {
          animateTo('previous');
        } else {
          Animated.spring(drag, { toValue: -paneWidth, friction: 8, useNativeDriver: false }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(drag, { toValue: -paneWidth, friction: 8, useNativeDriver: false }).start();
      },
    })
  ).current;

  return { drag, swipeResponder, animateTo };
}

const carouselStyles = StyleSheet.create({
  carouselViewport: {
    overflow: 'hidden',
  },
  carouselTrack: {
    flexDirection: 'row',
  },
});

function ChartCarousel({
  width,
  drag,
  panHandlers,
  previousBuckets,
  currentBuckets,
  nextBuckets,
  barWidth,
  gap,
  showEveryNthLabel,
  onSelectBar,
}: {
  width: number;
  drag: Animated.Value;
  panHandlers: PanResponderInstance['panHandlers'];
  previousBuckets: Bucket[];
  currentBuckets: Bucket[];
  nextBuckets: Bucket[] | null;
  barWidth: number;
  gap: number;
  showEveryNthLabel?: number;
  onSelectBar?: (index: number) => void;
}) {
  return (
    <View style={[carouselStyles.carouselViewport, { width }]} {...panHandlers}>
      <Animated.View
        style={[carouselStyles.carouselTrack, { transform: [{ translateX: drag }] }]}
      >
        <View style={{ width }}>
          <StackedBarChart
            buckets={previousBuckets}
            barWidth={barWidth}
            gap={gap}
            showEveryNthLabel={showEveryNthLabel}
          />
        </View>
        <View style={{ width }}>
          <StackedBarChart
            buckets={currentBuckets}
            barWidth={barWidth}
            gap={gap}
            showEveryNthLabel={showEveryNthLabel}
            onSelectBar={onSelectBar}
          />
        </View>
        {nextBuckets && (
          <View style={{ width }}>
            <StackedBarChart
              buckets={nextBuckets}
              barWidth={barWidth}
              gap={gap}
              showEveryNthLabel={showEveryNthLabel}
            />
          </View>
        )}
      </Animated.View>
    </View>
  );
}

export default function TodayScreen({ navigation, route }: any) {
  const colors = useTheme();
  const styles = getStyles(colors);
  const [viewMode, setViewMode] = useState<ViewMode>(route?.params?.initialViewMode ?? 'today');
  const [dayOffset, setDayOffset] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [allSnacks, setAllSnacks] = useState<Snack[]>([]);
  const [selectedBarSummary, setSelectedBarSummary] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      await exportSnacks();
    } catch (err) {
      Alert.alert("Couldn't export", 'Something went wrong while preparing your data.');
    }
  };

  useEffect(() => {
    setSelectedBarSummary(null);
  }, [viewMode, dayOffset, weekOffset]);

  const load = useCallback(async () => {
    setAllSnacks(await getAllSnacks());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
  }, [navigation]);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const maxDayOffset = Math.round(
    (startOfToday.getTime() - getCurrentWeekStart().getTime()) / (1000 * 60 * 60 * 24)
  );

  const chartWidth = Math.max(0, Dimensions.get('window').width - CONTENT_PADDING * 2);
  const { barWidth: dayBarWidth, gap: dayBarGap } = computeBarDims(chartWidth, HOUR_LABELS_COUNT);
  const { barWidth: weekBarWidth, gap: weekBarGap } = computeBarDims(chartWidth, DAY_LABELS.length);

  const day = useSwipeCarousel(chartWidth, dayOffset, setDayOffset, maxDayOffset);
  const week = useSwipeCarousel(chartWidth, weekOffset, setWeekOffset);

  const dayFor = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return d;
  };

  const weekStartFor = (offset: number) => {
    const d = getCurrentWeekStart();
    d.setDate(d.getDate() - offset * 7);
    return d;
  };

  const displayedDay = dayFor(dayOffset);
  const previousDay = dayFor(dayOffset + 1);
  const nextDay = dayOffset > 0 ? dayFor(dayOffset - 1) : null;

  const displayedWeekStart = weekStartFor(weekOffset);
  const previousWeekStart = weekStartFor(weekOffset + 1);
  const nextWeekStart = weekOffset > 0 ? weekStartFor(weekOffset - 1) : null;

  const displayedDaySnacks = getSnacksForDay(allSnacks, displayedDay);
  const weekSnacks = getSnacksForWeek(allSnacks, displayedWeekStart);
  const activeSnacks = viewMode === 'today' ? displayedDaySnacks : weekSnacks;

  const currentDayBuckets = buildHourlyBuckets(displayedDaySnacks);
  const previousDayBuckets = buildHourlyBuckets(getSnacksForDay(allSnacks, previousDay));
  const nextDayBuckets = nextDay ? buildHourlyBuckets(getSnacksForDay(allSnacks, nextDay)) : null;

  const currentWeekBuckets = buildDailyBuckets(weekSnacks, displayedWeekStart);
  const previousWeekBuckets = buildDailyBuckets(
    getSnacksForWeek(allSnacks, previousWeekStart),
    previousWeekStart
  );
  const nextWeekBuckets = nextWeekStart
    ? buildDailyBuckets(getSnacksForWeek(allSnacks, nextWeekStart), nextWeekStart)
    : null;

  const dayLabel = formatDayLabel(displayedDay, dayOffset);
  const listHeadingText = dayOffset <= 1 ? `${dayLabel}'s log` : `Log for ${dayLabel}`;

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <SegmentedControl
          options={[
            { label: 'Today', value: 'today' },
            { label: 'Week', value: 'week' },
          ]}
          value={viewMode}
          onChange={setViewMode}
        />

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              {viewMode === 'today' ? 'Snacks today' : 'Snacks this week'}
            </Text>
            <Text style={styles.statValue}>{activeSnacks.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Most common reason</Text>
            <Text style={styles.statValue}>{topReasonLabel(activeSnacks)}</Text>
          </View>
        </View>

        <ReasonLegend />

        {viewMode === 'today' ? (
          <ChartCarousel
            width={chartWidth}
            drag={day.drag}
            panHandlers={day.swipeResponder.panHandlers}
            previousBuckets={previousDayBuckets}
            currentBuckets={currentDayBuckets}
            nextBuckets={nextDayBuckets}
            barWidth={dayBarWidth}
            gap={dayBarGap}
            showEveryNthLabel={2}
            onSelectBar={(index) => setSelectedBarSummary(summarizeBucket(currentDayBuckets[index]))}
          />
        ) : (
          <ChartCarousel
            width={chartWidth}
            drag={week.drag}
            panHandlers={week.swipeResponder.panHandlers}
            previousBuckets={previousWeekBuckets}
            currentBuckets={currentWeekBuckets}
            nextBuckets={nextWeekBuckets}
            barWidth={weekBarWidth}
            gap={weekBarGap}
            onSelectBar={(index) => setSelectedBarSummary(summarizeBucket(currentWeekBuckets[index]))}
          />
        )}

        <Text style={styles.barSummary} numberOfLines={1}>
          {selectedBarSummary ?? ' '}
        </Text>

        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => (viewMode === 'today' ? day.animateTo('previous') : week.animateTo('previous'))}
            disabled={viewMode === 'today' && dayOffset >= maxDayOffset}
          >
            <Text
              style={[
                styles.navArrow,
                viewMode === 'today' && dayOffset >= maxDayOffset && styles.navArrowDisabled,
              ]}
            >
              ‹
            </Text>
          </TouchableOpacity>
          <Text style={styles.navLabel}>
            {viewMode === 'today' ? dayLabel : formatWeekRange(displayedWeekStart, weekOffset)}
          </Text>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => (viewMode === 'today' ? day.animateTo('next') : week.animateTo('next'))}
            disabled={viewMode === 'today' ? dayOffset === 0 : weekOffset === 0}
          >
            <Text
              style={[
                styles.navArrow,
                (viewMode === 'today' ? dayOffset === 0 : weekOffset === 0) &&
                  styles.navArrowDisabled,
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'today' && dayOffset > 0 && (
          <TouchableOpacity style={styles.backToPresent} onPress={() => setDayOffset(0)}>
            <Text style={styles.backToPresentText}>Back to today</Text>
          </TouchableOpacity>
        )}
        {viewMode === 'week' && weekOffset > 0 && (
          <TouchableOpacity style={styles.backToPresent} onPress={() => setWeekOffset(0)}>
            <Text style={styles.backToPresentText}>Back to this week</Text>
          </TouchableOpacity>
        )}
      </View>

      {viewMode === 'today' ? (
        <View style={styles.listSection}>
          <Text style={styles.listHeading}>{listHeadingText}</Text>
          <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent}>
            {displayedDaySnacks.length === 0 && (
              <Text style={styles.emptyText}>
                {dayOffset === 0 ? 'Nothing yet today.' : 'Nothing logged that day.'}
              </Text>
            )}
            {[...displayedDaySnacks].reverse().map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.listItem}
                onPress={() => navigation.navigate('EditSnack', { snack: s })}
              >
                <Text style={styles.listItemText}>{s.text}</Text>
                <Text style={styles.listItemMeta}>
                  {new Date(s.timestamp).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                  {s.reason ? ` · ${REASON_LABELS[s.reason]}` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.listSection} />
      )}

      <TouchableOpacity style={styles.logMoreButton} onPress={() => navigation.goBack()}>
        <Text style={styles.logMoreText}>+ Log a snack</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.exportLink} onPress={handleExport}>
        <Text style={styles.exportLinkText}>Export data</Text>
      </TouchableOpacity>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topSection: {
    paddingHorizontal: 24,
    paddingTop: 52,
  },
  barSummary: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  navArrow: {
    fontSize: 20,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    includeFontPadding: false,
  },
  navArrowDisabled: {
    color: colors.textMuted,
    opacity: 0.4,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    minWidth: 130,
    textAlign: 'center',
  },
  backToPresent: {
    marginTop: 10,
    alignSelf: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  backToPresentText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
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
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 12,
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
    marginHorizontal: 24,
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 14,
    marginBottom: 16,
  },
  exportLink: {
    alignItems: 'center',
    marginBottom: 40,
  },
  exportLinkText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  logMoreText: {
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: '600',
  },
  });
}
