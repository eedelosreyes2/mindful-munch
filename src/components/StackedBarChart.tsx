import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors, reasonColors, untaggedColor } from '../theme/colors';
import { REASON_TAGS, ReasonTag } from '../types/snack';

export interface Bucket {
  label: string;
  counts: Partial<Record<ReasonTag, number>> & { untagged?: number };
}

type Segment = ReasonTag | 'untagged';
const ALL_SEGMENTS: Segment[] = [...REASON_TAGS, 'untagged'];
const segmentColor: Record<Segment, string> = { ...reasonColors, untagged: untaggedColor };

interface Props {
  buckets: Bucket[];
  height?: number;
  barWidth?: number;
  gap?: number;
  showEveryNthLabel?: number;
}

export default function StackedBarChart({
  buckets,
  height = 160,
  barWidth = 14,
  gap = 6,
  showEveryNthLabel = 1,
}: Props) {
  const maxTotal = Math.max(
    1,
    ...buckets.map((b) =>
      ALL_SEGMENTS.reduce((sum, seg) => sum + (b.counts[seg] ?? 0), 0)
    )
  );
  // Round the axis ceiling up to a clean step so bars don't look like they're
  // straining against the top of the chart.
  const axisMax = Math.ceil(maxTotal / 2) * 2 || 2;
  const chartWidth = buckets.length * (barWidth + gap);
  const unitHeight = height / axisMax;

  return (
    <View>
      <Svg width={chartWidth} height={height}>
        {buckets.map((bucket, i) => {
          let yOffset = height;
          return (
            <React.Fragment key={i}>
              {ALL_SEGMENTS.map((seg) => {
                const count = bucket.counts[seg] ?? 0;
                if (count === 0) return null;
                const segHeight = count * unitHeight;
                yOffset -= segHeight;
                return (
                  <Rect
                    key={seg}
                    x={i * (barWidth + gap)}
                    y={yOffset}
                    width={barWidth}
                    height={Math.max(segHeight - 2, 0)} // surface gap between segments
                    rx={3}
                    fill={segmentColor[seg]}
                  />
                );
              })}
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={[styles.labelRow, { width: chartWidth }]}>
        {buckets.map((bucket, i) => (
          <Text
            key={i}
            style={[
              styles.label,
              { width: barWidth + gap },
              i % showEveryNthLabel !== 0 && styles.labelHidden,
            ]}
          >
            {bucket.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  label: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
  },
  labelHidden: {
    opacity: 0,
  },
});
