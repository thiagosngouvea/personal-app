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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { clientService } from '@/services/clientService';
import { useTranslation } from '@/i18n';
import { Button, Input } from '@/components/ui';
import { CreateClientForm } from '@/types';
import { FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function NewClientScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const addClient = useAppStore((s) => s.addClient);
  const t = useTranslation();

  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [form, setForm] = useState<CreateClientForm>({
    name: '',
    age: '',
    height: '',
    gender: 'male',
    whatsapp: '',
    email: '',
  });

  const isValid =
    form.name.trim().length > 0 &&
    form.age.length > 0 &&
    form.height.length > 0;

  const updateForm = (field: keyof CreateClientForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.evaluation.permissionNeeded, t.evaluation.cameraPermission);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      t.client.clientPhoto,
      t.evaluation.choosePhotoSource,
      [
        { text: t.evaluation.camera, onPress: takePhoto },
        { text: t.evaluation.gallery, onPress: pickPhoto },
        { text: t.common.cancel, style: 'cancel' },
      ]
    );
  };

  const handleCreate = async () => {
    if (!isValid || !user?.uid) return;

    setLoading(true);
    try {
      const { id, photoUrl } = await clientService.create(user.uid, form, photoUri);
      addClient({
        id,
        trainerId: user.uid,
        name: form.name.trim(),
        age: parseInt(form.age, 10),
        height: parseFloat(form.height),
        gender: form.gender,
        whatsapp: form.whatsapp.trim() || undefined,
        email: form.email.trim() || undefined,
        photoUrl,
        createdAt: new Date(),
      });
      router.back();
    } catch (err) {
      Alert.alert(t.common.error, t.client.errorCreateClient);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const GenderButton = ({
    value,
    label,
    icon,
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
        <Ionicons
          name={icon}
          size={20}
          color={isSelected ? colors.primary : colors.textSecondary}
        />
        <Text
          style={[
            styles.genderLabel,
            { color: isSelected ? colors.primary : colors.textSecondary },
          ]}
        >
          {label}
        </Text>
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
            {t.client.newClient}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Client Photo */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={showPhotoOptions} activeOpacity={0.7}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            ) : (
              <View
                style={[
                  styles.photoPlaceholder,
                  { backgroundColor: colors.inputBackground, borderColor: colors.border },
                ]}
              >
                <Ionicons name="person-add" size={36} color={colors.textTertiary} />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={showPhotoOptions} activeOpacity={0.7}>
            <Text style={[styles.photoActionText, { color: colors.primary }]}>
              {photoUri ? t.client.changePhoto : t.client.addPhoto}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.optionalText, { color: colors.textTertiary }]}>
            {t.client.optional}
          </Text>
        </View>

        {/* Form */}
        <Input
          label={t.client.clientFullName}
          placeholder={t.client.clientNamePlaceholder}
          value={form.name}
          onChangeText={(v) => updateForm('name', v)}
          autoCapitalize="words"
        />

        <View style={styles.row}>
          <Input
            label={t.client.age}
            placeholder="ex: 28"
            value={form.age}
            onChangeText={(v) => updateForm('age', v)}
            keyboardType="numeric"
            containerStyle={styles.halfInput}
          />
          <Input
            label={t.client.heightMeters}
            placeholder={t.client.heightPlaceholder}
            value={form.height}
            onChangeText={(v) => updateForm('height', v)}
            keyboardType="decimal-pad"
            containerStyle={styles.halfInput}
          />
        </View>

        <View style={styles.genderSection}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {t.client.gender}
          </Text>
          <View style={styles.genderRow}>
            <GenderButton value="male" label={t.client.male} icon="male" />
            <GenderButton value="female" label={t.client.female} icon="female" />
            <GenderButton value="other" label={t.client.other} icon="person" />
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
          title={t.client.createClient}
          onPress={handleCreate}
          loading={loading}
          disabled={!isValid}
          size="lg"
          style={styles.createButton}
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
    paddingBottom: Spacing.huge,
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
  // Photo
  photoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActionText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  optionalText: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  // Row layout
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  genderSection: {
    marginBottom: Spacing.xxl,
  },
  genderRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    gap: Spacing.xs,
  },
  genderLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  createButton: {
    marginTop: Spacing.md,
  },
});
