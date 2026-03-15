import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { useTranslation } from '@/i18n';
import { workoutService } from '@/services/workoutService';
import { evaluationService } from '@/services/evaluationService';
import { clientService } from '@/services/clientService';
import { Card } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { Workout, Evaluation, Client, Exercise, MuscleGroup } from '@/types';

type Tab = 'workout' | 'evaluations';

const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  chest: '#EF4444',
  back: '#3B82F6',
  shoulders: '#8B5CF6',
  biceps: '#F59E0B',
  triceps: '#10B981',
  forearms: '#06B6D4',
  core: '#F97316',
  glutes: '#EC4899',
  quads: '#6366F1',
  hamstrings: '#84CC16',
  calves: '#14B8A6',
  cardio: '#EF4444',
  fullBody: '#6B7280',
  other: '#9CA3AF',
};

export default function StudentHomeScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { user, studentProfile, logOut } = useAuthStore();
  const { reset } = useAppStore();
  const t = useTranslation();

  const [tab, setTab] = useState<Tab>('workout');
  const [client, setClient] = useState<Client | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const activeWorkout = workouts.find((w) => w.active) || workouts[0] || null;

  const loadData = async () => {
    if (!studentProfile) return;
    try {
      const [clientData, clientWorkouts, evalsResult] = await Promise.all([
        clientService.getById(studentProfile.clientId),
        workoutService.listByClient(studentProfile.clientId),
        evaluationService.listByClient(studentProfile.clientId),
      ]);
      setClient(clientData);
      setWorkouts(clientWorkouts);
      setEvaluations(evalsResult.evaluations);
    } catch (err) {
      console.error('Error loading student data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(t.student.signOut, t.profile.signOutConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.student.signOut,
        style: 'destructive',
        onPress: async () => {
          reset();
          await logOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString(t.dateLocale, { day: '2-digit', month: 'short', year: 'numeric' });

  // Group exercises by day
  const exercisesByDay = (exercises: (Exercise & { day?: number; dayLabel?: string })[]) => {
    const groups: Record<number, { label: string; exercises: Exercise[] }> = {};
    exercises.forEach((ex) => {
      const day = ex.day ?? 1;
      if (!groups[day]) {
        groups[day] = { label: ex.dayLabel || `${t.workout.day} ${day}`, exercises: [] };
      }
      const { day: _d, dayLabel: _dl, ...exercise } = ex as Exercise & { day?: number; dayLabel?: string };
      groups[day].exercises.push(exercise);
    });
    return Object.entries(groups).sort(([a], [b]) => Number(a) - Number(b));
  };

  const getMuscleColor = (mg?: MuscleGroup) => MUSCLE_COLORS[mg || 'other'] || '#9CA3AF';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md, backgroundColor: colors.surface }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {t.student.hi}, {client?.name?.split(' ')[0] || user?.displayName?.split(' ')[0] || ''}! 👋
          </Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Personal App
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setTab('workout')}
          style={[styles.tab, tab === 'workout' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          activeOpacity={0.7}
        >
          <Ionicons name="barbell-outline" size={20} color={tab === 'workout' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabLabel, { color: tab === 'workout' ? colors.primary : colors.textSecondary }]}>
            {t.student.myWorkouts}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab('evaluations')}
          style={[styles.tab, tab === 'evaluations' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          activeOpacity={0.7}
        >
          <Ionicons name="analytics-outline" size={20} color={tab === 'evaluations' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabLabel, { color: tab === 'evaluations' ? colors.primary : colors.textSecondary }]}>
            {t.student.myEvaluations}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* WORKOUT TAB */}
        {tab === 'workout' && (
          <>
            {!activeWorkout ? (
              <View style={styles.emptyState}>
                <Ionicons name="barbell-outline" size={56} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.student.noWorkout}</Text>
                <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>{t.student.noWorkoutDescription}</Text>
              </View>
            ) : (
              <>
                <View style={styles.workoutHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {t.student.currentWorkout}
                  </Text>
                  {activeWorkout.aiGenerated && (
                    <View style={[styles.aiBadge, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name="sparkles" size={12} color={colors.primary} />
                      <Text style={[styles.aiBadgeText, { color: colors.primary }]}>{t.workout.aiGenerated}</Text>
                    </View>
                  )}
                </View>

                <Card style={styles.workoutCard}>
                  <Text style={[styles.workoutName, { color: colors.text }]}>{activeWorkout.name}</Text>
                  {activeWorkout.description && (
                    <Text style={[styles.workoutDesc, { color: colors.textSecondary }]}>{activeWorkout.description}</Text>
                  )}

                  {/* Exercise groups by day */}
                  {exercisesByDay(activeWorkout.exercises as (Exercise & { day?: number; dayLabel?: string })[]).map(([day, group]) => (
                    <View key={day} style={styles.dayGroup}>
                      <View style={[styles.dayBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.dayBadgeText}>{group.label}</Text>
                      </View>
                      {group.exercises.map((ex, idx) => (
                        <View key={ex.id || idx} style={[styles.exerciseRow, { borderBottomColor: colors.border }]}>
                          <View style={[styles.muscleTag, { backgroundColor: getMuscleColor(ex.muscleGroup) + '20' }]}>
                            <View style={[styles.muscleDot, { backgroundColor: getMuscleColor(ex.muscleGroup) }]} />
                          </View>
                          <View style={styles.exerciseInfo}>
                            <Text style={[styles.exerciseName, { color: colors.text }]}>{ex.name}</Text>
                            <Text style={[styles.exerciseMeta, { color: colors.textSecondary }]}>
                              {ex.sets} × {ex.reps} · {ex.rest}
                            </Text>
                            {ex.notes && (
                              <Text style={[styles.exerciseNotes, { color: colors.textTertiary }]}>{ex.notes}</Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  ))}
                </Card>

                {/* Other workouts */}
                {workouts.length > 1 && (
                  <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.xl }]}>
                    {t.workout.title}
                  </Text>
                )}
                {workouts.filter((w) => !w.active).map((w) => (
                  <Card key={w.id} style={styles.workoutListCard}>
                    <Text style={[styles.workoutName, { color: colors.text }]}>{w.name}</Text>
                    {w.description && (
                      <Text style={[styles.workoutDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                        {w.description}
                      </Text>
                    )}
                    <Text style={[styles.exerciseMeta, { color: colors.textTertiary }]}>
                      {w.exercises.length} {t.student.exercisesCount}
                    </Text>
                  </Card>
                ))}
              </>
            )}
          </>
        )}

        {/* EVALUATIONS TAB */}
        {tab === 'evaluations' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.student.evaluationHistory}</Text>

            {evaluations.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="analytics-outline" size={56} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.student.noEvaluations}</Text>
              </View>
            ) : (
              [...evaluations].reverse().map((ev) => (
                <Card key={ev.id} style={styles.evalCard}>
                  <Text style={[styles.evalDate, { color: colors.primary }]}>{formatDate(ev.createdAt)}</Text>
                  <View style={styles.evalGrid}>
                    <EvalStat label="Peso" value={`${ev.weight} kg`} colors={colors} />
                    {ev.protocols?.bmi != null && (
                      <EvalStat label="IMC" value={`${ev.protocols.bmi}`} colors={colors} />
                    )}
                    {ev.protocols?.pollock3 != null && (
                      <EvalStat label="% Gordura" value={`${ev.protocols.pollock3}%`} colors={colors} />
                    )}
                    {ev.protocols?.leanMass != null && (
                      <EvalStat label="Massa Magra" value={`${ev.protocols.leanMass} kg`} colors={colors} />
                    )}
                    {ev.protocols?.fatMass != null && (
                      <EvalStat label="Gordura" value={`${ev.protocols.fatMass} kg`} colors={colors} />
                    )}
                    {ev.protocols?.idealWeight != null && (
                      <EvalStat label="Peso Ideal" value={`${ev.protocols.idealWeight} kg`} colors={colors} />
                    )}
                  </View>
                  {ev.notes && (
                    <Text style={[styles.evalNotes, { color: colors.textSecondary }]}>{ev.notes}</Text>
                  )}
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function EvalStat({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useTheme> }) {
  return (
    <View style={[evalStyles.item, { backgroundColor: colors.surfaceElevated }]}>
      <Text style={[evalStyles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[evalStyles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const evalStyles = StyleSheet.create({
  item: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    minWidth: 80,
  },
  value: { fontSize: FontSize.md, fontWeight: '700' },
  label: { fontSize: FontSize.xs, marginTop: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  greeting: { fontSize: FontSize.sm },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '700' },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  tabLabel: { fontSize: FontSize.sm, fontWeight: '600' },
  scroll: { padding: Spacing.xl, paddingBottom: 100 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.md },
  workoutHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  aiBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full, gap: 4 },
  aiBadgeText: { fontSize: FontSize.xs, fontWeight: '600' },
  workoutCard: { marginBottom: Spacing.lg },
  workoutListCard: { marginBottom: Spacing.md },
  workoutName: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.xs },
  workoutDesc: { fontSize: FontSize.sm, marginBottom: Spacing.md },
  dayGroup: { marginTop: Spacing.lg },
  dayBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, alignSelf: 'flex-start', marginBottom: Spacing.sm },
  dayBadgeText: { color: '#FFF', fontSize: FontSize.xs, fontWeight: '700' },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  muscleTag: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  muscleDot: { width: 12, height: 12, borderRadius: 6 },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: FontSize.md, fontWeight: '600' },
  exerciseMeta: { fontSize: FontSize.sm, marginTop: 2 },
  exerciseNotes: { fontSize: FontSize.xs, marginTop: 2, fontStyle: 'italic' },
  evalCard: { marginBottom: Spacing.md },
  evalDate: { fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.md },
  evalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  evalNotes: { fontSize: FontSize.sm, marginTop: Spacing.md, fontStyle: 'italic' },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.huge, gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', textAlign: 'center' },
  emptyDesc: { fontSize: FontSize.sm, textAlign: 'center', paddingHorizontal: Spacing.xxl },
});
