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
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { clientService } from '@/services/clientService';
import { useTranslation } from '@/i18n';
import { Button, Input, Loading } from '@/components/ui';
import { CreateClientForm } from '@/types';
import { FontSize, Spacing, BorderRadius } from '@/constants/theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Calculate age in full years from a Date object */
function calcAgeFromDate(date: Date): number {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
  return age;
}

/** Format date as localized string */
function formatDisplayDate(date: Date | null, locale: string): string {
  if (!date) return '';
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Convert Date to ISO date string 'YYYY-MM-DD' */
function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewClientScreen() {
  const {
    clientId,
    clientName,
    clientAge,
    clientBirthDate,
    clientHeight,
    clientGender,
    clientWhatsapp,
    clientEmail,
    clientPhotoUrl,
  } = useLocalSearchParams<{
    clientId?: string;
    clientName?: string;
    clientAge?: string;
    clientBirthDate?: string;
    clientHeight?: string;
    clientGender?: string;
    clientWhatsapp?: string;
    clientEmail?: string;
    clientPhotoUrl?: string;
  }>();

  const isEditing = !!clientId;

  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const addClient = useAppStore((s) => s.addClient);
  const updateClientStore = useAppStore((s) => s.updateClient);
  const t = useTranslation();

  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | undefined>();

  // ─── Date picker state ───────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  // Temporary date used while picker is open (iOS inline picker)
  const [tempDate, setTempDate] = useState<Date>(new Date(2000, 0, 1));

  const [form, setForm] = useState<CreateClientForm>({
    name: '',
    birthDate: '',
    age: '',
    height: '',
    gender: 'male',
    whatsapp: '',
    email: '',
  });

  // ─── Pre-fill on edit ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isEditing) {
      // Restore birthDate from param (preferred) or fallback to age
      if (clientBirthDate) {
        const d = new Date(clientBirthDate + 'T00:00:00');
        setSelectedDate(d);
        setTempDate(d);
        setForm({
          name: clientName || '',
          birthDate: clientBirthDate,
          age: String(clientAge || ''),
          height: clientHeight || '',
          gender: (clientGender as 'male' | 'female' | 'other') || 'male',
          whatsapp: clientWhatsapp || '',
          email: clientEmail || '',
        });
      } else {
        setForm({
          name: clientName || '',
          birthDate: '',
          age: clientAge || '',
          height: clientHeight || '',
          gender: (clientGender as 'male' | 'female' | 'other') || 'male',
          whatsapp: clientWhatsapp || '',
          email: clientEmail || '',
        });
      }
      if (clientPhotoUrl) setExistingPhotoUrl(clientPhotoUrl);
    }
  }, [isEditing]);

  // ─── Validation ──────────────────────────────────────────────────────────────
  const hasDate = !!selectedDate || !!form.age;
  const isValid =
    form.name.trim().length > 0 &&
    hasDate &&
    form.height.length > 0;

  // ─── Date picker logic ───────────────────────────────────────────────────────
  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && date) {
        applyDate(date);
      }
    } else {
      // iOS: update tempDate while scrolling, apply on confirm
      if (date) setTempDate(date);
    }
  };

  const applyDate = (date: Date) => {
    setSelectedDate(date);
    setTempDate(date);
    setForm((prev) => ({
      ...prev,
      birthDate: toISODate(date),
      age: String(calcAgeFromDate(date)),
    }));
  };

  const confirmIOSDate = () => {
    applyDate(tempDate);
    setShowPicker(false);
  };

  const cancelPicker = () => {
    setShowPicker(false);
    // Reset tempDate to currently applied date
    if (selectedDate) setTempDate(selectedDate);
  };

  const openPicker = () => {
    if (selectedDate) setTempDate(selectedDate);
    else setTempDate(new Date(2000, 0, 1));
    setShowPicker(true);
  };

  // ─── Photo helpers ────────────────────────────────────────────────────────────
  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      setExistingPhotoUrl(undefined);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.evaluation.permissionNeeded, t.evaluation.cameraPermission);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      setExistingPhotoUrl(undefined);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(t.client.clientPhoto, t.evaluation.choosePhotoSource, [
      { text: t.evaluation.camera, onPress: takePhoto },
      { text: t.evaluation.gallery, onPress: pickPhoto },
      { text: t.common.cancel, style: 'cancel' },
    ]);
  };

  const updateForm = (field: keyof CreateClientForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ─── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!isValid || !user?.uid) return;
    setLoading(true);
    try {
      const calculatedAge = selectedDate
        ? calcAgeFromDate(selectedDate)
        : parseInt(form.age, 10);

      if (isEditing && clientId) {
        const newPhotoUrl = await clientService.update(clientId, form, photoUri);
        updateClientStore({
          id: clientId,
          trainerId: user.uid,
          name: form.name.trim(),
          age: calculatedAge,
          birthDate: selectedDate || undefined,
          height: parseFloat(form.height),
          gender: form.gender,
          whatsapp: form.whatsapp.trim() || undefined,
          email: form.email.trim() || undefined,
          photoUrl: newPhotoUrl || existingPhotoUrl,
          createdAt: new Date(),
        });
      } else {
        const { id, photoUrl } = await clientService.create(user.uid, form, photoUri);
        addClient({
          id,
          trainerId: user.uid,
          name: form.name.trim(),
          age: calculatedAge,
          birthDate: selectedDate || undefined,
          height: parseFloat(form.height),
          gender: form.gender,
          whatsapp: form.whatsapp.trim() || undefined,
          email: form.email.trim() || undefined,
          photoUrl,
          createdAt: new Date(),
        });
      }
      router.back();
    } catch (err) {
      Alert.alert(t.common.error, isEditing ? t.client.errorUpdateClient : t.client.errorCreateClient);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Sub-components ───────────────────────────────────────────────────────────
  const GenderButton = ({
    value, label, icon,
  }: {
    value: 'male' | 'female' | 'other';
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }) => {
    const isSelected = form.gender === value;
    return (
      <TouchableOpacity
        onPress={() => updateForm('gender', value)}
        activeOpacity={0.7}
        style={[
          styles.genderButton,
          {
            backgroundColor: isSelected ? colors.primary + '15' : colors.inputBackground,
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
      >
        <Ionicons name={icon} size={20} color={isSelected ? colors.primary : colors.textSecondary} />
        <Text style={[styles.genderLabel, { color: isSelected ? colors.primary : colors.textSecondary }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const displayPhotoUri = photoUri || existingPhotoUrl;

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
            {isEditing ? t.client.editClient : t.client.newClient}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Client Photo */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={showPhotoOptions} activeOpacity={0.7}>
            {displayPhotoUri ? (
              <Image source={{ uri: displayPhotoUri }} style={styles.photoPreview} />
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                <Ionicons name="person-add" size={36} color={colors.textTertiary} />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={showPhotoOptions} activeOpacity={0.7}>
            <Text style={[styles.photoActionText, { color: colors.primary }]}>
              {displayPhotoUri ? t.client.changePhoto : t.client.addPhoto}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.optionalText, { color: colors.textTertiary }]}>
            {t.client.optional}
          </Text>
        </View>

        {/* Name */}
        <Input
          label={t.client.clientFullName}
          placeholder={t.client.clientNamePlaceholder}
          value={form.name}
          onChangeText={(v) => updateForm('name', v)}
          autoCapitalize="words"
        />

        {/* ─── Date of Birth picker ───────────────────────────────────────────── */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            {t.client.birthDate} *
          </Text>
          <TouchableOpacity
            onPress={openPicker}
            activeOpacity={0.7}
            style={[
              styles.dateButton,
              {
                backgroundColor: colors.inputBackground,
                borderColor: selectedDate ? colors.primary : colors.border,
              },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={selectedDate ? colors.primary : colors.textTertiary}
            />
            {selectedDate ? (
              <View style={styles.dateFilled}>
                <Text style={[styles.dateText, { color: colors.text }]}>
                  {formatDisplayDate(selectedDate, t.dateLocale)}
                </Text>
                <Text style={[styles.ageChip, { backgroundColor: colors.primary + '18', color: colors.primary }]}>
                  {calcAgeFromDate(selectedDate)} {t.common.years}
                </Text>
              </View>
            ) : (
              <Text style={[styles.datePlaceholder, { color: colors.textTertiary }]}>
                {t.client.birthDatePlaceholder}
              </Text>
            )}
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Android: inline picker (no modal) */}
        {showPicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
            onChange={onDateChange}
          />
        )}

        {/* iOS: modal with inline spinner */}
        {Platform.OS === 'ios' && (
          <Modal
            visible={showPicker}
            transparent
            animationType="slide"
            onRequestClose={cancelPicker}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
                {/* Modal header */}
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                  <TouchableOpacity onPress={cancelPicker} activeOpacity={0.7}>
                    <Text style={[styles.modalAction, { color: colors.textSecondary }]}>
                      {t.common.cancel}
                    </Text>
                  </TouchableOpacity>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {t.client.birthDate}
                  </Text>
                  <TouchableOpacity onPress={confirmIOSDate} activeOpacity={0.7}>
                    <Text style={[styles.modalAction, { color: colors.primary, fontWeight: '700' }]}>
                      OK
                    </Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  onChange={onDateChange}
                  locale={t.dateLocale}
                  style={styles.iosPicker}
                />
              </View>
            </View>
          </Modal>
        )}

        {/* Height */}
        <Input
          label={t.client.heightMeters}
          placeholder={t.client.heightPlaceholder}
          value={form.height}
          onChangeText={(v) => updateForm('height', v)}
          keyboardType="decimal-pad"
        />

        {/* Gender */}
        <View style={styles.genderSection}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {t.client.gender}
          </Text>
          <View style={styles.genderRow}>
            <GenderButton value="male"   label={t.client.male}   icon="male" />
            <GenderButton value="female" label={t.client.female} icon="female" />
            <GenderButton value="other"  label={t.client.other}  icon="person" />
          </View>
        </View>

        {/* Contact Info */}
        <Text style={[styles.label, { color: colors.textSecondary, marginBottom: Spacing.sm }]}>
          {t.client.contactInfo} {t.client.optional}
        </Text>

        <Input
          label={t.client.whatsapp}
          placeholder={t.client.whatsappPlaceholder}
          value={form.whatsapp}
          onChangeText={(v) => updateForm('whatsapp', v)}
          keyboardType="phone-pad"
        />

        <Input
          label={t.client.email}
          placeholder={t.client.emailPlaceholder}
          value={form.email}
          onChangeText={(v) => updateForm('email', v)}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Button
          title={isEditing ? t.client.updateClient : t.client.createClient}
          onPress={handleSave}
          loading={loading}
          disabled={!isValid}
          size="lg"
          style={styles.createButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing.huge },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: Spacing.xxl,
  },
  title: { fontSize: FontSize.xl, fontWeight: '700' },

  // Photo
  photoSection: { alignItems: 'center', marginBottom: Spacing.xxl },
  photoPreview: { width: 100, height: 100, borderRadius: 50 },
  photoPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  photoActionText: { fontSize: FontSize.sm, fontWeight: '600', marginTop: Spacing.sm },
  optionalText: { fontSize: FontSize.xs, marginTop: 2 },

  // Field group (date)
  fieldGroup: { marginBottom: Spacing.md },
  fieldLabel: {
    fontSize: FontSize.sm, fontWeight: '600',
    marginBottom: Spacing.xs,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  dateButton: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderRadius: BorderRadius.md, borderWidth: 1.5,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    minHeight: 52,
  },
  dateFilled: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dateText: { fontSize: FontSize.md, flex: 1 },
  datePlaceholder: { fontSize: FontSize.md, flex: 1 },
  ageChip: {
    fontSize: FontSize.xs, fontWeight: '700',
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },

  // iOS modal picker
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: 'hidden',
    paddingBottom: Spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: FontSize.md, fontWeight: '600' },
  modalAction: { fontSize: FontSize.md },
  iosPicker: { height: 240 },

  // Layout
  row: { flexDirection: 'row', gap: Spacing.md },
  halfInput: { flex: 1 },
  label: {
    fontSize: FontSize.sm, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  genderSection: { marginBottom: Spacing.xxl },
  genderRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  genderButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md, borderWidth: 1.5, gap: Spacing.xs,
  },
  genderLabel: { fontSize: FontSize.sm, fontWeight: '600' },
  createButton: { marginTop: Spacing.md },
});
