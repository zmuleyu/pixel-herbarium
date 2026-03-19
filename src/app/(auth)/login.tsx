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
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTranslation } from 'react-i18next';
import { signInWithApple, signInWithEmail, signInWithLine } from '@/services/auth';
import { useAuthStore } from '@/stores/auth-store';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { setError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleApple() {
    try {
      setSubmitting(true);
      await signInWithApple();
      // onAuthStateChange in _layout.tsx handles session/user updates.
      // Don't reset submitting — component unmounts on success.
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        setError(e.message);
        Alert.alert(t('auth.error'), e.message);
      }
      setSubmitting(false);
    }
  }

  async function handleLine() {
    try {
      setSubmitting(true);
      await signInWithLine();
      // onAuthStateChange in _layout.tsx handles session/user updates.
    } catch (e: any) {
      if (!e.message?.includes('cancelled')) {
        setError(e.message);
        Alert.alert(t('auth.error'), t('auth.lineError'));
      }
      setSubmitting(false);
    }
  }

  async function handleEmail() {
    if (!email || !password) return;
    try {
      setSubmitting(true);
      await signInWithEmail(email, password);
      // onAuthStateChange handles session/user updates.
    } catch (e: any) {
      setError(e.message);
      Alert.alert(t('auth.error'), e.message);
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.inner}>
        {/* Title */}
        <Text style={styles.title}>{t('auth.appName')}</Text>
        <Text style={styles.subtitle}>{t('auth.tagline')}</Text>

        {/* Apple Sign-In (iOS only, shown above LINE) */}
        {Platform.OS === 'ios' && (
          <View testID="auth.apple">
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={borderRadius.md}
            style={styles.appleButton}
            onPress={handleApple}
          />
          </View>
        )}

        {/* LINE Sign-In */}
        <TouchableOpacity
          style={[styles.lineButton, submitting && styles.buttonDisabled]}
          onPress={handleLine}
          disabled={submitting}
          testID="auth.signInLine"
        >
          <Text style={styles.lineButtonIcon}>L</Text>
          <Text style={styles.lineButtonText}>{t('auth.signInLine')}</Text>
        </TouchableOpacity>

        <Text style={styles.divider}>— {t('auth.orEmail')} —</Text>

        {/* Email / Password */}
        <TextInput
          style={styles.input}
          placeholder={t('auth.email')}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          testID="auth.email"
        />
        <TextInput
          style={styles.input}
          placeholder={t('auth.password')}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          testID="auth.password"
        />

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleEmail}
          disabled={submitting}
          testID="auth.signIn"
        >
          <Text style={styles.buttonText}>{t('auth.signIn')}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xxl,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  appleButton: {
    width: '100%',
    height: 48,
  },
  divider: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
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
  buttonDisabled: {
    opacity: 0.5,
  },
  lineButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#06C755',
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  lineButtonIcon: {
    color: colors.white,
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.lg,
    lineHeight: 24,
    fontWeight: 'bold',
  },
  lineButtonText: {
    color: colors.white,
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
  },
  buttonText: {
    color: colors.white,
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
  },
});
