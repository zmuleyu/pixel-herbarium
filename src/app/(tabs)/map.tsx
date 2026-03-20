import { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { GuideWrapper, MeasuredView } from '@/components/guide';
import { MAP_STEPS } from '@/constants/guide-steps';
import MapView, { Marker, Callout, Heatmap, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useNearbyDiscoveries, type NearbyDiscovery } from '@/hooks/useNearbyDiscoveries';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import * as Location from 'expo-location';
import { useSpotStore } from '@/stores/spot-store';
import { isWithinRadius } from '@/utils/geo';
import { getBloomStatus } from '@/utils/bloom';
import PrePermissionScreen from '@/components/PrePermissionScreen';
import SpotCheckinAnimation from '@/components/SpotCheckinAnimation';
import { maybeRequestReview } from '@/hooks/useReviewPrompt';
import type { FlowerSpot } from '@/types/hanami';

// ~5km view delta
const REGION_DELTA = 0.09;

// Heat map gradient — Adult Kawaii sage green (never harsh red)
const HEATMAP_GRADIENT = {
  colors: ['rgba(193, 232, 216, 0)', '#c1e8d8', '#9fb69f', '#5a8a5a'],
  startPoints: [0, 0.4, 0.7, 1.0],
  colorMapSize: 256,
};

const RARITY_COLORS: Record<number, string> = {
  1: colors.rarity.common,
  2: colors.rarity.uncommon,
  3: colors.rarity.rare,
};

export default function MapScreen() {
  const { t } = useTranslation();
  const { discoveries, userLocation, loading, refresh } = useNearbyDiscoveries();
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [mapLayer, setMapLayer]       = useState<'discoveries' | 'spots'>('discoveries');
  const [showPrePerm, setShowPrePerm] = useState(false);
  const [nearbySpot, setNearbySpot]   = useState<FlowerSpot | null>(null);
  const [animSpot, setAnimSpot]       = useState<FlowerSpot | null>(null);
  const [animMankai, setAnimMankai]   = useState(false);
  const proximityTimer                = useRef<ReturnType<typeof setInterval> | null>(null);

  const { spots, initSpots, performCheckin, hasCheckedIn } = useSpotStore();

  const heatPoints = useMemo(
    () => discoveries.map(d => ({ latitude: d.latitude, longitude: d.longitude, weight: d.rarity })),
    [discoveries],
  );

  function startProximityWatch() {
    if (proximityTimer.current) return;
    proximityTimer.current = setInterval(() => {
      if (!userLocation) return;
      const nearby = spots.find((s) =>
        !hasCheckedIn(s.id) &&
        isWithinRadius(
          { latitude: userLocation.latitude, longitude: userLocation.longitude },
          { latitude: s.latitude, longitude: s.longitude },
          500,
        )
      );
      setNearbySpot(nearby ?? null);
    }, 5000);
  }

  useEffect(() => {
    if (mapLayer !== 'spots') return;
    if (spots.length === 0) initSpots();
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        setShowPrePerm(true);
        return;
      }
      startProximityWatch();
    })();
  }, [mapLayer]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { if (proximityTimer.current) clearInterval(proximityTimer.current); };
  }, []);

  async function handleCheckin(spot: FlowerSpot) {
    setNearbySpot(null);
    try {
      const { isMankai } = await performCheckin(spot.id);
      setAnimSpot(spot);
      setAnimMankai(isMankai);
      const newCount = useSpotStore.getState().checkins.length;
      if (newCount === 1 || newCount === 5) {
        await maybeRequestReview(newCount === 1 ? 'firstCheckin' : 'fiveCheckins');
      }
    } catch {
      setAnimSpot(spot);
      setAnimMankai(false);
    }
  }

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
      <GuideWrapper featureKey="map" steps={MAP_STEPS} overlayVariant="light">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <MeasuredView measureKey="map.layerToggle" style={styles.layerToggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, mapLayer === 'discoveries' && styles.toggleBtnActive]}
              onPress={() => setMapLayer('discoveries')}
            >
              <Text style={styles.toggleText}>{t('sakura.layerToggle.heatmap')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, mapLayer === 'spots' && styles.toggleBtnActive]}
              onPress={() => setMapLayer('spots')}
            >
              <Text style={styles.toggleText}>{t('sakura.layerToggle.spots')}</Text>
            </TouchableOpacity>
          </MeasuredView>
          <Text style={styles.headerTitle}>{t('tabs.cityMap')}</Text>
          <Text style={styles.headerCount}>{t('map.discoveryCount', { count: discoveries.length })}</Text>
          <MeasuredView measureKey="map.heatmapToggle">
            <TouchableOpacity
              onPress={() => setShowHeatmap(v => !v)}
              style={[styles.refreshButton, showHeatmap && styles.toggleActive]}
            >
              <Text style={styles.refreshText}>
                {showHeatmap ? t('map.togglePoints') : t('map.toggleHeatmap')}
              </Text>
            </TouchableOpacity>
          </MeasuredView>
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
          {!showHeatmap && discoveries.map((d) => (
            <PlantMarker key={d.id} discovery={d} />
          ))}
          {showHeatmap && heatPoints.length > 0 && (
            <Heatmap points={heatPoints} radius={50} opacity={0.75} gradient={HEATMAP_GRADIENT} />
          )}
          {mapLayer === 'spots' && spots.map((spot) => {
            const checked = hasCheckedIn(spot.id);
            const is100sen = spot.tags.includes('名所100選');
            return (
              <Marker
                key={spot.id}
                coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
                title={spot.nameJa}
                pinColor={is100sen ? (checked ? '#d4a017' : '#aaaaaa') : (checked ? colors.blushPink : '#cccccc')}
              />
            );
          })}
        </MapView>

        {/* Empty state overlay */}
        {discoveries.length === 0 && (
          <View style={styles.emptyOverlay}>
            <Text style={styles.emptyEmoji}>🌿</Text>
            <Text style={styles.emptyText}>{t('map.noDiscoveries')}</Text>
          </View>
        )}

        {/* Rarity legend — hidden in heat map mode */}
        {discoveries.length > 0 && !showHeatmap && <MapLegend />}

        {/* Checkin sheet */}
        {nearbySpot && (
          <View style={styles.checkinSheet}>
            <Text style={styles.checkinSpotName}>{nearbySpot.nameJa}</Text>
            {nearbySpot.tags.includes('名所100選') && (
              <Text style={styles.checkin100sen}>さくら名所100選</Text>
            )}
            <TouchableOpacity style={styles.checkinButton} onPress={() => handleCheckin(nearbySpot)}>
              <Text style={styles.checkinButtonText}>{t('sakura.checkinSheet.button')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pre-permission screen */}
        {showPrePerm && (
          <PrePermissionScreen
            onAllow={async () => {
              setShowPrePerm(false);
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status === 'granted') startProximityWatch();
            }}
            onSkip={() => setShowPrePerm(false)}
          />
        )}

        {/* Animation overlay */}
        {animSpot && (
          <SpotCheckinAnimation
            spot={animSpot}
            isMankai={animMankai}
            is100sen={animSpot.tags.includes('名所100選')}
            onDismiss={() => setAnimSpot(null)}
          />
        )}
      </View>
      </GuideWrapper>
    </ErrorBoundary>
  );
}

