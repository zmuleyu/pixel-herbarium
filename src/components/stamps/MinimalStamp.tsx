import { View, Text, StyleSheet } from 'react-native';

interface MinimalStampProps {
  spotName: string;
  cityEn: string;
  date: Date;
  accentColor: string;
}

function formatStampDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export function MinimalStamp({ spotName, cityEn, date, accentColor }: MinimalStampProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.bar, { backgroundColor: accentColor }]} />
      <View style={styles.textGroup}>
        <Text style={styles.spotName}>{spotName}</Text>
        <Text style={styles.meta}>{cityEn} · {formatStampDate(date)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'stretch' },
  bar: { width: 2.5, borderRadius: 1, marginRight: 7 },
  textGroup: { paddingVertical: 3 },
  spotName: {
    fontSize: 13, fontWeight: '600',
    color: 'rgba(255,255,255,0.97)',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  meta: {
    fontSize: 8, marginTop: 2,
    color: 'rgba(255,255,255,0.78)',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
