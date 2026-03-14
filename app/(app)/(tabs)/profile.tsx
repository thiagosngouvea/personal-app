import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { Button, Card } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function ProfileScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logOut } = useAuthStore();
  const reset = useAppStore((s) => s.reset);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          reset();
          await logOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>

        {/* User Info */}
        <Card style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.primary + '20' },
              ]}
            >
              <Ionicons name="person" size={32} color={colors.primary} />
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user?.displayName || 'Trainer'}
              </Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                {user?.email}
              </Text>
            </View>
          </View>
        </Card>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            ACCOUNT
          </Text>

          <Card style={styles.menuCard}>
            <MenuItem
              icon="person-outline"
              label="Edit Profile"
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <MenuItem
              icon="notifications-outline"
              label="Notifications"
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <MenuItem
              icon="shield-outline"
              label="Privacy"
              colors={colors}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            APP
          </Text>

          <Card style={styles.menuCard}>
            <MenuItem
              icon="help-circle-outline"
              label="Help & Support"
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <MenuItem
              icon="information-circle-outline"
              label="About"
              colors={colors}
            />
          </Card>
        </View>

        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="danger"
          size="lg"
          style={styles.logoutButton}
        />

        <Text style={[styles.version, { color: colors.textTertiary }]}>
          PersonalApp v1.0.0
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
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
