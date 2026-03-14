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
import { CreateEvaluationForm, CircumferencesForm, ProtocolsForm } from '@/types';
import { FontSize, Spacing, BorderRadius } from '@/constants/theme';

const emptyProtocols: ProtocolsForm = {
  pollock3: '', pollock7: '', leanMass: '', fatMass: '',
  idealWeight: '', maxHeartRate: '', waistHipRatio: '', usNavy: '',
};

const emptyCircumferences: CircumferencesForm = {
  neck: '', chest: '', waist: '', abdomen: '', hip: '', shoulder: '',
  rightForearm: '', leftForearm: '',
  rightArmRelaxed: '', leftArmRelaxed: '',
  rightArmFlexed: '', leftArmFlexed: '',
  rightThigh: '', leftThigh: '',
  rightCalf: '', leftCalf: '',
};

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
    protocols: { ...emptyProtocols },
    circumferences: { ...emptyCircumferences },
    notes: '',
  });

  // Dynamic photo array — URIs (local) or URLs (already uploaded)
  const [photos, setPhotos] = useState<string[]>([]);

  // Collapsible sections
  const [showProtocols, setShowProtocols] = useState(true);
  const [showCircumferences, setShowCircumferences] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);

  // If editing, load existing evaluation data
  useEffect(() => {
    if (isEditing && evaluationId) {
      (async () => {
        try {
          const evaluation = await evaluationService.getById(evaluationId);
          if (evaluation) {
            const p = evaluation.protocols || {};
            const c = evaluation.circumferences || {};
            setForm({
              weight: String(evaluation.weight),
              protocols: {
                pollock3: p.pollock3 != null ? String(p.pollock3) : '',
                pollock7: p.pollock7 != null ? String(p.pollock7) : '',
                leanMass: p.leanMass != null ? String(p.leanMass) : '',
                fatMass: p.fatMass != null ? String(p.fatMass) : '',
                idealWeight: p.idealWeight != null ? String(p.idealWeight) : '',
                maxHeartRate: p.maxHeartRate != null ? String(p.maxHeartRate) : '',
                waistHipRatio: p.waistHipRatio != null ? String(p.waistHipRatio) : '',
                usNavy: p.usNavy != null ? String(p.usNavy) : '',
              },
              circumferences: {
                neck: c.neck != null ? String(c.neck) : '',
                chest: c.chest != null ? String(c.chest) : '',
                waist: c.waist != null ? String(c.waist) : '',
                abdomen: c.abdomen != null ? String(c.abdomen) : '',
                hip: c.hip != null ? String(c.hip) : '',
                shoulder: c.shoulder != null ? String(c.shoulder) : '',
                rightForearm: c.rightForearm != null ? String(c.rightForearm) : '',
                leftForearm: c.leftForearm != null ? String(c.leftForearm) : '',
                rightArmRelaxed: c.rightArmRelaxed != null ? String(c.rightArmRelaxed) : '',
                leftArmRelaxed: c.leftArmRelaxed != null ? String(c.leftArmRelaxed) : '',
                rightArmFlexed: c.rightArmFlexed != null ? String(c.rightArmFlexed) : '',
                leftArmFlexed: c.leftArmFlexed != null ? String(c.leftArmFlexed) : '',
                rightThigh: c.rightThigh != null ? String(c.rightThigh) : '',
                leftThigh: c.leftThigh != null ? String(c.leftThigh) : '',
                rightCalf: c.rightCalf != null ? String(c.rightCalf) : '',
                leftCalf: c.leftCalf != null ? String(c.leftCalf) : '',
              },
              notes: evaluation.notes || '',
            });
            setPhotos(evaluation.photos || []);
            // Auto-expand sections that have data
            const hasCirc = Object.values(c).some((v) => v != null && v > 0);
            if (hasCirc) setShowCircumferences(true);
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

  const isValid = form.weight.length > 0;

  const updateProtocol = (field: keyof ProtocolsForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      protocols: { ...prev.protocols, [field]: value },
    }));
  };

  const updateCircumference = (field: keyof CircumferencesForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      circumferences: { ...prev.circumferences, [field]: value },
    }));
  };

  // ===== Dynamic photo handling =====
  const addPhotoFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
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
    if (!result.canceled) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const showAddPhotoOptions = () => {
    Alert.alert(t.evaluation.addPhoto, t.evaluation.choosePhotoSource, [
      { text: t.evaluation.camera, onPress: addPhotoFromCamera },
      { text: t.evaluation.gallery, onPress: addPhotoFromGallery },
      { text: t.common.cancel, style: 'cancel' },
    ]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // ===== Save / Update =====
  const handleSave = async () => {
    if (!isValid || !user?.uid || !clientId) return;
    setLoading(true);
    try {
      if (isEditing && evaluationId) {
        await evaluationService.update(
          evaluationId,
          clientId,
          parseFloat(clientHeight || '0'),
          form,
          photos
        );
      } else {
        await evaluationService.create(
          user.uid,
          clientId,
          parseFloat(clientHeight || '0'),
          form,
          photos.length > 0 ? photos : undefined
        );
      }
      router.back();
    } catch (err) {
      Alert.alert(t.common.error, t.evaluation.errorSaveEvaluation);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ===== UI Components =====
  const SectionHeader = ({
    title,
    isOpen,
    onToggle,
  }: {
    title: string;
    isOpen: boolean;
    onToggle: () => void;
  }) => (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
    >
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        {title}
      </Text>
      <Ionicons
        name={isOpen ? 'chevron-up' : 'chevron-down'}
        size={20}
        color={colors.textSecondary}
      />
    </TouchableOpacity>
  );

  if (initialLoading) {
    return <Loading message={t.common.loading} />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.lg },
        ]}
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

        {/* Weight (always visible) */}
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
                {(
                  parseFloat(form.weight) /
                  (parseFloat(clientHeight) * parseFloat(clientHeight))
                ).toFixed(1)}
              </Text>
            </View>
          </Card>
        )}

        {/* ===== PROTOCOLS SECTION ===== */}
        <SectionHeader
          title={t.evaluation.protocols}
          isOpen={showProtocols}
          onToggle={() => setShowProtocols(!showProtocols)}
        />
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

        {/* ===== CIRCUMFERENCES SECTION ===== */}
        <SectionHeader
          title={t.evaluation.circumferences}
          isOpen={showCircumferences}
          onToggle={() => setShowCircumferences(!showCircumferences)}
        />
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

        {/* ===== PHOTOS SECTION (dynamic) ===== */}
        <SectionHeader
          title={t.evaluation.progressPhotos}
          isOpen={showPhotos}
          onToggle={() => setShowPhotos(!showPhotos)}
        />
        {showPhotos && (
          <View style={styles.sectionContent}>
            {/* Existing photos grid */}
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

              {/* Add photo button */}
              <TouchableOpacity
                onPress={showAddPhotoOptions}
                activeOpacity={0.7}
                style={[
                  styles.addPhotoCard,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons name="add-circle-outline" size={32} color={colors.primary} />
                <Text style={[styles.addPhotoText, { color: colors.primary }]}>
                  {t.evaluation.addPhoto}
                </Text>
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
          style={{ height: 80, textAlignVertical: 'top' }}
        />

        {/* Save / Update */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: Spacing.xl,
    paddingBottom: Spacing.huge * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sectionContent: {
    marginTop: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  // Dynamic photos grid
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  photoWrapper: {
    width: '30%',
    aspectRatio: 3 / 4,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIndex: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: 4,
  },
  addPhotoCard: {
    width: '30%',
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  addPhotoText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  bmiCard: {
    marginBottom: Spacing.sm,
  },
  bmiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bmiLabel: {
    flex: 1,
    fontSize: FontSize.md,
  },
  bmiValue: {
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  saveButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
});
