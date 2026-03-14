import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { useNearbyDiscoveries, type NearbyDiscovery } from '@/hooks/useNearbyDiscoveries';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

// ~5km view delta
const REGION_DELTA = 0.09;

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
    </View>
  );
}

// ── Plant Marker ──────────────────────────────────────────────────────
function PlantMarker({ discovery }: { discovery: NearbyDiscovery }) {
  return (
    <Marker
      coordinate={{ latitude: discovery.latitude, longitude: discovery.longitude }}
      pinColor={colors.plantPrimary}
    >
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
