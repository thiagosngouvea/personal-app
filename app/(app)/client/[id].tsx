import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { useTheme, useIsDark } from '@/hooks/useTheme';
import { clientService } from '@/services/clientService';
import { evaluationService } from '@/services/evaluationService';
import { useTranslation } from '@/i18n';
import { Client, Evaluation } from '@/types';
import { Loading, Card, EmptyState, Button } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/constants/theme';

const screenWidth = Dimensions.get('window').width;

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useTheme();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const t = useTranslation();

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
    return new Date(date).toLocaleDateString(t.dateLocale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatShortDate = (date: Date) => {
    return new Date(date).toLocaleDateString(t.dateLocale, {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDeleteEvaluation = (evaluation: Evaluation) => {
    Alert.alert(t.evaluation.deleteEvaluation, t.evaluation.deleteEvalConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await evaluationService.remove(evaluation.id, evaluation.clientId);
            setEvaluations((prev) => prev.filter((e) => e.id !== evaluation.id));
          } catch (err) {
            Alert.alert(t.common.error, t.evaluation.errorDeleteEvaluation);
            console.error(err);
          }
        },
      },
    ]);
  };

  const handleEditEvaluation = (evaluation: Evaluation) => {
    if (!client) return;
    router.push({
      pathname: '/(app)/evaluation/new',
      params: {
        clientId: evaluation.clientId,
        clientHeight: client.height.toString(),
        evaluationId: evaluation.id,
      },
    });
  };

  if (loading) return <Loading message={t.client.loadingClient} />;
  if (!client) return <Loading message={t.client.clientNotFound} />;

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 1,
    color: (opacity = 1) => isDark ? `rgba(56, 189, 248, ${opacity})` : `rgba(14, 165, 233, ${opacity})`,
    labelColor: () => colors.textSecondary,
    style: { borderRadius: BorderRadius.lg },
    propsForDots: { r: '5', strokeWidth: '2', stroke: colors.primary },
    propsForBackgroundLines: { strokeDasharray: '', stroke: colors.border, strokeWidth: 0.5 },
  };

  const weightData = evaluations.filter((e) => e.weight);
  const bodyFatData = evaluations.filter((e) => e.protocols?.pollock3 || e.protocols?.pollock7);

  const latest = evaluations.length > 0 ? evaluations[evaluations.length - 1] : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
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

        {/* Client Profile */}
        <View style={styles.profileSection}>
          {client.photoUrl ? (
            <Image source={{ uri: client.photoUrl }} style={styles.profilePhoto} />
          ) : (
            <View style={[styles.profilePhoto, styles.profilePhotoPlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.profileInitials, { color: colors.primary }]}>
                {client.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
              </Text>
            </View>
          )}
        </View>

        {/* Client Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <InfoItem
              icon="calendar"
              label={t.client.age}
              value={`${client.age} ${t.common.years}`}
              colors={colors}
            />
            <InfoItem
              icon="resize"
              label={t.client.height}
              value={`${client.height}m`}
              colors={colors}
            />
            <InfoItem
              icon="person"
              label={t.client.gender}
              value={
                client.gender === 'male' ? t.client.male
                  : client.gender === 'female' ? t.client.female
                  : t.client.other
              }
              colors={colors}
            />
          </View>
        </Card>

        {/* Contact Info */}
        {(client.whatsapp || client.email) && (
          <Card style={styles.infoCard}>
            {client.whatsapp && (
              <TouchableOpacity
                style={styles.contactRow}
                activeOpacity={0.7}
                onPress={() => Linking.openURL(`https://wa.me/${client.whatsapp?.replace(/\D/g, '')}`)}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                <Text style={[styles.contactText, { color: colors.text }]}>
                  {client.whatsapp}
                </Text>
                <Ionicons name="open-outline" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
            {client.email && (
              <TouchableOpacity
                style={[styles.contactRow, client.whatsapp ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: Spacing.md, marginTop: Spacing.md } : undefined]}
                activeOpacity={0.7}
                onPress={() => Linking.openURL(`mailto:${client.email}`)}
              >
                <Ionicons name="mail-outline" size={20} color={colors.primary} />
                <Text style={[styles.contactText, { color: colors.text }]}>
                  {client.email}
                </Text>
                <Ionicons name="open-outline" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </Card>
        )}

        {/* Latest Assessment */}
        {latest && (
          <Card style={styles.latestCard}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {t.client.latestAssessment}
            </Text>
            <View style={styles.statsGrid}>
              <StatBadge label={t.evaluation.weight} value={`${latest.weight} kg`} colors={colors} />
              {latest.protocols?.bmi != null && (
                <StatBadge label={t.evaluation.bmi} value={`${latest.protocols.bmi}`} colors={colors} />
              )}
              {latest.protocols?.pollock3 != null && (
                <StatBadge label={t.evaluation.pollock3} value={`${latest.protocols.pollock3}%`} colors={colors} />
              )}
              {latest.protocols?.pollock7 != null && (
                <StatBadge label={t.evaluation.pollock7} value={`${latest.protocols.pollock7}%`} colors={colors} />
              )}
              {latest.protocols?.leanMass != null && (
                <StatBadge label={t.evaluation.leanMass} value={`${latest.protocols.leanMass} kg`} colors={colors} />
              )}
              {latest.protocols?.fatMass != null && (
                <StatBadge label={t.evaluation.fatMass} value={`${latest.protocols.fatMass} kg`} colors={colors} />
              )}
              {latest.protocols?.idealWeight != null && (
                <StatBadge label={t.evaluation.idealWeight} value={`${latest.protocols.idealWeight} kg`} colors={colors} />
              )}
              {latest.protocols?.maxHeartRate != null && (
                <StatBadge label={t.evaluation.maxHeartRate} value={`${latest.protocols.maxHeartRate} bpm`} colors={colors} />
              )}
              {latest.protocols?.waistHipRatio != null && (
                <StatBadge label={t.evaluation.waistHipRatio} value={`${latest.protocols.waistHipRatio}`} colors={colors} />
              )}
              {latest.protocols?.usNavy != null && (
                <StatBadge label={t.evaluation.usNavy} value={`${latest.protocols.usNavy}%`} colors={colors} />
              )}
            </View>
          </Card>
        )}

        {/* Weight Chart */}
        {weightData.length >= 2 && (
          <Card style={styles.chartCard}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {t.client.weightProgress}
            </Text>
            <LineChart
              data={{
                labels: weightData.slice(-7).map((e) => formatShortDate(e.createdAt)),
                datasets: [{
                  data: weightData.slice(-7).map((e) => e.weight),
                  color: (opacity = 1) => `rgba(14, 165, 233, ${opacity})`,
                  strokeWidth: 2,
                }],
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
              {t.client.bodyFatProgress}
            </Text>
            <LineChart
              data={{
                labels: bodyFatData.slice(-7).map((e) => formatShortDate(e.createdAt)),
                datasets: [{
                  data: bodyFatData.slice(-7).map((e) => e.protocols?.pollock3 || e.protocols?.pollock7 || 0),
                  color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                  strokeWidth: 2,
                }],
              }}
              width={screenWidth - Spacing.xl * 2 - Spacing.lg * 2}
              height={200}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                propsForDots: { r: '5', strokeWidth: '2', stroke: colors.accent },
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
          title={t.client.newEvaluation}
          onPress={() =>
            router.push({
              pathname: '/(app)/evaluation/new',
              params: { clientId: id, clientHeight: client.height.toString() },
            })
          }
          size="lg"
          style={styles.newEvalButton}
          icon={
            <Ionicons name="add-circle" size={20} color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
          }
        />

        {/* Evaluations List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t.client.allEvaluations}
          </Text>

          {evaluations.length === 0 ? (
            <EmptyState
              icon="clipboard-outline"
              title={t.client.noEvaluationsYet}
              description={t.client.noEvaluationsDescription}
            />
          ) : (
            [...evaluations].reverse().map((evaluation) => (
              <EvaluationCard
                key={evaluation.id}
                evaluation={evaluation}
                colors={colors}
                t={t}
                formatDate={formatDate}
                onEdit={() => handleEditEvaluation(evaluation)}
                onDelete={() => handleDeleteEvaluation(evaluation)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ==========================
// Sub-components
// ==========================

function EvaluationCard({
  evaluation,
  colors,
  t,
  formatDate,
  onEdit,
  onDelete,
}: {
  evaluation: Evaluation;
  colors: ReturnType<typeof useTheme>;
  t: ReturnType<typeof import('@/i18n').useTranslation>;
  formatDate: (date: Date) => string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const p = evaluation.protocols || {};
  const c = evaluation.circumferences || {};
  const hasCircumferences = Object.values(c).some((v) => v != null && v > 0);
  const hasPhotos = evaluation.photos && evaluation.photos.length > 0;

  return (
    <Card style={styles.evalCard}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <View style={styles.evalHeader}>
          <Text style={[styles.evalDate, { color: colors.text }]}>
            {formatDate(evaluation.createdAt)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {hasPhotos && (
              <Ionicons name="camera" size={16} color={colors.textTertiary} />
            )}
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textTertiary}
            />
          </View>
        </View>

        {/* Summary row */}
        <View style={styles.evalMetrics}>
          <MetricItem label={t.evaluation.weight} value={`${evaluation.weight} kg`} colors={colors} />
          {p.bmi != null && <MetricItem label={t.evaluation.bmi} value={`${p.bmi}`} colors={colors} />}
          {p.pollock3 != null && <MetricItem label="P3" value={`${p.pollock3}%`} colors={colors} />}
          {p.leanMass != null && <MetricItem label={t.evaluation.leanMass} value={`${p.leanMass} kg`} colors={colors} />}
        </View>
      </TouchableOpacity>

      {/* Expanded details */}
      {expanded && (
        <View style={[styles.expandedSection, { borderTopColor: colors.border }]}>
          {/* Full Protocols */}
          {(p.pollock7 != null || p.fatMass != null || p.idealWeight != null || p.maxHeartRate != null || p.waistHipRatio != null || p.usNavy != null) && (
            <View style={styles.expandedGroup}>
              <Text style={[styles.expandedGroupTitle, { color: colors.textSecondary }]}>
                {t.evaluation.protocols}
              </Text>
              <View style={styles.chipGrid}>
                {p.pollock7 != null && <MeasurementChip label={t.evaluation.pollock7} value={`${p.pollock7}%`} colors={colors} />}
                {p.fatMass != null && <MeasurementChip label={t.evaluation.fatMass} value={`${p.fatMass} kg`} colors={colors} />}
                {p.idealWeight != null && <MeasurementChip label={t.evaluation.idealWeight} value={`${p.idealWeight} kg`} colors={colors} />}
                {p.maxHeartRate != null && <MeasurementChip label={t.evaluation.maxHeartRate} value={`${p.maxHeartRate} bpm`} colors={colors} />}
                {p.waistHipRatio != null && <MeasurementChip label={t.evaluation.waistHipRatio} value={`${p.waistHipRatio}`} colors={colors} />}
                {p.usNavy != null && <MeasurementChip label={t.evaluation.usNavy} value={`${p.usNavy}%`} colors={colors} />}
              </View>
            </View>
          )}

          {/* Circumferences */}
          {hasCircumferences && (
            <View style={styles.expandedGroup}>
              <Text style={[styles.expandedGroupTitle, { color: colors.textSecondary }]}>
                {t.evaluation.circumferences}
              </Text>
              <View style={styles.chipGrid}>
                {c.neck != null && c.neck > 0 && <MeasurementChip label={t.evaluation.neck} value={`${c.neck} cm`} colors={colors} />}
                {c.chest != null && c.chest > 0 && <MeasurementChip label={t.evaluation.chest} value={`${c.chest} cm`} colors={colors} />}
                {c.waist != null && c.waist > 0 && <MeasurementChip label={t.evaluation.waist} value={`${c.waist} cm`} colors={colors} />}
                {c.abdomen != null && c.abdomen > 0 && <MeasurementChip label={t.evaluation.abdomen} value={`${c.abdomen} cm`} colors={colors} />}
                {c.hip != null && c.hip > 0 && <MeasurementChip label={t.evaluation.hip} value={`${c.hip} cm`} colors={colors} />}
                {c.shoulder != null && c.shoulder > 0 && <MeasurementChip label={t.evaluation.shoulder} value={`${c.shoulder} cm`} colors={colors} />}
                {c.rightForearm != null && c.rightForearm > 0 && <MeasurementChip label={t.evaluation.rightForearm} value={`${c.rightForearm} cm`} colors={colors} />}
                {c.leftForearm != null && c.leftForearm > 0 && <MeasurementChip label={t.evaluation.leftForearm} value={`${c.leftForearm} cm`} colors={colors} />}
                {c.rightArmRelaxed != null && c.rightArmRelaxed > 0 && <MeasurementChip label={t.evaluation.rightArmRelaxed} value={`${c.rightArmRelaxed} cm`} colors={colors} />}
                {c.leftArmRelaxed != null && c.leftArmRelaxed > 0 && <MeasurementChip label={t.evaluation.leftArmRelaxed} value={`${c.leftArmRelaxed} cm`} colors={colors} />}
                {c.rightArmFlexed != null && c.rightArmFlexed > 0 && <MeasurementChip label={t.evaluation.rightArmFlexed} value={`${c.rightArmFlexed} cm`} colors={colors} />}
                {c.leftArmFlexed != null && c.leftArmFlexed > 0 && <MeasurementChip label={t.evaluation.leftArmFlexed} value={`${c.leftArmFlexed} cm`} colors={colors} />}
                {c.rightThigh != null && c.rightThigh > 0 && <MeasurementChip label={t.evaluation.rightThigh} value={`${c.rightThigh} cm`} colors={colors} />}
                {c.leftThigh != null && c.leftThigh > 0 && <MeasurementChip label={t.evaluation.leftThigh} value={`${c.leftThigh} cm`} colors={colors} />}
                {c.rightCalf != null && c.rightCalf > 0 && <MeasurementChip label={t.evaluation.rightCalf} value={`${c.rightCalf} cm`} colors={colors} />}
                {c.leftCalf != null && c.leftCalf > 0 && <MeasurementChip label={t.evaluation.leftCalf} value={`${c.leftCalf} cm`} colors={colors} />}
              </View>
            </View>
          )}

          {/* Photos */}
          {hasPhotos && (
            <View style={styles.expandedGroup}>
              <Text style={[styles.expandedGroupTitle, { color: colors.textSecondary }]}>
                {t.evaluation.progressPhotos}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
                {evaluation.photos!.map((url, idx) => (
                  <Image
                    key={`photo-${idx}`}
                    source={{ uri: url }}
                    style={[styles.evalPhoto, { borderColor: colors.border }]}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {evaluation.notes && (
            <Text style={[styles.evalNotes, { color: colors.textSecondary }]}>
              {evaluation.notes}
            </Text>
          )}

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={onEdit}
              style={[styles.actionBtn, { backgroundColor: colors.primary + '15' }]}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={18} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                {t.common.edit}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDelete}
              style={[styles.actionBtn, { backgroundColor: colors.error + '15' }]}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={[styles.actionBtnText, { color: colors.error }]}>
                {t.common.delete}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Card>
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
      <Text style={[infoStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[infoStyles.value, { color: colors.text }]}>{value}</Text>
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
      <Text style={[badgeStyles.label, { color: colors.textSecondary }]}>{label}</Text>
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
      <Text style={[metricStyles.label, { color: colors.textTertiary }]}>{label}</Text>
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

// ==========================
// Styles
// ==========================

const infoStyles = StyleSheet.create({
  item: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: FontSize.md, fontWeight: '600' },
});

const badgeStyles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    minWidth: 70,
  },
  value: { fontSize: FontSize.md, fontWeight: '700' },
  label: { fontSize: FontSize.xs, marginTop: 2, textAlign: 'center' },
});

const metricStyles = StyleSheet.create({
  item: { alignItems: 'center' },
  value: { fontSize: FontSize.md, fontWeight: '600' },
  label: { fontSize: FontSize.xs, marginTop: 2 },
});

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  text: { fontSize: FontSize.xs, fontWeight: '500' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing.huge },
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
  profileSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profilePhotoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
  },
  infoCard: { marginBottom: Spacing.lg },
  infoRow: { flexDirection: 'row', justifyContent: 'space-around' },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  contactText: {
    flex: 1,
    fontSize: FontSize.md,
  },
  latestCard: { marginBottom: Spacing.lg },
  cardTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chartCard: { marginBottom: Spacing.lg },
  chart: { borderRadius: BorderRadius.md, marginTop: Spacing.sm },
  newEvalButton: { marginBottom: Spacing.xxl },
  section: { marginBottom: Spacing.xxl },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.lg },
  evalCard: { marginBottom: Spacing.md },
  evalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  evalDate: { fontSize: FontSize.md, fontWeight: '600' },
  evalMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.sm,
  },
  expandedSection: {
    borderTopWidth: 1,
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  expandedGroup: {
    marginBottom: Spacing.md,
  },
  expandedGroupTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  photosScroll: {
    marginBottom: Spacing.sm,
  },
  evalPhoto: {
    width: 100,
    height: 133,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  evalNotes: {
    fontSize: FontSize.sm,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  actionBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
