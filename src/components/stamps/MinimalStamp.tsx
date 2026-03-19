import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MinimalStampProps {
  spotName: string;
  cityEn: string;
  date: Date;
  accentColor: string;
}

export function MinimalStamp({ spotName, cityEn, date, accentColor }: MinimalStampProps) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return (
    <View style={styles.container}>
      <View style={[styles.line, { backgroundColor: accentColor }]} />
      <Text style={styles.name}>{spotName}</Text>
      <Text style={styles.sub}>{`${cityEn}  ${year}.${month}.${day}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'flex-start' },
  line: { height: 2, width: 32, marginBottom: 4 },
  name: { fontSize: 13, fontWeight: '600', color: '#1a1a1a' },
  sub: { fontSize: 9, color: '#555', marginTop: 2, letterSpacing: 1 },
});
