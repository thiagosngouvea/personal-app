import { Button, Input } from '@/components/ui';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SignupScreen() {
  const colors = useTheme();
  const { signUp, isLoading, error, clearError } = useAuthStore();
  const t = useTranslation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  const isValid =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    password === confirmPassword;

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
      t.auth.profilePhoto,
      t.evaluation.choosePhotoSource,
      [
        { text: t.evaluation.camera, onPress: takePhoto },
        { text: t.evaluation.gallery, onPress: pickPhoto },
        { text: t.common.cancel, style: 'cancel' },
      ]
    );
  };

  const handleSignup = async () => {
    if (!isValid) return;
    clearError();
    try {
      await signUp(email.trim(), password, name.trim(), photoUri);
      router.replace('/(app)/(tabs)');
    } catch {
      // Error is handled in the store
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Photo */}
        <View style={styles.header}>

          <Text style={[styles.title, { color: colors.text }]}>
            {t.auth.createAccount}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t.auth.signUpSubtitle}
          </Text>
          <TouchableOpacity onPress={showPhotoOptions} activeOpacity={0.7} style={styles.avatarContainer}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarPreview} />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: colors.accent + '15', borderColor: colors.border },
                ]}
              >
                <Ionicons name="person-add" size={36} color={colors.accent} />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={showPhotoOptions} activeOpacity={0.7}>
            <Text style={[styles.photoAction, { color: colors.primary }]}>
              {photoUri ? t.client.changePhoto : t.auth.addProfilePhoto}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.optionalLabel, { color: colors.textTertiary }]}>
            {t.client.optional}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.errorLight }]}>
              <Ionicons name="alert-circle" size={18} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            </View>
          )}

          <Input
            label={t.auth.fullName}
            placeholder={t.auth.fullNamePlaceholder}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Input
            label={t.auth.email}
            placeholder={t.auth.emailPlaceholder}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label={t.auth.password}
            placeholder={t.auth.minCharacters}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Input
            label={t.auth.confirmPassword}
            placeholder={t.auth.confirmPasswordPlaceholder}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            error={
              confirmPassword.length > 0 && password !== confirmPassword
                ? t.auth.passwordsDoNotMatch
                : undefined
            }
          />

          <Button
            title={t.auth.createAccount}
            onPress={handleSignup}
            loading={isLoading}
            disabled={!isValid}
            size="lg"
            style={{ marginTop: Spacing.sm }}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            {t.auth.hasAccount}
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.linkText, { color: colors.primary }]}>
              {t.auth.signIn}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  avatarPreview: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: Spacing.sm,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  photoAction: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  optionalLabel: {
    fontSize: FontSize.xs,
    marginTop: 2,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
  },
  form: {
    marginBottom: Spacing.xxl,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  errorText: {
    fontSize: FontSize.sm,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: FontSize.md,
  },
  linkText: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
