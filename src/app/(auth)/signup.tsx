import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { signUpWithEmail, signInWithEmail } from '@/services/auth';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

export default function SignUpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/login');
    }
  }

  async function handleSignUp() {
    if (!email || !password) return;
    if (password.length < 6) {
      Alert.alert(t('auth.error'), t('auth.passwordTooShort'));
      return;
    }
    try {
      setSubmitting(true);
      await signUpWithEmail(email, password);

      // Try auto-login: succeeds if email is pre-confirmed (e.g. demo account)
      try {
        await signInWithEmail(email, password);
        router.replace('/(tabs)/home');
        return;
      } catch {
        // Email not yet confirmed — fall through to show confirmation alert
      }

      Alert.alert(
        t('auth.signUpSuccessTitle'),
        t('auth.signUpSuccessBody'),
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
      );
    } catch (e: any) {
      Alert.alert(t('auth.error'), e.message ?? t('auth.signUpFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.inner}>
        <TouchableOpacity onPress={handleBack} style={styles.backRow}>
          <Text style={styles.backText}>← {t('common.back')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('auth.signUpEmail')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('auth.email')}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          testID="signup.email"
        />
        <TextInput
          style={styles.input}
          placeholder={t('auth.password')}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          testID="signup.password"
        />

        <TouchableOpacity
          style={[styles.button, (submitting || !email || !password) && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={submitting || !email || !password}
          testID="signup.submit"
        >
          <Text style={styles.buttonText}>{t('auth.signUpEmail')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  backRow: { alignSelf: 'flex-start', marginBottom: spacing.md },
  backText: { color: colors.plantPrimary, fontSize: typography.fontSize.sm },
  title: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xl,
    color: colors.text,
    marginBottom: spacing.md,
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    color: colors.text,
    fontSize: typography.fontSize.md,
  },
  button: {
    width: '100%',
    height: 48,
    backgroundColor: colors.plantPrimary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: colors.white,
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
  },
});
