import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';

export interface Profile {
  id: string;
  display_name: string;
  avatar_seed: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  friend: Profile; // the other party
}

interface UseFriendsReturn {
  friends: Friendship[];
  pendingReceived: Friendship[];
  pendingSent: Friendship[];
  loading: boolean;
  searchResults: Profile[];
  searching: boolean;
  searchUsers: (query: string) => Promise<void>;
  sendRequest: (addresseeId: string) => Promise<void>;
  acceptRequest: (friendshipId: string) => Promise<void>;
  declineRequest: (friendshipId: string) => Promise<void>;
  refresh: () => void;
}

export function useFriends(userId: string): UseFriendsReturn {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingReceived, setPendingReceived] = useState<Friendship[]>([]);
  const [pendingSent, setPendingSent] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;

    async function load() {
      setLoading(true);

      // Fetch all friendships where current user is involved
      const { data, error } = await (supabase as any)
        .from('friendships')
        .select(`
          id, requester_id, addressee_id, status,
          requester:profiles!friendships_requester_id_fkey(id, display_name, avatar_seed),
          addressee:profiles!friendships_addressee_id_fkey(id, display_name, avatar_seed)
        `)
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

      if (cancelled) return;
      if (error || !data) {
        setLoading(false);
        return;
      }

      const accepted: Friendship[] = [];
      const received: Friendship[] = [];
      const sent: Friendship[] = [];

      for (const row of data) {
        const iAmRequester = row.requester_id === userId;
        const friend: Profile = iAmRequester ? row.addressee : row.requester;
        const entry: Friendship = {
          id: row.id,
          requester_id: row.requester_id,
          addressee_id: row.addressee_id,
          status: row.status,
          friend,
        };

        if (row.status === 'accepted') {
          accepted.push(entry);
        } else if (row.status === 'pending') {
          if (iAmRequester) sent.push(entry);
          else received.push(entry);
        }
      }

      setFriends(accepted);
      setPendingReceived(received);
      setPendingSent(sent);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [userId, tick]);

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await (supabase as any)
      .from('profiles')
      .select('id, display_name, avatar_seed')
      .ilike('display_name', `%${query}%`)
      .neq('id', userId)
      .limit(20);
    setSearchResults(data ?? []);
    setSearching(false);
  }, [userId]);

  const sendRequest = useCallback(async (addresseeId: string) => {
    await (supabase as any)
      .from('friendships')
      .insert({ requester_id: userId, addressee_id: addresseeId, status: 'pending' });
    setTick((t) => t + 1);
  }, [userId]);

  const acceptRequest = useCallback(async (friendshipId: string) => {
    await (supabase as any)
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);
    setTick((t) => t + 1);
  }, []);

  const declineRequest = useCallback(async (friendshipId: string) => {
    await (supabase as any)
      .from('friendships')
      .update({ status: 'rejected' })
      .eq('id', friendshipId);
    setTick((t) => t + 1);
  }, []);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return {
    friends, pendingReceived, pendingSent,
    loading, searchResults, searching,
    searchUsers, sendRequest, acceptRequest, declineRequest, refresh,
  };
}
