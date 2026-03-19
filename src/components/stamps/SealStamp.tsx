import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SealStampProps {
  spotName: string;
  seasonEmoji: string;
  year: number;
  seasonLabel: string;
  themeColor: string;
}

export function SealStamp({ spotName, seasonEmoji, year, seasonLabel, themeColor }: SealStampProps) {
  return (
    <View style={[styles.container, { borderColor: themeColor }]}>
      <Text style={[styles.emoji]}>{seasonEmoji}</Text>
      <Text style={[styles.name, { color: themeColor }]}>{spotName}</Text>
      <Text style={[styles.year, { color: themeColor }]}>{`${year} ${seasonLabel}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 2, borderRadius: 50, width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 20 },
  name: { fontSize: 9, textAlign: 'center', marginTop: 2 },
  year: { fontSize: 8, marginTop: 1 },
});
