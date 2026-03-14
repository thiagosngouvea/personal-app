import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { authService } from '@/services/authService';
import { useTranslation } from '@/i18n';
import { Language } from '@/i18n';
import { Button, Card } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function ProfileScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logOut } = useAuthStore();
  const { reset, language, setLanguage } = useAppStore();
  const t = useTranslation();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [editPhotoUri, setEditPhotoUri] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    Alert.alert(t.profile.signOut, t.profile.signOutConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.profile.signOut,
        style: 'destructive',
        onPress: async () => {
          reset();
          await logOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleLanguageToggle = () => {
    const newLang: Language = language === 'pt' ? 'en' : 'pt';
    setLanguage(newLang);
  };

  const handleEditProfile = () => {
    setEditName(user?.displayName || '');
    setEditPhotoUri(undefined);
    setIsEditing(true);
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setEditPhotoUri(result.assets[0].uri);
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
      setEditPhotoUri(result.assets[0].uri);
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

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await authService.updateProfileFull(editName.trim(), editPhotoUri);
      Alert.alert('✅', t.profile.profileUpdated);
      setIsEditing(false);
      setEditPhotoUri(undefined);
    } catch (err) {
      Alert.alert(t.common.error, t.profile.errorUpdateProfile);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(user?.displayName || '');
    setEditPhotoUri(undefined);
  };

  // Determine which photo to show
  const displayPhotoUri = editPhotoUri || user?.photoURL;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>{t.profile.title}</Text>

        {/* User Info */}
        <Card style={styles.userCard}>
          <View style={styles.avatarContainer}>
            {/* Avatar */}
            {isEditing ? (
              <TouchableOpacity onPress={showPhotoOptions} activeOpacity={0.7}>
                {displayPhotoUri ? (
                  <Image source={{ uri: displayPhotoUri }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary + '20', borderColor: colors.border }]}>
                    <Ionicons name="camera" size={24} color={colors.primary} />
                  </View>
                )}
                <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
                  <Ionicons name="pencil" size={12} color="#FFF" />
                </View>
              </TouchableOpacity>
            ) : (
              <>
                {user?.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="person" size={32} color={colors.primary} />
                  </View>
                )}
              </>
            )}

            {/* Info / Edit Form */}
            <View style={styles.userInfo}>
              {isEditing ? (
                <View style={styles.editForm}>
                  <Text style={[styles.editLabel, { color: colors.textSecondary }]}>
                    {t.profile.displayName}
                  </Text>
                  <TextInput
                    style={[
                      styles.editInput,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.primary,
                        color: colors.text,
                      },
                    ]}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder={t.profile.displayNamePlaceholder}
                    placeholderTextColor={colors.textTertiary}
                    autoFocus
                    autoCapitalize="words"
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      onPress={handleCancelEdit}
                      style={[styles.editBtn, { backgroundColor: colors.surfaceElevated }]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.editBtnText, { color: colors.textSecondary }]}>
                        {t.common.cancel}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveProfile}
                      style={[styles.editBtn, { backgroundColor: colors.primary }]}
                      activeOpacity={0.7}
                      disabled={saving || !editName.trim()}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={[styles.editBtnText, { color: '#FFF' }]}>
                          {t.profile.saveProfile}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <Text style={[styles.userName, { color: colors.text }]}>
                    {user?.displayName || t.common.trainer}
                  </Text>
                  <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                    {user?.email}
                  </Text>
                </>
              )}
            </View>
          </View>
        </Card>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t.profile.account}
          </Text>

          <Card style={styles.menuCard}>
            <TouchableOpacity onPress={handleEditProfile} activeOpacity={0.7}>
              <MenuItem
                icon="person-outline"
                label={t.profile.editProfile}
                colors={colors}
              />
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <MenuItem
              icon="notifications-outline"
              label={t.profile.notifications}
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <MenuItem
              icon="shield-outline"
              label={t.profile.privacy}
              colors={colors}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t.profile.app}
          </Text>

          <Card style={styles.menuCard}>
            <TouchableOpacity onPress={handleLanguageToggle} activeOpacity={0.7}>
              <View style={menuStyles.item}>
                <Ionicons name="language-outline" size={22} color={colors.textSecondary} />
                <Text style={[menuStyles.label, { color: colors.text }]}>
                  {t.profile.language}
                </Text>
                <Text style={[menuStyles.langValue, { color: colors.primary }]}>
                  {language === 'pt' ? 'PT-BR' : 'EN'}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </View>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <MenuItem
              icon="help-circle-outline"
              label={t.profile.helpSupport}
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <MenuItem
              icon="information-circle-outline"
              label={t.profile.about}
              colors={colors}
            />
          </Card>
        </View>

        <Button
          title={t.profile.signOut}
          onPress={handleLogout}
          variant="danger"
          size="lg"
          style={styles.logoutButton}
        />

        <Text style={[styles.version, { color: colors.textTertiary }]}>
          {t.profile.version}
        </Text>
      </ScrollView>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  colors: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={menuStyles.item}>
      <Ionicons name={icon} size={22} color={colors.textSecondary} />
      <Text style={[menuStyles.label, { color: colors.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </View>
  );
}

const menuStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  label: {
    flex: 1,
    fontSize: FontSize.md,
  },
  langValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: Spacing.xl,
    paddingBottom: Spacing.huge,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    marginBottom: Spacing.xxl,
  },
  userCard: {
    marginBottom: Spacing.xxl,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: Spacing.lg,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: Spacing.md,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: FontSize.sm,
  },
  // Edit form inline
  editForm: {
    flex: 1,
  },
  editLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  editInput: {
    fontSize: FontSize.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
  },
  editActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  editBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  menuCard: {
    paddingVertical: Spacing.sm,
  },
  divider: {
    height: 1,
    marginLeft: Spacing.xxxl + Spacing.sm,
  },
  logoutButton: {
    marginBottom: Spacing.lg,
  },
  version: {
    textAlign: 'center',
    fontSize: FontSize.xs,
  },
});
