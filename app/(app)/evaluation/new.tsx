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
  Image,
  Switch,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { evaluationService } from '@/services/evaluationService';
import { useTranslation } from '@/i18n';
import { Button, Input, Card, Loading } from '@/components/ui';
import {
  CreateEvaluationForm,
  CircumferencesForm,
  ProtocolsForm,
  AnamnesisForm,
  SkinfoldsForm,
  PosturalAssessmentForm,
  MobilityTestsForm,
  StrengthTestsForm,
  CardioTestsForm,
  ActivityLevel,
} from '@/types';
import { FontSize, Spacing, BorderRadius } from '@/constants/theme';

// ─── Empty form defaults ───────────────────────────────────────────────────────

const emptyAnamnesis: AnamnesisForm = {
  injuryHistory: '',
  healthConditions: '',
  medications: '',
  activityLevel: '',
};

const emptyProtocols: ProtocolsForm = {
  pollock3: '', pollock7: '', leanMass: '', fatMass: '',
  idealWeight: '', maxHeartRate: '', waistHipRatio: '', usNavy: '',
};

const emptySkinfolds: SkinfoldsForm = {
  chest: '', abdomen: '', suprailiac: '', subscapular: '',
  triceps: '', midaxillary: '', thigh: '', biceps: '', medialCalf: '',
};

const emptyCircumferences: CircumferencesForm = {
  neck: '', chest: '', waist: '', abdomen: '', hip: '', shoulder: '',
  rightForearm: '', leftForearm: '',
  rightArmRelaxed: '', leftArmRelaxed: '',
  rightArmFlexed: '', leftArmFlexed: '',
  rightThigh: '', leftThigh: '',
  rightCalf: '', leftCalf: '',
};

const emptyPostural: PosturalAssessmentForm = {
  shoulderAsymmetry: false, scoliosis: false, kyphosis: false, lordosis: false,
  valgusKnee: false, varusKnee: false, pronatedFoot: false, supinatedFoot: false,
  notes: '',
};

const emptyMobility: MobilityTestsForm = {
  sitAndReach: '', shoulderMobility: '', hipMobility: '', ankleMobility: '', notes: '',
};

const emptyStrength: StrengthTestsForm = {
  rm1Squat: '', rm1BenchPress: '', rm1Deadlift: '',
  pushUps: '', sitUps: '', plankSeconds: '', notes: '',
};

const emptyCardio: CardioTestsForm = {
  restingHeartRate: '', cooperTest: '', walk6MinTest: '', notes: '',
};

