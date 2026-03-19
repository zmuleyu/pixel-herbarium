import { View, Text, StyleSheet } from 'react-native';
import { getStampColors } from '@/utils/stamp-colors';
import { stamp as stampTheme } from '@/constants/theme';

interface SealStampProps {
  spotName: string;
  seasonEmoji: string;
  year: number;
  seasonLabel: string;
  themeColor: string;
}

export function SealStamp({ spotName, seasonEmoji, year, seasonLabel, themeColor }: SealStampProps) {
  const { brandMid } = getStampColors(themeColor);
  const icons = `${seasonEmoji}${seasonEmoji}${seasonEmoji}`;

  return (
    <View style={[styles.container, {
      borderColor: themeColor,
      width: stampTheme.sealDiameter,
      height: stampTheme.sealDiameter,
      borderRadius: stampTheme.sealDiameter / 2,
      opacity: stampTheme.opacity.seal,
    }]}>
      <Text style={[styles.spotName, { color: themeColor }]} numberOfLines={1}>{spotName}</Text>
      <Text style={styles.icons}>{icons}</Text>
      <Text style={[styles.yearSeason, { color: brandMid }]}>{year}{seasonLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.90)',
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  spotName: { fontSize: 8, letterSpacing: 1.5, fontWeight: 'bold' },
  icons: { fontSize: 14, letterSpacing: 2, marginVertical: 2 },
  yearSeason: { fontSize: 7, letterSpacing: 1 },
});
