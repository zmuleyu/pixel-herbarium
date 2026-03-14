import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { checkQuota } from '@/services/antiCheat';
import { signOut } from '@/services/auth';
import { supabase } from '@/services/supabase';
import { MONTHLY_QUOTA } from '@/constants/plants';

export interface UseProfileReturn {
  email: string;
  displayName: string;
  avatarUrl: string | null;
  quotaUsed: number;
  quotaTotal: number;
  loading: boolean;
  updating: boolean;
  handleSignOut: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const { user, clearAuth } = useAuthStore();
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function load() {
      // Fetch display_name from profiles table
      const { data } = await (supabase as any)
        .from('profiles')
        .select('display_name')
        .eq('id', user!.id)
        .single();

      if (data?.display_name) {
        setDisplayName(data.display_name);
      } else {
        // Fallback: derive from auth metadata
        const fullName = user!.user_metadata?.full_name as string | undefined;
        setDisplayName(fullName ?? (user!.email ?? '').split('@')[0] ?? '');
      }

      const { remaining } = await checkQuota(user!.id);
      setQuotaUsed(MONTHLY_QUOTA - remaining);
      setLoading(false);
    }

    load();
  }, [user?.id]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    clearAuth();
  }, [clearAuth]);

  const updateDisplayName = useCallback(async (name: string) => {
    if (!user || !name.trim()) return;
    setUpdating(true);
    const trimmed = name.trim();
    // Optimistic update
    setDisplayName(trimmed);
    await (supabase as any)
      .from('profiles')
      .update({ display_name: trimmed, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    setUpdating(false);
  }, [user?.id]);

  const email = user?.email ?? '';
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null;

  return {
    email,
    displayName,
    avatarUrl,
    quotaUsed,
    quotaTotal: MONTHLY_QUOTA,
    loading,
    updating,
    handleSignOut,
    updateDisplayName,
  };
}
