import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { checkQuota } from '@/services/antiCheat';
import { signOut } from '@/services/auth';
import { MONTHLY_QUOTA } from '@/constants/plants';

export interface UseProfileReturn {
  email: string;
  displayName: string;
  avatarUrl: string | null;
  quotaUsed: number;
  quotaTotal: number;
  loading: boolean;
  handleSignOut: () => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const { user, clearAuth } = useAuthStore();
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    checkQuota(user.id).then(({ remaining }) => {
      setQuotaUsed(MONTHLY_QUOTA - remaining);
      setLoading(false);
    });
  }, [user?.id]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    clearAuth();
  }, [clearAuth]);

  const email = user?.email ?? '';
  const fullName = user?.user_metadata?.full_name as string | undefined;
  const displayName = fullName ?? email.split('@')[0] ?? '';
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null;

  return {
    email,
    displayName,
    avatarUrl,
    quotaUsed,
    quotaTotal: MONTHLY_QUOTA,
    loading,
    handleSignOut,
  };
}
