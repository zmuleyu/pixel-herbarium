import { Redirect } from 'expo-router';

// Expo Router recommended pattern: root index redirects to app.
// _layout.tsx handles auth gating (login/onboarding) AFTER this fires.
export default function Index() {
  return <Redirect href="/(tabs)/discover" />;
}
