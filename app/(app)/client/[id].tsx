import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { useTheme, useIsDark } from '@/hooks/useTheme';
import { clientService } from '@/services/clientService';
import { evaluationService } from '@/services/evaluationService';
import { Client, Evaluation } from '@/types';
import { Loading, Card, EmptyState, Button } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/constants/theme';

const screenWidth = Dimensions.get('window').width;

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useTheme();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();

  const [client, setClient] = useState<Client | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [c, evals] = await Promise.all([
        clientService.getById(id),
        evaluationService.getAllByClient(id),
      ]);
      setClient(c);
      setEvaluations(evals);
    } catch (err) {
      console.error('Failed to load client:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

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
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatShortDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) return <Loading message="Loading client..." />;
  if (!client) return <Loading message="Client not found" />;

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 1,
    color: (opacity = 1) => isDark ? `rgba(56, 189, 248, ${opacity})` : `rgba(14, 165, 233, ${opacity})`,
    labelColor: () => colors.textSecondary,
    style: {
      borderRadius: BorderRadius.lg,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.border,
      strokeWidth: 0.5,
    },
  };

  const weightData = evaluations.filter((e) => e.weight);
  const bodyFatData = evaluations.filter((e) => e.bodyFatPercentage);

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
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {client.name}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Client Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <InfoItem
              icon="calendar"
              label="Age"
              value={`${client.age} years`}
              colors={colors}
            />
            <InfoItem
              icon="resize"
              label="Height"
              value={`${client.height}m`}
              colors={colors}
            />
            <InfoItem
              icon="person"
              label="Gender"
              value={client.gender.charAt(0).toUpperCase() + client.gender.slice(1)}
              colors={colors}
            />
          </View>
        </Card>

        {/* Latest Stats */}
        {evaluations.length > 0 && (
          <Card style={styles.latestCard}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Latest Assessment
            </Text>
            <View style={styles.statsGrid}>
              {evaluations[evaluations.length - 1].weight && (
                <StatBadge
                  label="Weight"
                  value={`${evaluations[evaluations.length - 1].weight} kg`}
                  colors={colors}
                />
              )}
              {evaluations[evaluations.length - 1].bmi && (
                <StatBadge
                  label="BMI"
                  value={`${evaluations[evaluations.length - 1].bmi}`}
                  colors={colors}
                />
              )}
              {evaluations[evaluations.length - 1].bodyFatPercentage && (
                <StatBadge
                  label="Body Fat"
                  value={`${evaluations[evaluations.length - 1].bodyFatPercentage}%`}
                  colors={colors}
                />
              )}
              {evaluations[evaluations.length - 1].muscleMass && (
                <StatBadge
                  label="Muscle"
                  value={`${evaluations[evaluations.length - 1].muscleMass} kg`}
                  colors={colors}
                />
              )}
            </View>
          </Card>
        )}

        {/* Weight Chart */}
        {weightData.length >= 2 && (
          <Card style={styles.chartCard}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Weight Progress
            </Text>
            <LineChart
              data={{
                labels: weightData.slice(-7).map((e) => formatShortDate(e.createdAt)),
                datasets: [
                  {
                    data: weightData.slice(-7).map((e) => e.weight),
                    color: (opacity = 1) => `rgba(14, 165, 233, ${opacity})`,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={screenWidth - Spacing.xl * 2 - Spacing.lg * 2}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines={false}
              withOuterLines={false}
              fromZero={false}
            />
          </Card>
        )}

        {/* Body Fat Chart */}
        {bodyFatData.length >= 2 && (
          <Card style={styles.chartCard}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Body Fat % Progress
            </Text>
            <LineChart
              data={{
                labels: bodyFatData.slice(-7).map((e) => formatShortDate(e.createdAt)),
                datasets: [
                  {
                    data: bodyFatData.slice(-7).map((e) => e.bodyFatPercentage!),
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={screenWidth - Spacing.xl * 2 - Spacing.lg * 2}
              height={200}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                propsForDots: {
                  r: '5',
                  strokeWidth: '2',
                  stroke: colors.accent,
                },
              }}
              bezier
              style={styles.chart}
              withInnerLines={false}
              withOuterLines={false}
              fromZero={false}
            />
          </Card>
        )}

        {/* New Evaluation Button */}
        <Button
          title="New Evaluation"
          onPress={() =>
            router.push({
              pathname: '/(app)/evaluation/new',
              params: { clientId: id, clientHeight: client.height.toString() },
            })
          }
          size="lg"
          style={styles.newEvalButton}
          icon={
            <Ionicons
              name="add-circle"
              size={20}
              color="#FFFFFF"
              style={{ marginRight: Spacing.sm }}
            />
          }
        />

        {/* Evaluations List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            All Evaluations
          </Text>

          {evaluations.length === 0 ? (
            <EmptyState
              icon="clipboard-outline"
              title="No evaluations yet"
              description="Create the first evaluation for this client"
            />
          ) : (
            [...evaluations].reverse().map((evaluation) => (
              <Card key={evaluation.id} style={styles.evalCard}>
                <View style={styles.evalHeader}>
                  <Text style={[styles.evalDate, { color: colors.text }]}>
                    {formatDate(evaluation.createdAt)}
                  </Text>
                  {evaluation.photos && (
                    <Ionicons
                      name="camera"
                      size={16}
                      color={colors.textTertiary}
                    />
                  )}
                </View>

                <View style={styles.evalMetrics}>
                  <MetricItem
                    label="Weight"
                    value={`${evaluation.weight} kg`}
                    colors={colors}
                  />
                  {evaluation.bmi && (
                    <MetricItem
                      label="BMI"
                      value={`${evaluation.bmi}`}
                      colors={colors}
                    />
                  )}
                  {evaluation.bodyFatPercentage && (
                    <MetricItem
                      label="BF%"
                      value={`${evaluation.bodyFatPercentage}%`}
                      colors={colors}
                    />
                  )}
                  {evaluation.muscleMass && (
                    <MetricItem
                      label="Muscle"
                      value={`${evaluation.muscleMass} kg`}
                      colors={colors}
                    />
                  )}
                </View>

                {/* Measurements */}
                {(evaluation.waist || evaluation.chest || evaluation.arm || evaluation.thigh) && (
                  <View style={[styles.measurementsRow, { borderTopColor: colors.border }]}>
                    {evaluation.waist && (
                      <MeasurementChip label="Waist" value={`${evaluation.waist}cm`} colors={colors} />
                    )}
                    {evaluation.chest && (
                      <MeasurementChip label="Chest" value={`${evaluation.chest}cm`} colors={colors} />
                    )}
                    {evaluation.arm && (
                      <MeasurementChip label="Arm" value={`${evaluation.arm}cm`} colors={colors} />
                    )}
                    {evaluation.thigh && (
                      <MeasurementChip label="Thigh" value={`${evaluation.thigh}cm`} colors={colors} />
                    )}
                  </View>
                )}

                {evaluation.notes && (
                  <Text
                    style={[styles.evalNotes, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {evaluation.notes}
                  </Text>
                )}
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function InfoItem({
  icon,
  label,
  value,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={infoStyles.item}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={[infoStyles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[infoStyles.value, { color: colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

function StatBadge({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[badgeStyles.container, { backgroundColor: colors.surfaceElevated }]}>
      <Text style={[badgeStyles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[badgeStyles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

function MetricItem({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={metricStyles.item}>
      <Text style={[metricStyles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[metricStyles.label, { color: colors.textTertiary }]}>
        {label}
      </Text>
    </View>
  );
}

function MeasurementChip({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[chipStyles.chip, { backgroundColor: colors.surfaceElevated }]}>
      <Text style={[chipStyles.text, { color: colors.textSecondary }]}>
        {label}: {value}
      </Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});

const badgeStyles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    minWidth: 70,
  },
  value: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  label: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
});

const metricStyles = StyleSheet.create({
  item: {
    alignItems: 'center',
  },
  value: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  label: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
});

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: '500',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  infoCard: {
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  latestCard: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chartCard: {
    marginBottom: Spacing.lg,
  },
  chart: {
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  newEvalButton: {
    marginBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  evalCard: {
    marginBottom: Spacing.md,
  },
  evalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  evalDate: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  evalMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  measurementsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    marginBottom: Spacing.sm,
  },
  evalNotes: {
    fontSize: FontSize.sm,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
  },
});
