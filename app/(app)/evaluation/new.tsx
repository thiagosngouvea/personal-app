import React, { useState } from 'react';
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
import { Button, Input, Card } from '@/components/ui';
import { CreateEvaluationForm } from '@/types';
import { FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function NewEvaluationScreen() {
  const { clientId, clientHeight } = useLocalSearchParams<{
    clientId: string;
    clientHeight: string;
  }>();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateEvaluationForm>({
    weight: '',
    bodyFatPercentage: '',
    muscleMass: '',
    waist: '',
    chest: '',
    arm: '',
    thigh: '',
    notes: '',
  });

  const [photos, setPhotos] = useState<{
    front?: string;
    side?: string;
    back?: string;
  }>({});

  const isValid = form.weight.length > 0;

  const updateForm = (field: keyof CreateEvaluationForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const pickPhoto = async (position: 'front' | 'side' | 'back') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos((prev) => ({ ...prev, [position]: result.assets[0].uri }));
    }
  };

  const takePhoto = async (position: 'front' | 'side' | 'back') => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera access is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos((prev) => ({ ...prev, [position]: result.assets[0].uri }));
    }
  };

  const showPhotoOptions = (position: 'front' | 'side' | 'back') => {
    Alert.alert('Add Photo', `Choose ${position} photo source`, [
      { text: 'Camera', onPress: () => takePhoto(position) },
      { text: 'Gallery', onPress: () => pickPhoto(position) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!isValid || !user?.uid || !clientId) return;

    setLoading(true);
    try {
      await evaluationService.create(
        user.uid,
        clientId,
        parseFloat(clientHeight || '0'),
        form,
        photos
      );
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to save evaluation. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const PhotoCard = ({
    position,
    label,
  }: {
    position: 'front' | 'side' | 'back';
    label: string;
  }) => {
    const uri = photos[position];

    return (
      <TouchableOpacity
        onPress={() => showPhotoOptions(position)}
        activeOpacity={0.7}
        style={[
          styles.photoCard,
          {
            backgroundColor: colors.inputBackground,
            borderColor: uri ? colors.primary : colors.border,
          },
        ]}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.photoImage} />
        ) : (
          <>
            <Ionicons
              name="camera-outline"
              size={28}
              color={colors.textTertiary}
            />
            <Text style={[styles.photoLabel, { color: colors.textTertiary }]}>
              {label}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

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
            New Evaluation
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Body Composition */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          BODY COMPOSITION
        </Text>

        <Input
          label="Weight (kg) *"
          placeholder="e.g., 75.5"
          value={form.weight}
          onChangeText={(v) => updateForm('weight', v)}
          keyboardType="decimal-pad"
        />

        <View style={styles.row}>
          <Input
            label="Body Fat %"
            placeholder="e.g., 18.5"
            value={form.bodyFatPercentage}
            onChangeText={(v) => updateForm('bodyFatPercentage', v)}
            keyboardType="decimal-pad"
            containerStyle={styles.halfInput}
          />
          <Input
            label="Muscle Mass (kg)"
            placeholder="e.g., 35"
            value={form.muscleMass}
            onChangeText={(v) => updateForm('muscleMass', v)}
            keyboardType="decimal-pad"
            containerStyle={styles.halfInput}
          />
        </View>

        {/* Measurements */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          MEASUREMENTS (cm)
        </Text>

        <View style={styles.row}>
          <Input
            label="Waist"
            placeholder="cm"
            value={form.waist}
            onChangeText={(v) => updateForm('waist', v)}
            keyboardType="decimal-pad"
            containerStyle={styles.halfInput}
          />
          <Input
            label="Chest"
            placeholder="cm"
            value={form.chest}
            onChangeText={(v) => updateForm('chest', v)}
            keyboardType="decimal-pad"
            containerStyle={styles.halfInput}
          />
        </View>

        <View style={styles.row}>
          <Input
            label="Arm"
            placeholder="cm"
            value={form.arm}
            onChangeText={(v) => updateForm('arm', v)}
            keyboardType="decimal-pad"
            containerStyle={styles.halfInput}
          />
          <Input
            label="Thigh"
            placeholder="cm"
            value={form.thigh}
            onChangeText={(v) => updateForm('thigh', v)}
            keyboardType="decimal-pad"
            containerStyle={styles.halfInput}
          />
        </View>

        {/* Notes */}
        <Input
          label="Notes"
          placeholder="Additional observations..."
          value={form.notes}
          onChangeText={(v) => updateForm('notes', v)}
          multiline
          numberOfLines={3}
          style={{ height: 80, textAlignVertical: 'top' }}
        />

        {/* Photos */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          PROGRESS PHOTOS
        </Text>

        <View style={styles.photosRow}>
          <PhotoCard position="front" label="Front" />
          <PhotoCard position="side" label="Side" />
          <PhotoCard position="back" label="Back" />
        </View>

        {/* BMI Preview */}
        {form.weight && clientHeight && parseFloat(clientHeight) > 0 && (
          <Card style={styles.bmiCard}>
            <View style={styles.bmiRow}>
              <Ionicons name="analytics" size={20} color={colors.primary} />
              <Text style={[styles.bmiLabel, { color: colors.textSecondary }]}>
                Calculated BMI
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

        {/* Save */}
        <Button
          title="Save Evaluation"
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
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  photosRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  photoCard: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.md - 2,
  },
  photoLabel: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    marginTop: Spacing.xs,
  },
  bmiCard: {
    marginBottom: Spacing.xxl,
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
    marginBottom: Spacing.xxl,
  },
});
