// src/components/SpotDetailSheet.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { FlowerSpot } from '@/types/hanami';
import type { SpotCheckinResult } from '@/types/sakura';

interface Props {
  spot:           FlowerSpot | null;
  checkin:        SpotCheckinResult | null;
  visible:        boolean;
  onClose:        () => void;
  onViewOnMap:    () => void;
  /** i18n key for visit detail label — injected via defaultProps for testability */
  visitDetailKey?: string;
  /** i18n key for mankai label — injected via defaultProps for testability */
  mankaiKey?:      string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function SpotDetailSheet({
  spot, checkin, visible, onClose, onViewOnMap,
  visitDetailKey = 'sakura.collection.visitDetail',
  mankaiKey      = 'sakura.stampCard.mankai',
}: Props) {
  const { t } = useTranslation();
  if (!spot || !checkin || !visible) return null;

  const is100sen = spot.tags.includes('名所100選');

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        {is100sen && <Text style={styles.badge}>さくら名所100選</Text>}
        <Text style={styles.name}>{spot.nameJa}</Text>
        <Text style={styles.prefecture}>{spot.prefecture}　{spot.city}</Text>
        <Text style={styles.date}>
          {t(visitDetailKey, { date: formatDate(checkin.checked_in_at) })}
        </Text>
        {checkin.stamp_variant === 'mankai' && (
          <Text style={styles.mankaiLabel}>🌸 {t(mankaiKey)}</Text>
        )}
        <TouchableOpacity style={styles.mapButton} onPress={onViewOnMap}>
          <Text style={styles.mapButtonText}>地図で見る</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>閉じる</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

SpotDetailSheet.defaultProps = {
  visitDetailKey: 'sakura.collection.visitDetail',
  mankaiKey:      'sakura.stampCard.mankai',
};

export default SpotDetailSheet;

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  badge: { fontSize: typography.fontSize.xs, color: '#d4a017', marginBottom: spacing.xs },
  name: { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.xl,
          color: colors.text, marginBottom: spacing.xs },
  prefecture: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginBottom: spacing.md },
  date: { fontSize: typography.fontSize.md, color: colors.textSecondary, marginBottom: spacing.sm },
  mankaiLabel: { fontSize: typography.fontSize.sm, color: '#d4a017', marginBottom: spacing.md },
  mapButton: {
    backgroundColor: colors.plantPrimary,
    paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full, marginBottom: spacing.sm, width: '100%', alignItems: 'center',
  },
  mapButtonText: { color: colors.white, fontFamily: typography.fontFamily.display,
                   fontSize: typography.fontSize.md },
  closeButton: { paddingVertical: spacing.sm },
  closeText: { fontSize: typography.fontSize.md, color: colors.textSecondary },
});
