import { View, Text, StyleSheet } from 'react-native';
import { getStampColors } from '@/utils/stamp-colors';
import { stamp as stampTheme } from '@/constants/theme';

interface PixelStampProps {
  spotName: string;
  cityEn: string;
  date: Date;
  themeColor: string;
}

function formatStampDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export function PixelStamp({ spotName, cityEn, date, themeColor }: PixelStampProps) {
  const { brandDeep, brandMid } = getStampColors(themeColor);

  return (
    <View style={[styles.container, { borderColor: themeColor, opacity: stampTheme.opacity.pixel }]}>
      <Text style={[styles.brand, { color: brandDeep }]}>✿ PIXEL HERBARIUM</Text>
      <Text style={[styles.spotName, { color: themeColor }]}>{spotName}</Text>
      <Text style={[styles.meta, { color: brandMid }]}>
        {formatStampDate(date)} · {cityEn}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  brand: {
    fontFamily: 'monospace',
    fontSize: 7,
    letterSpacing: 1,
    marginBottom: 2,
  },
  spotName: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    fontFamily: 'monospace',
    fontSize: 7,
    letterSpacing: 0.5,
    marginTop: 1,
  },
});
