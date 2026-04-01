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
import { useRouter } from 'expo-router';
import { signInWithApple, signInWithEmail, signInWithLine, confirmLinkLine } from '@/services/auth';
import { trackEvent } from '@/services/analytics';
import { useAuthStore } from '@/stores/auth-store';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { setError } = useAuthStore();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleGuest() {
    router.replace('/(tabs)/home' as any);
  }

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
      const result = await signInWithLine();

      if (result.requires_linking) {
        // User has an existing account with matching email — show merge confirmation
        const { id_token, existing_user_id } = result;
        Alert.alert(
          'アカウントが見つかりました',
          'このメールアドレスのアカウントがすでにあります。LINEと統合しますか？\n\n統合すると、今後LINEでもサインインできるようになります。',
          [
            {
              text: 'キャンセル',
              style: 'cancel',
              onPress: () => setSubmitting(false),
            },
            {
              text: '統合する',
              onPress: async () => {
                try {
                  await confirmLinkLine(id_token, existing_user_id);
                  // onAuthStateChange handles navigation
                  trackEvent('line_account_linked');
                } catch (linkErr: any) {
                  setError(linkErr.message);
                  Alert.alert(t('auth.error'), t('auth.lineError'));
                  setSubmitting(false);
                }
              },
            },
          ],
        );
        return; // submitting stays true until dialog resolves
      }

      // Normal sign-in — onAuthStateChange handles navigation
      trackEvent('line_login');
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
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/settings' as any);
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>← {t('common.back')}</Text>
        </TouchableOpacity>

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

        {/* LINE Sign-In — only visible when Channel ID is configured */}
        {!!process.env.EXPO_PUBLIC_LINE_CHANNEL_ID && (
          <TouchableOpacity
            style={[styles.lineButton, submitting && styles.buttonDisabled]}
            onPress={handleLine}
            disabled={submitting}
            testID="auth.signInLine"
          >
            <Text style={styles.lineButtonIcon}>L</Text>
            <Text style={styles.lineButtonText}>{t('auth.lineLogin')}</Text>
          </TouchableOpacity>
        )}

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

        <TouchableOpacity
          onPress={handleGuest}
          testID="auth.continueAsGuest"
          style={styles.guestButton}
        >
          <Text style={styles.guestText}>{t('auth.continueAsGuest')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/signup' as any)}
          testID="auth.goToSignUp"
          style={styles.guestButton}
        >
          <Text style={styles.guestText}>{t('auth.signUpEmail')}</Text>
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
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : spacing.lg,
    left: spacing.md,
    zIndex: 1,
    padding: spacing.sm,
  },
  backText: {
    color: colors.plantPrimary,
    fontSize: typography.fontSize.sm,
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
  guestButton: {
    marginTop: spacing.xs,
    padding: spacing.sm,
  },
  guestText: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.sm,
    textDecorationLine: 'underline',
  },
});
