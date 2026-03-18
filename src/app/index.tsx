import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

// Root index — shows spinner while _layout.tsx redirect decides where to go.
// Visually matches the loading splash so there is no visible flash.
export default function Index() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator color={colors.plantPrimary} />
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
