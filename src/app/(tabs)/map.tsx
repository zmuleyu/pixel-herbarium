import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { useNearbyDiscoveries, type NearbyDiscovery } from '@/hooks/useNearbyDiscoveries';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// ~5km view delta
const REGION_DELTA = 0.09;

const RARITY_COLORS: Record<number, string> = {
  1: colors.rarity.common,
  2: colors.rarity.uncommon,
  3: colors.rarity.rare,
};

export default function MapScreen() {
  const { t } = useTranslation();
  const { discoveries, userLocation, loading, refresh } = useNearbyDiscoveries();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.plantPrimary} size="large" />
        <Text style={styles.loadingText}>{t('map.loading')}</Text>
      </View>
    );
  }

  if (!userLocation) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>{t('discover.gpsRequired')}</Text>
      </View>
    );
  }

  const region = {
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    latitudeDelta: REGION_DELTA,
    longitudeDelta: REGION_DELTA,
  };

  return (
    <ErrorBoundary fallbackLabel={t('map.loadError')}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('tabs.cityMap')}</Text>
          <Text style={styles.headerCount}>{t('map.discoveryCount', { count: discoveries.length })}</Text>
          <TouchableOpacity onPress={refresh} style={styles.refreshButton}>
            <Text style={styles.refreshText}>{t('map.refresh')}</Text>
          </TouchableOpacity>
        </View>

        {/* Map */}
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={region}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {discoveries.map((d) => (
            <PlantMarker key={d.id} discovery={d} />
          ))}
        </MapView>

        {/* Rarity legend */}
        <MapLegend />
      </View>
    </ErrorBoundary>
  );
}

// ── Plant Marker ──────────────────────────────────────────────────────
function PlantMarker({ discovery }: { discovery: NearbyDiscovery }) {
  const dotColor = RARITY_COLORS[discovery.rarity] ?? colors.rarity.common;
  return (
    <Marker coordinate={{ latitude: discovery.latitude, longitude: discovery.longitude }}>
      <View style={[markerStyles.dot, { backgroundColor: dotColor }]} />
      <Callout tooltip={false} style={styles.callout}>
        <Text style={styles.calloutName}>{discovery.plant_name_ja}</Text>
        {discovery.hanakotoba ? (
          <Text style={styles.calloutHanakotoba}>{discovery.hanakotoba}</Text>
        ) : null}
        {discovery.city ? (
          <Text style={styles.calloutCity}>{discovery.city}</Text>
        ) : null}
      </Callout>
    </Marker>
  );
}

// ── Rarity Legend ─────────────────────────────────────────────────────
function MapLegend() {
  const { t } = useTranslation();
  return (
    <View style={legendStyles.container}>
      {([1, 2, 3] as const).map((r) => (
        <View key={r} style={legendStyles.row}>
          <View style={[legendStyles.dot, { backgroundColor: RARITY_COLORS[r] }]} />
          <Text style={legendStyles.label}>{t(`rarity.${r}`)}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.background },
  center:             { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  map:                { flex: 1 },
  loadingText:        { color: colors.textSecondary, fontSize: typography.fontSize.sm },
  message:            { color: colors.text, fontSize: typography.fontSize.md, textAlign: 'center' },

  // Header
  header:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
  headerTitle:        { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.lg, color: colors.text, flex: 1 },
  headerCount:        { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  refreshButton:      { backgroundColor: colors.plantPrimary, borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  refreshText:        { color: colors.white, fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.display },

  // Callout
  callout:            { minWidth: 140, padding: spacing.sm, gap: 2 },
  calloutName:        { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.md, color: colors.text },
  calloutHanakotoba:  { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontStyle: 'italic' },
  calloutCity:        { fontSize: typography.fontSize.xs, color: colors.textSecondary },
});

const markerStyles = StyleSheet.create({
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.white,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
      android: { elevation: 3 },
    }),
  },
});

const legendStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: 4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 4 },
    }),
  },
  row:   { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot:   { width: 10, height: 10, borderRadius: 5 },
  label: { fontSize: typography.fontSize.xs, color: colors.text },
});