// ── Plant Marker ──────────────────────────────────────────────────────
function PlantMarker({ discovery }: { discovery: NearbyDiscovery }) {
  const router = useRouter();
  const dotColor = RARITY_COLORS[discovery.rarity] ?? colors.rarity.common;
  return (
    <Marker coordinate={{ latitude: discovery.latitude, longitude: discovery.longitude }}>
      <View style={[markerStyles.dot, { backgroundColor: dotColor }]} />
      <Callout tooltip={false} style={styles.callout}
               onPress={() => router.push(`/plant/${discovery.plant_id}`)}>
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
  emptyOverlay:       { position: 'absolute', top: '40%', alignSelf: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: borderRadius.md, padding: spacing.lg, gap: spacing.xs },
  emptyEmoji:         { fontSize: 36, opacity: 0.5 },
  emptyText:          { fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center' },

  // Header
  header:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
  headerTitle:        { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.lg, color: colors.text, flex: 1 },
  headerCount:        { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  refreshButton:      { backgroundColor: colors.plantPrimary, borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  toggleActive:       { backgroundColor: colors.plantSecondary },
  refreshText:        { color: colors.white, fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.display },

  // Layer toggle
  layerToggle: {
    flexDirection: 'row', backgroundColor: colors.white,
    borderRadius: borderRadius.full, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
  },
  toggleBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  toggleBtnActive: { backgroundColor: colors.blushPink },
  toggleText: { fontSize: typography.fontSize.sm, color: colors.text, fontFamily: typography.fontFamily.display },

  // Checkin sheet
  checkinSheet: {
    position: 'absolute', bottom: spacing.xl * 2, left: spacing.lg, right: spacing.lg,
    backgroundColor: colors.white, borderRadius: borderRadius.lg,
    padding: spacing.lg, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8,
  },
  checkinSpotName: {
    fontSize: typography.fontSize.lg, fontFamily: typography.fontFamily.display,
    color: colors.text, marginBottom: spacing.xs,
  },
  checkin100sen: { fontSize: typography.fontSize.xs, color: '#d4a017', marginBottom: spacing.md },
  checkinButton: {
    backgroundColor: colors.blushPink, paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl, borderRadius: borderRadius.full,
    width: '100%', alignItems: 'center',
  },
  checkinButtonText: { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.md, color: colors.text },

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