// ─── Activity level options ────────────────────────────────────────────────────
type ActivityOption = { value: ActivityLevel; labelKey: string };
const ACTIVITY_OPTIONS: ActivityOption[] = [
  { value: 'sedentary',  labelKey: 'activitySedentary' },
  { value: 'light',      labelKey: 'activityLight' },
  { value: 'moderate',   labelKey: 'activityModerate' },
  { value: 'intense',    labelKey: 'activityIntense' },
  { value: 'athlete',    labelKey: 'activityAthlete' },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function NewEvaluationScreen() {
  const { clientId, clientHeight, evaluationId } = useLocalSearchParams<{
    clientId: string;
    clientHeight: string;
    evaluationId?: string;
  }>();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const t = useTranslation();

  const isEditing = !!evaluationId;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  const [form, setForm] = useState<CreateEvaluationForm>({
    weight: '',
    anamnesis: { ...emptyAnamnesis },
    protocols: { ...emptyProtocols },
    skinfolds: { ...emptySkinfolds },
    circumferences: { ...emptyCircumferences },
    posturalAssessment: { ...emptyPostural },
    mobilityTests: { ...emptyMobility },
    strengthTests: { ...emptyStrength },
    cardioTests: { ...emptyCardio },
    notes: '',
  });

  const [photos, setPhotos] = useState<string[]>([]);

  // Collapsible sections
  const [showAnamnesis, setShowAnamnesis] = useState(true);
  const [showProtocols, setShowProtocols] = useState(false);
  const [showSkinfolds, setShowSkinfolds] = useState(false);
  const [showCircumferences, setShowCircumferences] = useState(false);
  const [showPostural, setShowPostural] = useState(false);
  const [showMobility, setShowMobility] = useState(false);
  const [showStrength, setShowStrength] = useState(false);
  const [showCardio, setShowCardio] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);

  // ─── Load existing evaluation ────────────────────────────────────────────────
  useEffect(() => {
    if (isEditing && evaluationId) {
      (async () => {
        try {
          const evaluation = await evaluationService.getById(evaluationId);
          if (evaluation) {
            const p = evaluation.protocols || {};
            const c = evaluation.circumferences || {};
            const sk = evaluation.skinfolds || {};
            const an = evaluation.anamnesis || {};
            const pa = evaluation.posturalAssessment || {};
            const mob = evaluation.mobilityTests || {};
            const str = evaluation.strengthTests || {};
            const car = evaluation.cardioTests || {};

            setForm({
              weight: String(evaluation.weight),
              anamnesis: {
                injuryHistory: an.injuryHistory || '',
                healthConditions: an.healthConditions || '',
                medications: an.medications || '',
                activityLevel: an.activityLevel || '',
              },
              protocols: {
                pollock3:      p.pollock3      != null ? String(p.pollock3)      : '',
                pollock7:      p.pollock7      != null ? String(p.pollock7)      : '',
                leanMass:      p.leanMass      != null ? String(p.leanMass)      : '',
                fatMass:       p.fatMass       != null ? String(p.fatMass)       : '',
                idealWeight:   p.idealWeight   != null ? String(p.idealWeight)   : '',
                maxHeartRate:  p.maxHeartRate  != null ? String(p.maxHeartRate)  : '',
                waistHipRatio: p.waistHipRatio != null ? String(p.waistHipRatio) : '',
                usNavy:        p.usNavy        != null ? String(p.usNavy)        : '',
              },
              skinfolds: {
                chest:        sk.chest        != null ? String(sk.chest)        : '',
                abdomen:      sk.abdomen      != null ? String(sk.abdomen)      : '',
                suprailiac:   sk.suprailiac   != null ? String(sk.suprailiac)   : '',
                subscapular:  sk.subscapular  != null ? String(sk.subscapular)  : '',
                triceps:      sk.triceps      != null ? String(sk.triceps)      : '',
                midaxillary:  sk.midaxillary  != null ? String(sk.midaxillary)  : '',
                thigh:        sk.thigh        != null ? String(sk.thigh)        : '',
                biceps:       sk.biceps       != null ? String(sk.biceps)       : '',
                medialCalf:   sk.medialCalf   != null ? String(sk.medialCalf)   : '',
              },
              circumferences: {
                neck:           c.neck           != null ? String(c.neck)           : '',
                chest:          c.chest          != null ? String(c.chest)          : '',
                waist:          c.waist          != null ? String(c.waist)          : '',
                abdomen:        c.abdomen        != null ? String(c.abdomen)        : '',
                hip:            c.hip            != null ? String(c.hip)            : '',
                shoulder:       c.shoulder       != null ? String(c.shoulder)       : '',
                rightForearm:   c.rightForearm   != null ? String(c.rightForearm)   : '',
                leftForearm:    c.leftForearm    != null ? String(c.leftForearm)    : '',
                rightArmRelaxed:c.rightArmRelaxed!= null ? String(c.rightArmRelaxed): '',
                leftArmRelaxed: c.leftArmRelaxed != null ? String(c.leftArmRelaxed) : '',
                rightArmFlexed: c.rightArmFlexed != null ? String(c.rightArmFlexed) : '',
                leftArmFlexed:  c.leftArmFlexed  != null ? String(c.leftArmFlexed)  : '',
                rightThigh:     c.rightThigh     != null ? String(c.rightThigh)     : '',
                leftThigh:      c.leftThigh      != null ? String(c.leftThigh)      : '',
                rightCalf:      c.rightCalf      != null ? String(c.rightCalf)      : '',
                leftCalf:       c.leftCalf       != null ? String(c.leftCalf)       : '',
              },
              posturalAssessment: {
                shoulderAsymmetry: pa.shoulderAsymmetry ?? false,
                scoliosis:         pa.scoliosis         ?? false,
                kyphosis:          pa.kyphosis          ?? false,
                lordosis:          pa.lordosis          ?? false,
                valgusKnee:        pa.valgusKnee        ?? false,
                varusKnee:         pa.varusKnee         ?? false,
                pronatedFoot:      pa.pronatedFoot      ?? false,
                supinatedFoot:     pa.supinatedFoot     ?? false,
                notes:             pa.notes             ?? '',
              },
              mobilityTests: {
                sitAndReach:     mob.sitAndReach     != null ? String(mob.sitAndReach) : '',
                shoulderMobility:mob.shoulderMobility ?? '',
                hipMobility:     mob.hipMobility      ?? '',
                ankleMobility:   mob.ankleMobility    ?? '',
                notes:           mob.notes            ?? '',
              },
              strengthTests: {
                rm1Squat:      str.rm1Squat      != null ? String(str.rm1Squat)      : '',
                rm1BenchPress: str.rm1BenchPress  != null ? String(str.rm1BenchPress) : '',
                rm1Deadlift:   str.rm1Deadlift    != null ? String(str.rm1Deadlift)   : '',
                pushUps:       str.pushUps        != null ? String(str.pushUps)       : '',
                sitUps:        str.sitUps         != null ? String(str.sitUps)        : '',
                plankSeconds:  str.plankSeconds   != null ? String(str.plankSeconds)  : '',
                notes:         str.notes          ?? '',
              },
              cardioTests: {
                restingHeartRate: car.restingHeartRate != null ? String(car.restingHeartRate) : '',
                cooperTest:       car.cooperTest       != null ? String(car.cooperTest)       : '',
                walk6MinTest:     car.walk6MinTest      != null ? String(car.walk6MinTest)     : '',
                notes:            car.notes            ?? '',
              },
              notes: evaluation.notes || '',
            });

            setPhotos(evaluation.photos || []);

            // Auto-expand sections with data
            if (Object.values(an).some((v) => v)) setShowAnamnesis(true);
            if (Object.values(c).some((v) => v != null && v > 0)) setShowCircumferences(true);
            if (Object.values(sk).some((v) => v != null && v > 0)) setShowSkinfolds(true);
            if (Object.values(pa).some((v) => v)) setShowPostural(true);
            if (Object.values(mob).some((v) => v)) setShowMobility(true);
            if (Object.values(str).some((v) => v)) setShowStrength(true);
            if (Object.values(car).some((v) => v)) setShowCardio(true);
            if (evaluation.photos && evaluation.photos.length > 0) setShowPhotos(true);
          }
        } catch (err) {
          console.error('Failed to load evaluation:', err);
        } finally {
          setInitialLoading(false);
        }
      })();
    }
  }, [evaluationId, isEditing]);

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const isValid = form.weight.length > 0;

  const updateAnamnesis = (field: keyof AnamnesisForm, value: string) =>
    setForm((prev) => ({ ...prev, anamnesis: { ...prev.anamnesis, [field]: value } }));

  const updateProtocol = (field: keyof ProtocolsForm, value: string) =>
    setForm((prev) => ({ ...prev, protocols: { ...prev.protocols, [field]: value } }));

  const updateSkinfold = (field: keyof SkinfoldsForm, value: string) =>
    setForm((prev) => ({ ...prev, skinfolds: { ...prev.skinfolds, [field]: value } }));

  const updateCircumference = (field: keyof CircumferencesForm, value: string) =>
    setForm((prev) => ({ ...prev, circumferences: { ...prev.circumferences, [field]: value } }));

  const updatePostural = (field: keyof PosturalAssessmentForm, value: boolean | string) =>
    setForm((prev) => ({ ...prev, posturalAssessment: { ...prev.posturalAssessment, [field]: value } }));

  const updateMobility = (field: keyof MobilityTestsForm, value: string) =>
    setForm((prev) => ({ ...prev, mobilityTests: { ...prev.mobilityTests, [field]: value } }));

  const updateStrength = (field: keyof StrengthTestsForm, value: string) =>
    setForm((prev) => ({ ...prev, strengthTests: { ...prev.strengthTests, [field]: value } }));

  const updateCardio = (field: keyof CardioTestsForm, value: string) =>
    setForm((prev) => ({ ...prev, cardioTests: { ...prev.cardioTests, [field]: value } }));

  // ─── Photos ──────────────────────────────────────────────────────────────────

  const addPhotoFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled) setPhotos((prev) => [...prev, result.assets[0].uri]);
  };

  const addPhotoFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.evaluation.permissionNeeded, t.evaluation.cameraPermission);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled) setPhotos((prev) => [...prev, result.assets[0].uri]);
  };

  const showAddPhotoOptions = () => {
    Alert.alert(t.evaluation.addPhoto, t.evaluation.choosePhotoSource, [
      { text: t.evaluation.camera, onPress: addPhotoFromCamera },
      { text: t.evaluation.gallery, onPress: addPhotoFromGallery },
      { text: t.common.cancel, style: 'cancel' },
    ]);
  };

  const removePhoto = (index: number) =>
    setPhotos((prev) => prev.filter((_, i) => i !== index));

  // ─── Save ─────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!isValid || !user?.uid || !clientId) return;
    setLoading(true);
    try {
      if (isEditing && evaluationId) {
        await evaluationService.update(evaluationId, clientId, parseFloat(clientHeight || '0'), form, photos);
      } else {
        await evaluationService.create(user.uid, clientId, parseFloat(clientHeight || '0'), form, photos.length > 0 ? photos : undefined);
      }
      router.back();
    } catch (err) {
      Alert.alert(t.common.error, t.evaluation.errorSaveEvaluation);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Sub-components ──────────────────────────────────────────────────────────

  const SectionHeader = ({ title, isOpen, onToggle }: { title: string; isOpen: boolean; onToggle: () => void }) => (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
    >
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{title}</Text>
      <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const CheckRow = ({
    label,
    value,
    onToggle,
  }: {
    label: string;
    value: boolean;
    onToggle: (v: boolean) => void;
  }) => (
    <View style={[styles.checkRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.checkLabel, { color: colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary + '66' }}
        thumbColor={value ? colors.primary : colors.textTertiary}
      />
    </View>
  );

  const ActivitySelector = () => (
    <View style={styles.activityGroup}>
      {ACTIVITY_OPTIONS.map((opt) => {
        const isSelected = form.anamnesis.activityLevel === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            activeOpacity={0.7}
            onPress={() => updateAnamnesis('activityLevel', isSelected ? '' : opt.value)}
            style={[
              styles.activityChip,
              {
                backgroundColor: isSelected ? colors.primary : colors.inputBackground,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.activityChipText, { color: isSelected ? '#FFF' : colors.textSecondary }]}>
              {(t.evaluation as Record<string, string>)[opt.labelKey]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ─── Loading guard ────────────────────────────────────────────────────────────

  if (initialLoading) return <Loading message={t.common.loading} />;

  // ─── Render ──────────────────────────────────────────────────────────────────

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
            {isEditing ? t.evaluation.editEvaluation : t.evaluation.newEvaluation}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* ═══════════════════════════════════════════ */}
        {/* 1. WEIGHT (always visible) */}
        {/* ═══════════════════════════════════════════ */}
        <Input
          label={t.evaluation.weightKg}
          placeholder={t.evaluation.weightPlaceholder}
          value={form.weight}
          onChangeText={(v) => setForm((prev) => ({ ...prev, weight: v }))}
          keyboardType="decimal-pad"
        />

        {/* BMI Preview */}
        {form.weight && clientHeight && parseFloat(clientHeight) > 0 && (
          <Card style={styles.bmiCard}>
            <View style={styles.bmiRow}>
              <Ionicons name="analytics" size={20} color={colors.primary} />
              <Text style={[styles.bmiLabel, { color: colors.textSecondary }]}>
                {t.evaluation.calculatedBmi}
              </Text>
              <Text style={[styles.bmiValue, { color: colors.text }]}>
                {(parseFloat(form.weight) / (parseFloat(clientHeight) * parseFloat(clientHeight))).toFixed(1)}
              </Text>
            </View>
          </Card>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* 2. ANAMNESE */}
        {/* ═══════════════════════════════════════════ */}
        <SectionHeader title={t.evaluation.anamnesis} isOpen={showAnamnesis} onToggle={() => setShowAnamnesis(!showAnamnesis)} />
        {showAnamnesis && (
          <View style={styles.sectionContent}>
            <Input
              label={t.evaluation.injuryHistory}
              placeholder={t.evaluation.injuryHistoryPlaceholder}
              value={form.anamnesis.injuryHistory}
              onChangeText={(v) => updateAnamnesis('injuryHistory', v)}
              multiline
              numberOfLines={3}
              style={styles.multilineInput}
            />
            <Input
              label={t.evaluation.healthConditions}
              placeholder={t.evaluation.healthConditionsPlaceholder}
              value={form.anamnesis.healthConditions}
              onChangeText={(v) => updateAnamnesis('healthConditions', v)}
              multiline
              numberOfLines={3}
              style={styles.multilineInput}
            />
            <Input
              label={t.evaluation.medications}
              placeholder={t.evaluation.medicationsPlaceholder}
              value={form.anamnesis.medications}
              onChangeText={(v) => updateAnamnesis('medications', v)}
              multiline
              numberOfLines={2}
              style={styles.multilineInput}
            />
            <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
              {t.evaluation.activityLevel}
            </Text>
            <ActivitySelector />
          </View>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* 3. COMPOSIÇÃO CORPORAL / PROTOCOLOS */}
        {/* ═══════════════════════════════════════════ */}
        <SectionHeader title={t.evaluation.protocols} isOpen={showProtocols} onToggle={() => setShowProtocols(!showProtocols)} />
        {showProtocols && (
          <View style={styles.sectionContent}>
            <View style={styles.row}>
              <Input label={t.evaluation.pollock3} placeholder={t.evaluation.pollock3Placeholder} value={form.protocols.pollock3} onChangeText={(v) => updateProtocol('pollock3', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
              <Input label={t.evaluation.pollock7} placeholder={t.evaluation.pollock7Placeholder} value={form.protocols.pollock7} onChangeText={(v) => updateProtocol('pollock7', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
            </View>
            <View style={styles.row}>
              <Input label={t.evaluation.leanMass} placeholder={t.evaluation.leanMassPlaceholder} value={form.protocols.leanMass} onChangeText={(v) => updateProtocol('leanMass', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
              <Input label={t.evaluation.fatMass} placeholder={t.evaluation.fatMassPlaceholder} value={form.protocols.fatMass} onChangeText={(v) => updateProtocol('fatMass', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
            </View>
            <View style={styles.row}>
              <Input label={t.evaluation.idealWeight} placeholder={t.evaluation.idealWeightPlaceholder} value={form.protocols.idealWeight} onChangeText={(v) => updateProtocol('idealWeight', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
              <Input label={t.evaluation.maxHeartRate} placeholder={t.evaluation.maxHeartRatePlaceholder} value={form.protocols.maxHeartRate} onChangeText={(v) => updateProtocol('maxHeartRate', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
            </View>
            <View style={styles.row}>
              <Input label={t.evaluation.waistHipRatio} placeholder={t.evaluation.waistHipRatioPlaceholder} value={form.protocols.waistHipRatio} onChangeText={(v) => updateProtocol('waistHipRatio', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
              <Input label={t.evaluation.usNavy} placeholder={t.evaluation.usNavyPlaceholder} value={form.protocols.usNavy} onChangeText={(v) => updateProtocol('usNavy', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* 4. DOBRAS CUTÂNEAS */}
        {/* ═══════════════════════════════════════════ */}
        <SectionHeader title={t.evaluation.skinfolds} isOpen={showSkinfolds} onToggle={() => setShowSkinfolds(!showSkinfolds)} />
        {showSkinfolds && (
          <View style={styles.sectionContent}>
            <View style={styles.row}>
              <Input label={t.evaluation.skinfoldChest} placeholder={t.evaluation.mmPlaceholder} value={form.skinfolds.chest} onChangeText={(v) => updateSkinfold('chest', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
              <Input label={t.evaluation.skinfoldAbdomen} placeholder={t.evaluation.mmPlaceholder} value={form.skinfolds.abdomen} onChangeText={(v) => updateSkinfold('abdomen', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
            </View>
            <View style={styles.row}>
              <Input label={t.evaluation.skinfoldSuprailiac} placeholder={t.evaluation.mmPlaceholder} value={form.skinfolds.suprailiac} onChangeText={(v) => updateSkinfold('suprailiac', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
              <Input label={t.evaluation.skinfoldSubscapular} placeholder={t.evaluation.mmPlaceholder} value={form.skinfolds.subscapular} onChangeText={(v) => updateSkinfold('subscapular', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
            </View>
            <View style={styles.row}>
              <Input label={t.evaluation.skinfoldTriceps} placeholder={t.evaluation.mmPlaceholder} value={form.skinfolds.triceps} onChangeText={(v) => updateSkinfold('triceps', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
              <Input label={t.evaluation.skinfoldMidaxillary} placeholder={t.evaluation.mmPlaceholder} value={form.skinfolds.midaxillary} onChangeText={(v) => updateSkinfold('midaxillary', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
            </View>
            <View style={styles.row}>
              <Input label={t.evaluation.skinfoldThigh} placeholder={t.evaluation.mmPlaceholder} value={form.skinfolds.thigh} onChangeText={(v) => updateSkinfold('thigh', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
              <Input label={t.evaluation.skinfoldBiceps} placeholder={t.evaluation.mmPlaceholder} value={form.skinfolds.biceps} onChangeText={(v) => updateSkinfold('biceps', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
            </View>
            <View style={styles.row}>
              <Input label={t.evaluation.skinfoldMedialCalf} placeholder={t.evaluation.mmPlaceholder} value={form.skinfolds.medialCalf} onChangeText={(v) => updateSkinfold('medialCalf', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
              <View style={styles.halfInput} />
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* 5. PERIMETRIA */}
        {/* ═══════════════════════════════════════════ */}
        <SectionHeader title={t.evaluation.circumferences} isOpen={showCircumferences} onToggle={() => setShowCircumferences(!showCircumferences)} />
        {showCircumferences && (
          <View style={styles.sectionContent}>
            <View style={styles.row}>
              <Input label={t.evaluation.neck} placeholder={t.evaluation.cmPlaceholder} value={form.circumferences.neck} onChangeText={(v) => updateCircumference('neck', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
              <Input label={t.evaluation.chest} placeholder={t.evaluation.cmPlaceholder} value={form.circumferences.chest} onChangeText={(v) => updateCircumference('chest', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
            </View>
            <View style={styles.row}>
              <Input label={t.evaluation.waist} placeholder={t.evaluation.cmPlaceholder} value={form.circumferences.waist} onChangeText={(v) => updateCircumference('waist', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
              <Input label={t.evaluation.abdomen} placeholder={t.evaluation.cmPlaceholder} value={form.circumferences.abdomen} onChangeText={(v) => updateCircumference('abdomen', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
            </View>
            <View style={styles.row}>
              <Input label={t.evaluation.hip} placeholder={t.evaluation.cmPlaceholder} value={form.circumferences.hip} onChangeText={(v) => updateCircumference('hip', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
              <Input label={t.evaluation.shoulder} placeholder={t.evaluation.cmPlaceholder} value={form.circumferences.shoulder} onChangeText={(v) => updateCircumference('shoulder', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
            </View>
            <View style={styles.row}>
              <Input label={t.evaluation.rightForearm} placeholder={t.evaluation.cmPlaceholder} value={form.circumferences.rightForearm} onChangeText={(v) => updateCircumference('rightForearm', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
              <Input label={t.evaluation.leftForearm} placeholder={t.evaluation.cmPlaceholder} value={form.circumferences.leftForearm} onChangeText={(v) => updateCircumference('leftForearm', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
            </View>
            <View style={styles.row}>
              <Input label={t.evaluation.rightArmRelaxed} placeholder={t.evaluation.cmPlaceholder} value={form.circumferences.rightArmRelaxed} onChangeText={(v) => updateCircumference('rightArmRelaxed', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
              <Input label={t.evaluation.leftArmRelaxed} placeholder={t.evaluation.cmPlaceholder} value={form.circumferences.leftArmRelaxed} onChangeText={(v) => updateCircumference('leftArmRelaxed', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
            </View>
            <View style={styles.row}>
              <Input label={t.evaluation.rightArmFlexed} placeholder={t.evaluation.cmPlaceholder} value={form.circumferences.rightArmFlexed} onChangeText={(v) => updateCircumference('rightArmFlexed', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
              <Input label={t.evaluation.leftArmFlexed} placeholder={t.evaluation.cmPlaceholder} value={form.circumferences.leftArmFlexed} onChangeText={(v) => updateCircumference('leftArmFlexed', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
            </View>
            <View style={styles.row}>
              <Input label={t.evaluation.rightThigh} placeholder={t.evaluation.cmPlaceholder} value={form.circumferences.rightThigh} onChangeText={(v) => updateCircumference('rightThigh', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
              <Input label={t.evaluation.leftThigh} placeholder={t.evaluation.cmPlaceholder} value={form.circumferences.leftThigh} onChangeText={(v) => updateCircumference('leftThigh', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
            </View>
            <View style={styles.row}>
              <Input label={t.evaluation.rightCalf} placeholder={t.evaluation.cmPlaceholder} value={form.circumferences.rightCalf} onChangeText={(v) => updateCircumference('rightCalf', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
              <Input label={t.evaluation.leftCalf} placeholder={t.evaluation.cmPlaceholder} value={form.circumferences.leftCalf} onChangeText={(v) => updateCircumference('leftCalf', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* 6. AVALIAÇÃO POSTURAL */}
        {/* ═══════════════════════════════════════════ */}
        <SectionHeader title={t.evaluation.posturalAssessment} isOpen={showPostural} onToggle={() => setShowPostural(!showPostural)} />
        {showPostural && (
          <View style={styles.sectionContent}>
            <Card style={styles.checkCard}>
              <CheckRow label={t.evaluation.shoulderAsymmetry} value={form.posturalAssessment.shoulderAsymmetry} onToggle={(v) => updatePostural('shoulderAsymmetry', v)} />
              <CheckRow label={t.evaluation.scoliosis}         value={form.posturalAssessment.scoliosis}         onToggle={(v) => updatePostural('scoliosis', v)} />
              <CheckRow label={t.evaluation.kyphosis}          value={form.posturalAssessment.kyphosis}          onToggle={(v) => updatePostural('kyphosis', v)} />
              <CheckRow label={t.evaluation.lordosis}          value={form.posturalAssessment.lordosis}          onToggle={(v) => updatePostural('lordosis', v)} />
              <CheckRow label={t.evaluation.valgusKnee}        value={form.posturalAssessment.valgusKnee}        onToggle={(v) => updatePostural('valgusKnee', v)} />
              <CheckRow label={t.evaluation.varusKnee}         value={form.posturalAssessment.varusKnee}         onToggle={(v) => updatePostural('varusKnee', v)} />
              <CheckRow label={t.evaluation.pronatedFoot}      value={form.posturalAssessment.pronatedFoot}      onToggle={(v) => updatePostural('pronatedFoot', v)} />
              <CheckRow label={t.evaluation.supinatedFoot}     value={form.posturalAssessment.supinatedFoot}     onToggle={(v) => updatePostural('supinatedFoot', v)} />
            </Card>
            <Input
              label={t.evaluation.posturalNotes}
              placeholder={t.evaluation.posturalNotesPlaceholder}
              value={form.posturalAssessment.notes}
              onChangeText={(v) => updatePostural('notes', v)}
              multiline
              numberOfLines={3}
              style={styles.multilineInput}
            />
          </View>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* 7. MOBILIDADE E FLEXIBILIDADE */}
        {/* ═══════════════════════════════════════════ */}
        <SectionHeader title={t.evaluation.mobilityTests} isOpen={showMobility} onToggle={() => setShowMobility(!showMobility)} />
        {showMobility && (
          <View style={styles.sectionContent}>
            <Input label={t.evaluation.sitAndReach} placeholder={t.evaluation.sitAndReachPlaceholder} value={form.mobilityTests.sitAndReach} onChangeText={(v) => updateMobility('sitAndReach', v)} keyboardType="decimal-pad" />
            <View style={styles.row}>
              <Input label={t.evaluation.shoulderMobility} placeholder={t.evaluation.shoulderMobilityPlaceholder} value={form.mobilityTests.shoulderMobility} onChangeText={(v) => updateMobility('shoulderMobility', v)} containerStyle={styles.halfInput} />
              <Input label={t.evaluation.hipMobility} placeholder={t.evaluation.hipMobilityPlaceholder} value={form.mobilityTests.hipMobility} onChangeText={(v) => updateMobility('hipMobility', v)} containerStyle={styles.halfInput} />
            </View>
            <Input label={t.evaluation.ankleMobility} placeholder={t.evaluation.ankleMobilityPlaceholder} value={form.mobilityTests.ankleMobility} onChangeText={(v) => updateMobility('ankleMobility', v)} />
            <Input
              label={t.evaluation.mobilityNotes}
              placeholder={t.evaluation.mobilityNotesPlaceholder}
              value={form.mobilityTests.notes}
              onChangeText={(v) => updateMobility('notes', v)}
              multiline
              numberOfLines={2}
              style={styles.multilineInput}
            />
          </View>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* 8. TESTES DE FORÇA */}
        {/* ═══════════════════════════════════════════ */}
        <SectionHeader title={t.evaluation.strengthTests} isOpen={showStrength} onToggle={() => setShowStrength(!showStrength)} />
        {showStrength && (
          <View style={styles.sectionContent}>
            <View style={styles.row}>
              <Input label={t.evaluation.rm1Squat}      placeholder={t.evaluation.kgPlaceholder}   value={form.strengthTests.rm1Squat}      onChangeText={(v) => updateStrength('rm1Squat', v)}      keyboardType="decimal-pad" containerStyle={styles.halfInput} />
              <Input label={t.evaluation.rm1BenchPress} placeholder={t.evaluation.kgPlaceholder}   value={form.strengthTests.rm1BenchPress} onChangeText={(v) => updateStrength('rm1BenchPress', v)} keyboardType="decimal-pad" containerStyle={styles.halfInput} />
            </View>
            <View style={styles.row}>
              <Input label={t.evaluation.rm1Deadlift}   placeholder={t.evaluation.kgPlaceholder}   value={form.strengthTests.rm1Deadlift}   onChangeText={(v) => updateStrength('rm1Deadlift', v)}   keyboardType="decimal-pad" containerStyle={styles.halfInput} />
              <Input label={t.evaluation.pushUps}       placeholder={t.evaluation.repsPlaceholder} value={form.strengthTests.pushUps}       onChangeText={(v) => updateStrength('pushUps', v)}       keyboardType="number-pad"  containerStyle={styles.halfInput} />
            </View>
            <View style={styles.row}>
              <Input label={t.evaluation.sitUps}        placeholder={t.evaluation.repsPlaceholder} value={form.strengthTests.sitUps}        onChangeText={(v) => updateStrength('sitUps', v)}        keyboardType="number-pad"  containerStyle={styles.halfInput} />
              <Input label={t.evaluation.plankSeconds}  placeholder={t.evaluation.secondsPlaceholder} value={form.strengthTests.plankSeconds}  onChangeText={(v) => updateStrength('plankSeconds', v)}  keyboardType="number-pad"  containerStyle={styles.halfInput} />
            </View>
            <Input
              label={t.evaluation.strengthNotes}
              placeholder={t.evaluation.strengthNotesPlaceholder}
              value={form.strengthTests.notes}
              onChangeText={(v) => updateStrength('notes', v)}
              multiline
              numberOfLines={2}
              style={styles.multilineInput}
            />
          </View>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* 9. AVALIAÇÃO CARDIORRESPIRATÓRIA */}
        {/* ═══════════════════════════════════════════ */}
        <SectionHeader title={t.evaluation.cardioTests} isOpen={showCardio} onToggle={() => setShowCardio(!showCardio)} />
        {showCardio && (
          <View style={styles.sectionContent}>
            <Input label={t.evaluation.restingHeartRate} placeholder={t.evaluation.bpmPlaceholder}    value={form.cardioTests.restingHeartRate} onChangeText={(v) => updateCardio('restingHeartRate', v)} keyboardType="number-pad" />
            <View style={styles.row}>
              <Input label={t.evaluation.cooperTest}   placeholder={t.evaluation.metersPlaceholder} value={form.cardioTests.cooperTest}   onChangeText={(v) => updateCardio('cooperTest', v)}   keyboardType="number-pad" containerStyle={styles.halfInput} />
              <Input label={t.evaluation.walk6MinTest} placeholder={t.evaluation.metersPlaceholder} value={form.cardioTests.walk6MinTest} onChangeText={(v) => updateCardio('walk6MinTest', v)} keyboardType="number-pad" containerStyle={styles.halfInput} />
            </View>
            <Input
              label={t.evaluation.cardioNotes}
              placeholder={t.evaluation.cardioNotesPlaceholder}
              value={form.cardioTests.notes}
              onChangeText={(v) => updateCardio('notes', v)}
              multiline
              numberOfLines={2}
              style={styles.multilineInput}
            />
          </View>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* 10. FOTOS DE PROGRESSO */}
        {/* ═══════════════════════════════════════════ */}
        <SectionHeader title={t.evaluation.progressPhotos} isOpen={showPhotos} onToggle={() => setShowPhotos(!showPhotos)} />
        {showPhotos && (
          <View style={styles.sectionContent}>
            <View style={styles.photosGrid}>
              {photos.map((uri, index) => (
                <View key={`photo-${index}`} style={styles.photoWrapper}>
                  <Image source={{ uri }} style={[styles.photoImage, { borderColor: colors.border }]} />
                  <TouchableOpacity
                    onPress={() => removePhoto(index)}
                    style={[styles.removePhotoBtn, { backgroundColor: colors.error }]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={14} color="#FFF" />
                  </TouchableOpacity>
                  <Text style={[styles.photoIndex, { color: colors.textTertiary }]}>
                    {t.evaluation.photoLabel} {index + 1}
                  </Text>
                </View>
              ))}
              <TouchableOpacity
                onPress={showAddPhotoOptions}
                activeOpacity={0.7}
                style={[styles.addPhotoCard, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              >
                <Ionicons name="add-circle-outline" size={32} color={colors.primary} />
                <Text style={[styles.addPhotoText, { color: colors.primary }]}>{t.evaluation.addPhoto}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Notes */}
        <Input
          label={t.evaluation.notes}
          placeholder={t.evaluation.notesPlaceholder}
          value={form.notes}
          onChangeText={(v) => setForm((prev) => ({ ...prev, notes: v }))}
          multiline
          numberOfLines={3}
          style={styles.multilineInput}
        />

        {/* Save */}
        <Button
          title={isEditing ? t.evaluation.updateEvaluation : t.evaluation.saveEvaluation}
          onPress={handleSave}
          loading={loading}
          disabled={!isValid}
          size="lg"
          style={styles.saveButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing.huge * 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xxl,
  },
  title: { fontSize: FontSize.xl, fontWeight: '700' },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 1 },
  sectionContent: { marginTop: Spacing.sm },

  // Row / inputs
  row: { flexDirection: 'row', gap: Spacing.md },
  halfInput: { flex: 1 },
  multilineInput: { height: 72, textAlignVertical: 'top' },
  subLabel: { fontSize: FontSize.sm, fontWeight: '600', marginBottom: Spacing.sm, marginTop: Spacing.xs },

  // Activity level chips
  activityGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  activityChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  activityChipText: { fontSize: FontSize.xs, fontWeight: '600' },

  // Checkboxes / postural
  checkCard: { marginBottom: Spacing.sm, padding: 0, overflow: 'hidden' },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkLabel: { fontSize: FontSize.md, flex: 1 },

  // Photos grid
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.lg },
  photoWrapper: { width: '30%', aspectRatio: 3 / 4, position: 'relative' },
  photoImage: { width: '100%', height: '100%', borderRadius: BorderRadius.md, borderWidth: 1 },
  removePhotoBtn: {
    position: 'absolute', top: -6, right: -6,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  photoIndex: { fontSize: FontSize.xs, textAlign: 'center', marginTop: 4 },
  addPhotoCard: {
    width: '30%', aspectRatio: 3 / 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs,
  },
  addPhotoText: { fontSize: FontSize.xs, fontWeight: '600' },

  // BMI
  bmiCard: { marginBottom: Spacing.sm },
  bmiRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  bmiLabel: { flex: 1, fontSize: FontSize.md },
  bmiValue: { fontSize: FontSize.xl, fontWeight: '700' },

  saveButton: { marginTop: Spacing.lg, marginBottom: Spacing.xxl },
});
