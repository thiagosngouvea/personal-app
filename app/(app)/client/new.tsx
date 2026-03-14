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
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { clientService } from '@/services/clientService';
import { Button, Input } from '@/components/ui';
import { CreateClientForm } from '@/types';
import { FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function NewClientScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const addClient = useAppStore((s) => s.addClient);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateClientForm>({
    name: '',
    age: '',
    height: '',
    gender: 'male',
  });

  const isValid =
    form.name.trim().length > 0 &&
    form.age.length > 0 &&
    form.height.length > 0;

  const updateForm = (field: keyof CreateClientForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    if (!isValid || !user?.uid) return;

    setLoading(true);
    try {
      const id = await clientService.create(user.uid, form);
      addClient({
        id,
        trainerId: user.uid,
        name: form.name.trim(),
        age: parseInt(form.age, 10),
        height: parseFloat(form.height),
        gender: form.gender,
        createdAt: new Date(),
      });
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to create client. Please try again.');
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
            New Client
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Form */}
        <Input
          label="Full Name"
          placeholder="Client's full name"
          value={form.name}
          onChangeText={(v) => updateForm('name', v)}
          autoCapitalize="words"
        />

        <Input
          label="Age"
          placeholder="e.g., 28"
          value={form.age}
          onChangeText={(v) => updateForm('age', v)}
          keyboardType="numeric"
        />

        <Input
          label="Height (meters)"
          placeholder="e.g., 1.75"
          value={form.height}
          onChangeText={(v) => updateForm('height', v)}
          keyboardType="decimal-pad"
        />

        <View style={styles.genderSection}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            GENDER
          </Text>
          <View style={styles.genderRow}>
            <GenderButton value="male" label="Male" icon="male" />
            <GenderButton value="female" label="Female" icon="female" />
            <GenderButton value="other" label="Other" icon="person" />
          </View>
        </View>

        <Button
          title="Create Client"
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
    marginBottom: Spacing.xxxl,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
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
