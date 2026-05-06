import { View, Pressable, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors, radius, spacing, getActivityTypeColor } from '@sc-muiden/shared';
import type { ActivityWithDetails, ActivityType } from '@sc-muiden/shared';
import { Text } from '../ui/Text';

const DUTCH_MONTHS = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];
const WEEKDAYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];

interface MonthCalendarProps {
  year: number;
  month: number; // 1-12
  selectedDate: Date;
  activities: ActivityWithDetails[];
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

function getTypeDotsForDay(activities: ActivityWithDetails[]): string[] {
  const seen = new Set<ActivityType>();
  const dots: string[] = [];
  for (const a of activities) {
    if (!seen.has(a.type) && dots.length < 3) {
      seen.add(a.type);
      dots.push(getActivityTypeColor(a.type));
    }
  }
  return dots;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  // 0=sun, returns 1=mon..7=sun (ISO)
  const day = new Date(year, month - 1, 1).getDay();
  return day === 0 ? 7 : day;
}

export function MonthCalendar({
  year,
  month,
  selectedDate,
  activities,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: MonthCalendarProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month); // 1=mon
  const today = new Date();

  const activitiesByDay = new Map<number, ActivityWithDetails[]>();
  for (const a of activities) {
    const d = new Date(a.starts_at);
    if (d.getFullYear() === year && d.getMonth() + 1 === month) {
      const day = d.getDate();
      const existing = activitiesByDay.get(day) ?? [];
      activitiesByDay.set(day, [...existing, a]);
    }
  }

  const cells: Array<number | null> = [
    ...Array(firstDay - 1).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onPrevMonth} style={styles.arrow} hitSlop={8}>
          <ChevronLeft size={24} color={colors.blue} />
        </Pressable>
        <Text variant="h4" style={styles.monthLabel}>
          {DUTCH_MONTHS[month - 1]} {year}
        </Text>
        <Pressable onPress={onNextMonth} style={styles.arrow} hitSlop={8}>
          <ChevronRight size={24} color={colors.blue} />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((d) => (
          <View key={d} style={styles.cell}>
            <Text variant="label" style={styles.weekday}>{d}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={`empty-${i}`} style={styles.cell} />;

          const isToday =
            today.getFullYear() === year &&
            today.getMonth() + 1 === month &&
            today.getDate() === day;
          const isSelected =
            selectedDate.getFullYear() === year &&
            selectedDate.getMonth() + 1 === month &&
            selectedDate.getDate() === day;

          const dayActivities = activitiesByDay.get(day) ?? [];
          const dots = getTypeDotsForDay(dayActivities);

          return (
            <Pressable
              key={day}
              style={styles.cell}
              onPress={() => onSelectDate(new Date(year, month - 1, day))}
              accessibilityRole="button"
              accessibilityLabel={`${day} ${DUTCH_MONTHS[month - 1]}`}
            >
              <View
                style={[
                  styles.dayCircle,
                  isToday && styles.todayCircle,
                  isSelected && !isToday && styles.selectedCircle,
                  isSelected && isToday && styles.selectedTodayCircle,
                ]}
              >
                <Text
                  variant="body"
                  style={[
                    styles.dayNumber,
                    isToday && styles.todayText,
                    isSelected && !isToday && styles.selectedText,
                  ]}
                >
                  {day}
                </Text>
              </View>
              <View style={styles.dots}>
                {dots.map((color, di) => (
                  <View key={di} style={[styles.dot, { backgroundColor: color }]} />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing[4],
    shadowColor: '#011d50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  arrow: {
    padding: 4,
  },
  monthLabel: {
    color: colors.navy,
    textTransform: 'capitalize',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing[1],
  },
  weekday: {
    color: colors.text2,
    fontSize: 11,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    backgroundColor: colors.blue,
  },
  selectedCircle: {
    borderWidth: 2,
    borderColor: colors.navy,
  },
  selectedTodayCircle: {
    backgroundColor: colors.blue,
    borderWidth: 2,
    borderColor: colors.navy,
  },
  dayNumber: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 16,
  },
  todayText: {
    color: colors.white,
    fontWeight: '600',
  },
  selectedText: {
    color: colors.navy,
    fontWeight: '600',
  },
  dots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    height: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});
