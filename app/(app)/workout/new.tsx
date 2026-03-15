import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { useTranslation } from '@/i18n';
import { workoutService } from '@/services/workoutService';
import { aiService, GeneratedWorkout } from '@/services/aiService';
import { evaluationService } from '@/services/evaluationService';
import { clientService } from '@/services/clientService';
import { Button, Input, Card } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/constants/theme';
import {
  Workout, Exercise, WorkoutGoal, WorkoutLevel, MuscleGroup,
  Client, Evaluation,
} from '@/types';

type ExerciseWithDay = Exercise & { day: number; dayLabel: string };

const GOALS: WorkoutGoal[] = ['hypertrophy', 'strength', 'endurance', 'weightLoss', 'maintenance', 'rehabilitation'];
const LEVELS: WorkoutLevel[] = ['beginner', 'intermediate', 'advanced'];
const DAYS_OPTIONS = [2, 3, 4, 5, 6];
const MUSCLE_GROUPS: MuscleGroup[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'core', 'glutes', 'quads', 'hamstrings', 'calves', 'cardio', 'fullBody', 'other'];

export default function WorkoutFormScreen() {
  const { clientId, workoutId } = useLocalSearchParams<{ clientId: string; workoutId?: string }>();
  const isEditing = !!workoutId;

  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const language = useAppStore((s) => s.language);
  const t = useTranslation();

  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [latestEval, setLatestEval] = useState<Evaluation | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState<WorkoutGoal>('hypertrophy');
  const [level, setLevel] = useState<WorkoutLevel>('intermediate');
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [exercises, setExercises] = useState<ExerciseWithDay[]>([]);

  const goalLabels: Record<WorkoutGoal, string> = {
    hypertrophy: t.workout.goalHypertrophy,
    strength: t.workout.goalStrength,
    endurance: t.workout.goalEndurance,
    weightLoss: t.workout.goalWeightLoss,
    maintenance: t.workout.goalMaintenance,
    rehabilitation: t.workout.goalRehabilitation,
  };

  const levelLabels: Record<WorkoutLevel, string> = {
    beginner: t.workout.levelBeginner,
    intermediate: t.workout.levelIntermediate,
    advanced: t.workout.levelAdvanced,
  };

  const muscleLabels: Record<MuscleGroup, string> = {
    chest: t.workout.muscleChest,
    back: t.workout.muscleBack,
    shoulders: t.workout.muscleShoulders,
    biceps: t.workout.muscleBiceps,
    triceps: t.workout.muscleTriceps,
    forearms: t.workout.muscleForearms,
    core: t.workout.muscleCore,
    glutes: t.workout.muscleGlutes,
    quads: t.workout.muscleQuads,
    hamstrings: t.workout.muscleHamstrings,
    calves: t.workout.muscleCalves,
    cardio: t.workout.muscleCardio,
    fullBody: t.workout.muscleFullBody,
    other: t.workout.muscleOther,
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientData, evalsResult] = await Promise.all([
          clientService.getById(clientId),
          evaluationService.listByClient(clientId),
        ]);
        const evals = evalsResult.evaluations;
        setClient(clientData);
        setLatestEval(evals.length > 0 ? evals[evals.length - 1] : null);

        if (isEditing && workoutId) {
          const w = await workoutService.getById(workoutId);
          if (w) {
            setName(w.name);
            setDescription(w.description || '');
            if (w.goal) setGoal(w.goal);
            if (w.level) setLevel(w.level);
            if (w.daysPerWeek) setDaysPerWeek(w.daysPerWeek);
            setExercises(w.exercises as ExerciseWithDay[]);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, [clientId, workoutId]);

  const handleGenerateAI = async () => {
    if (!client) return;
    if (!aiService.isConfigured()) {
      Alert.alert('⚠️', t.ai.notConfigured);
      return;
    }
    setAiLoading(true);
    try {
      const generated: GeneratedWorkout = await aiService.generateWorkout(
        client, latestEval, goal, level, daysPerWeek, language
      );
      setName(generated.name);
      setDescription(generated.description);
      setExercises(generated.exercises as ExerciseWithDay[]);
    } catch (err) {
      console.error(err);
      Alert.alert(t.common.error, t.workout.errorGenerate);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || exercises.length === 0 || !user?.uid) return;
    setSaving(true);
    try {
      const workoutData = {
        clientId,
        trainerId: user.uid,
        name: name.trim(),
        description: description.trim() || undefined,
        goal,
        level,
        daysPerWeek,
        exercises,
        aiGenerated: false,
        active: !isEditing, // new workouts default to active
      };

      if (isEditing && workoutId) {
        await workoutService.update(workoutId, workoutData);
      } else {
        await workoutService.create(workoutData);
      }
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert(t.common.error, t.workout.errorSave);
    } finally {
      setSaving(false);
    }
  };

  const addExercise = () => {
    const maxDay = exercises.length > 0 ? Math.max(...exercises.map((e) => e.day || 1)) : 1;
    setExercises([
      ...exercises,
      {
        id: workoutService.makeExerciseId(),
        name: '',
        sets: 3,
        reps: '12',
        rest: '60s',
        muscleGroup: 'other',
        day: maxDay,
        dayLabel: `${t.workout.day} ${maxDay}`,
      },
    ]);
  };

  const updateExercise = (index: number, field: keyof ExerciseWithDay, value: string | number) => {
    setExercises((prev) =>
      prev.map((e, i) => {
        if (i !== index) return e;
        if (field === 'day') {
          return { ...e, day: Number(value), dayLabel: `${t.workout.day} ${value}` };
        }
        return { ...e, [field]: value };
      })
    );
  };

  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const exercisesByDay = exercises.reduce((acc, ex, idx) => {
    const day = ex.day || 1;
    if (!acc[day]) acc[day] = [];
    acc[day].push({ ex, idx });
    return acc;
  }, {} as Record<number, { ex: ExerciseWithDay; idx: number }[]>);

  const isValid = name.trim().length > 0 && exercises.length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.lg }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {isEditing ? t.workout.editWorkout : t.workout.newWorkout}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Client info */}
        {client && (
          <View style={[styles.clientBadge, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="person" size={16} color={colors.primary} />
            <Text style={[styles.clientBadgeText, { color: colors.primary }]}>{client.name}</Text>
          </View>
        )}

        {/* Workout Name */}
        <Input
          label={t.workout.workoutName}
          placeholder={t.workout.workoutNamePlaceholder}
          value={name}
          onChangeText={setName}
        />

        <Input
          label={t.workout.description}
          placeholder={t.workout.descriptionPlaceholder}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        {/* Goal */}
        <View style={styles.selectorSection}>
          <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>{t.workout.goal}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {GOALS.map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => setGoal(g)}
                style={[styles.chip, { backgroundColor: goal === g ? colors.primary : colors.inputBackground, borderColor: goal === g ? colors.primary : colors.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, { color: goal === g ? '#FFF' : colors.textSecondary }]}>{goalLabels[g]}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Level */}
        <View style={styles.selectorSection}>
          <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>{t.workout.level}</Text>
          <View style={styles.levelRow}>
            {LEVELS.map((l) => (
              <TouchableOpacity
                key={l}
                onPress={() => setLevel(l)}
                style={[styles.levelBtn, { flex: 1, backgroundColor: level === l ? colors.primary : colors.inputBackground, borderColor: level === l ? colors.primary : colors.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, { color: level === l ? '#FFF' : colors.textSecondary }]}>{levelLabels[l]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Days per week */}
        <View style={styles.selectorSection}>
          <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>{t.workout.daysPerWeek}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {DAYS_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setDaysPerWeek(d)}
                style={[styles.dayChip, { backgroundColor: daysPerWeek === d ? colors.primary : colors.inputBackground, borderColor: daysPerWeek === d ? colors.primary : colors.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayChipText, { color: daysPerWeek === d ? '#FFF' : colors.text }]}>{d}x</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* AI Generate Button */}
        <TouchableOpacity
          onPress={handleGenerateAI}
          activeOpacity={0.7}
          style={[styles.aiButton, { backgroundColor: colors.accent + '15', borderColor: colors.accent }]}
          disabled={aiLoading}
        >
          {aiLoading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Ionicons name="sparkles" size={18} color={colors.accent} />
          )}
          <Text style={[styles.aiButtonText, { color: colors.accent }]}>
            {aiLoading ? t.workout.generating : t.workout.generateWithAI}
          </Text>
        </TouchableOpacity>

        {/* Exercises */}
        <View style={styles.exerciseHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.workout.exercises}</Text>
          <Text style={[styles.exerciseCount, { color: colors.textSecondary }]}>{exercises.length}</Text>
        </View>

        {Object.entries(exercisesByDay).sort(([a], [b]) => Number(a) - Number(b)).map(([day, items]) => (
          <View key={day}>
            <View style={[styles.dayHeader, { backgroundColor: colors.primary }]}>
              <Text style={styles.dayHeaderText}>
                {items[0]?.ex.dayLabel || `${t.workout.day} ${day}`}
              </Text>
            </View>
            {items.map(({ ex, idx }) => (
              <Card key={ex.id || idx} style={styles.exerciseCard}>
                <View style={styles.exerciseCardHeader}>
                  <Text style={[styles.exerciseOrder, { color: colors.primary }]}>#{idx + 1}</Text>
                  <TouchableOpacity onPress={() => removeExercise(idx)} activeOpacity={0.7}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>

                <Input
                  label={t.workout.exerciseName}
                  placeholder={t.workout.exerciseNamePlaceholder}
                  value={ex.name}
                  onChangeText={(v) => updateExercise(idx, 'name', v)}
                  containerStyle={{ marginBottom: Spacing.sm }}
                />

                <View style={styles.exerciseRow}>
                  <Input
                    label={t.workout.sets}
                    value={String(ex.sets)}
                    onChangeText={(v) => updateExercise(idx, 'sets', parseInt(v) || 1)}
                    keyboardType="numeric"
                    containerStyle={{ flex: 1 }}
                  />
                  <Input
                    label={t.workout.reps}
                    placeholder="12"
                    value={ex.reps}
                    onChangeText={(v) => updateExercise(idx, 'reps', v)}
                    containerStyle={{ flex: 1 }}
                  />
                  <Input
                    label={t.workout.rest}
                    placeholder="60s"
                    value={ex.rest}
                    onChangeText={(v) => updateExercise(idx, 'rest', v)}
                    containerStyle={{ flex: 1 }}
                  />
                </View>

                {/* Muscle group */}
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.workout.muscleGroup}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.muscleRow}>
                  {MUSCLE_GROUPS.map((mg) => (
                    <TouchableOpacity
                      key={mg}
                      onPress={() => updateExercise(idx, 'muscleGroup', mg)}
                      style={[styles.muscleChip, { backgroundColor: ex.muscleGroup === mg ? colors.primary + '25' : colors.inputBackground, borderColor: ex.muscleGroup === mg ? colors.primary : colors.border }]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.muscleChipText, { color: ex.muscleGroup === mg ? colors.primary : colors.textTertiary }]}>
                        {muscleLabels[mg]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Day selector */}
                <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: Spacing.sm }]}>{t.workout.day}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {Array.from({ length: daysPerWeek }, (_, i) => i + 1).map((d) => (
                    <TouchableOpacity
                      key={d}
                      onPress={() => updateExercise(idx, 'day', d)}
                      style={[styles.dayChip, { backgroundColor: ex.day === d ? colors.primary : colors.inputBackground, borderColor: ex.day === d ? colors.primary : colors.border }]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.dayChipText, { color: ex.day === d ? '#FFF' : colors.text }]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Input
                  label={t.workout.notes}
                  placeholder={t.workout.notesPlaceholder}
                  value={ex.notes || ''}
                  onChangeText={(v) => updateExercise(idx, 'notes', v)}
                  containerStyle={{ marginTop: Spacing.sm }}
                />
              </Card>
            ))}
          </View>
        ))}

        <TouchableOpacity
          onPress={addExercise}
          style={[styles.addExerciseBtn, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          <Text style={[styles.addExerciseText, { color: colors.primary }]}>{t.workout.addExercise}</Text>
        </TouchableOpacity>

        <Button
          title={isEditing ? t.workout.updateWorkout : t.workout.saveWorkout}
          onPress={handleSave}
          loading={saving}
          disabled={!isValid}
          size="lg"
          style={styles.saveButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.xl, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl },
  title: { fontSize: FontSize.xl, fontWeight: '700' },
  clientBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, alignSelf: 'flex-start', marginBottom: Spacing.xl },
  clientBadgeText: { fontSize: FontSize.sm, fontWeight: '600' },
  selectorSection: { marginBottom: Spacing.xl },
  selectorLabel: { fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
  chipRow: { flexDirection: 'row' },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1.5, marginRight: Spacing.sm },
  chipText: { fontSize: FontSize.sm, fontWeight: '600' },
  levelRow: { flexDirection: 'row', gap: Spacing.sm },
  levelBtn: { paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1.5, alignItems: 'center' },
  dayChip: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, marginRight: Spacing.sm },
  dayChipText: { fontSize: FontSize.md, fontWeight: '700' },
  aiButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1.5, marginBottom: Spacing.xl },
  aiButtonText: { fontSize: FontSize.md, fontWeight: '700' },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700' },
  exerciseCount: { fontSize: FontSize.sm, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  dayHeader: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, marginBottom: Spacing.sm },
  dayHeaderText: { color: '#FFF', fontWeight: '700', fontSize: FontSize.sm },
  exerciseCard: { marginBottom: Spacing.md },
  exerciseCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  exerciseOrder: { fontSize: FontSize.sm, fontWeight: '700' },
  exerciseRow: { flexDirection: 'row', gap: Spacing.sm },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.xs },
  muscleRow: { marginBottom: Spacing.sm },
  muscleChip: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm, borderWidth: 1, marginRight: Spacing.xs },
  muscleChipText: { fontSize: FontSize.xs, fontWeight: '600' },
  addExerciseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.lg, borderRadius: BorderRadius.md, borderWidth: 1.5, borderStyle: 'dashed', marginBottom: Spacing.xl },
  addExerciseText: { fontSize: FontSize.md, fontWeight: '600' },
  saveButton: { marginBottom: Spacing.xl },
});
