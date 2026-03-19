import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PixelStampProps {
  spotName: string;
  cityEn: string;
  date: Date;
  themeColor: string;
}

export function PixelStamp({ spotName, cityEn, date, themeColor }: PixelStampProps) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return (
    <View style={[styles.container, { borderColor: themeColor }]}>
      <Text style={[styles.city, { color: themeColor }]}>{cityEn}</Text>
      <Text style={[styles.name, { color: themeColor }]}>{spotName}</Text>
      <Text style={[styles.date, { color: themeColor }]}>{`${year}.${month}.${day}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 2, padding: 8, alignItems: 'center' },
  city: { fontSize: 10, letterSpacing: 2 },
  name: { fontSize: 13, fontWeight: 'bold', marginTop: 2 },
  date: { fontSize: 9, marginTop: 2 },
});
