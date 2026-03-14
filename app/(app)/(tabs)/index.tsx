import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { useTranslation } from '@/i18n';
import { StatCard, ClientCard, EmptyState, Card } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function DashboardScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const t = useTranslation();
  const {
    clients,
    clientsLoading,
    clientCount,
    recentEvaluations,
    loadDashboard,
  } = useAppStore();

  const [refreshing, setRefreshing] = React.useState(false);

  const loadData = useCallback(async () => {
    if (user?.uid) {
      await loadDashboard(user.uid);
    }
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(t.dateLocale, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {t.dashboard.welcomeBack}
            </Text>
            <Text style={[styles.name, { color: colors.text }]}>
              {user?.displayName || t.common.trainer}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(app)/client/new')}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard
            icon="people"
            label={t.dashboard.clients}
            value={clientCount}
            color={colors.primary}
          />
          <View style={{ width: Spacing.md }} />
          <StatCard
            icon="clipboard"
            label={t.dashboard.evaluations}
            value={recentEvaluations.length}
            color={colors.accent}
          />
        </View>

        {/* Recent Evaluations */}
        {recentEvaluations.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t.dashboard.recentEvaluations}
            </Text>
            {recentEvaluations.slice(0, 5).map((evaluation) => {
              const evalClient = clients.find((c) => c.id === evaluation.clientId);
              return (
                <TouchableOpacity
                  key={evaluation.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (evalClient) {
                      router.push({
                        pathname: '/(app)/client/[id]',
                        params: { id: evalClient.id },
                      });
                    }
                  }}
                >
                  <Card style={styles.evalCard}>
                    <View style={styles.evalRow}>
                      <View
                        style={[
                          styles.evalDot,
                          { backgroundColor: colors.accent },
                        ]}
                      />
                      <View style={styles.evalInfo}>
                        {evalClient && (
                          <Text
                            style={[styles.evalClientName, { color: colors.text }]}
                            numberOfLines={1}
                          >
                            {evalClient.name}
                            <Text style={[styles.evalClientAge, { color: colors.textTertiary }]}>
                              {' '}{evalClient.age} {t.common.years}
                            </Text>
                          </Text>
                        )}
                        <Text style={[styles.evalWeight, { color: colors.textSecondary }]}>
                          {evaluation.weight} kg
                          {evaluation.protocols?.bmi ? ` • IMC ${evaluation.protocols.bmi}` : ''}
                          {' • '}{formatDate(evaluation.createdAt)}
                        </Text>
                      </View>
                      {evaluation.protocols?.pollock3 && (
                        <View
                          style={[
                            styles.evalBadge,
                            { backgroundColor: colors.primary + '15' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.evalBadgeText,
                              { color: colors.primary },
                            ]}
                          >
                            {evaluation.protocols.pollock3}% BF
                          </Text>
                        </View>
                      )}
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Clients List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t.dashboard.yourClients}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(app)/client/new')}
              activeOpacity={0.7}
            >
              <Text style={[styles.seeAll, { color: colors.primary }]}>
                {t.dashboard.addNew}
              </Text>
            </TouchableOpacity>
          </View>

          {clients.length === 0 && !clientsLoading ? (
            <EmptyState
              icon="people-outline"
              title={t.dashboard.noClientsYet}
              description={t.dashboard.noClientsDescription}
              actionLabel={t.dashboard.addClient}
              onAction={() => router.push('/(app)/client/new')}
            />
          ) : (
            clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onPress={() => router.push(`/(app)/client/${client.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  greeting: {
    fontSize: FontSize.md,
    marginBottom: 2,
  },
  name: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  seeAll: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  evalCard: {
    marginBottom: Spacing.sm,
  },
  evalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  evalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.md,
  },
  evalInfo: {
    flex: 1,
  },
  evalWeight: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  evalClientName: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  evalClientAge: {
    fontSize: FontSize.sm,
    fontWeight: '400',
  },
  evalBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  evalBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
