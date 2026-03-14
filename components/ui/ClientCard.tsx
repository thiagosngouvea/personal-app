import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Card } from './Card';
import { FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { Client } from '@/types';

interface ClientCardProps {
  client: Client;
  onPress: () => void;
}

export function ClientCard({ client, onPress }: ClientCardProps) {
  const colors = useTheme();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getGenderIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (client.gender) {
      case 'male': return 'male';
      case 'female': return 'female';
      default: return 'person';
    }
  };

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.primary + '20' },
          ]}
        >
          <Text style={[styles.initials, { color: colors.primary }]}>
            {getInitials(client.name)}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {client.name}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons name={getGenderIcon()} size={14} color={colors.textTertiary} />
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {client.age} years • {client.height}m
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  initials: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    fontSize: FontSize.sm,
  },
});
