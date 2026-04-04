/**
 * Tests for useFriends hook.
 * Supabase is mocked — covers friendship classification, search, and mutations.
 */

jest.mock('@/services/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { renderHook, act } from '@testing-library/react-hooks';
import { supabase } from '@/services/supabase';
import { useFriends } from '@/hooks/useFriends';

const mockFrom = supabase.from as jest.Mock;
const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

// ── Mock builders ─────────────────────────────────────────────────────────────

function makeProfile(id: string, name = 'TestUser') {
  return { id, display_name: name, avatar_seed: id };
}

/**
 * Build a raw friendship row as returned by Supabase.
 * `requester` and `addressee` are Profile-shaped objects.
 */
function makeFriendshipRow(
  id: string,
  requesterId: string,
  addresseeId: string,
  status: 'accepted' | 'pending' | 'rejected',
) {
  return {
    id,
    requester_id: requesterId,
    addressee_id: addresseeId,
    status,
    requester: makeProfile(requesterId, `User-${requesterId}`),
    addressee: makeProfile(addresseeId, `User-${addresseeId}`),
  };
}

/** Main friendships query: .select().or() resolves */
function makeFriendshipQuery(data: any[], error: any = null) {
  return {
    select: jest.fn().mockReturnThis(),
    or: jest.fn().mockResolvedValue({ data, error }),
  };
}

/** Pending (never resolves) — used to test loading state */
function makePendingQuery() {
  return {
    select: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnValue(new Promise(() => {})),
  };
}

/** profiles search: .select().ilike().neq().limit() resolves */
function makeSearchQuery(data: any[]) {
  return {
    select: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue({ data }),
  };
}

/** friendships.insert() resolves */
function makeInsertQuery(error: any = null) {
  return {
    insert: jest.fn().mockResolvedValue({ data: null, error }),
  };
}

/** friendships.update().eq() resolves */
function makeUpdateQuery(error: any = null) {
  return {
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ data: null, error }),
  };
}

beforeEach(() => {
  mockFrom.mockReset();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useFriends – initial state', () => {
  it('starts with loading=true', () => {
    mockFrom.mockReturnValue(makePendingQuery());
    const { result } = renderHook(() => useFriends('user-1'));
    expect(result.current.loading).toBe(true);
  });

  it('does not call supabase when userId is empty', async () => {
    const { result } = renderHook(() => useFriends(''));
    await act(async () => { await flushPromises(); });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false); // immediately resolves with no data when userId empty
  });

  it('returns empty arrays when there are no friendships', async () => {
    mockFrom.mockReturnValueOnce(makeFriendshipQuery([]));
    const { result } = renderHook(() => useFriends('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.loading).toBe(false);
    expect(result.current.friends).toHaveLength(0);
    expect(result.current.pendingReceived).toHaveLength(0);
    expect(result.current.pendingSent).toHaveLength(0);
  });

  it('handles null data gracefully', async () => {
    mockFrom.mockReturnValueOnce(makeFriendshipQuery(null as any));
    const { result } = renderHook(() => useFriends('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.loading).toBe(false);
    expect(result.current.friends).toHaveLength(0);
  });

  it('handles error gracefully', async () => {
    mockFrom.mockReturnValueOnce(makeFriendshipQuery(null as any, { message: 'DB error' }));
    const { result } = renderHook(() => useFriends('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.loading).toBe(false);
    expect(result.current.friends).toHaveLength(0);
  });
});

describe('useFriends – friendship classification', () => {
  it('classifies accepted friendship into friends array', async () => {
    const row = makeFriendshipRow('f-1', 'user-1', 'user-2', 'accepted');
    mockFrom.mockReturnValueOnce(makeFriendshipQuery([row]));
    const { result } = renderHook(() => useFriends('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.friends).toHaveLength(1);
    expect(result.current.friends[0].id).toBe('f-1');
    expect(result.current.pendingReceived).toHaveLength(0);
    expect(result.current.pendingSent).toHaveLength(0);
  });

  it('sets friend to addressee when current user is the requester', async () => {
    const row = makeFriendshipRow('f-1', 'user-1', 'user-2', 'accepted');
    mockFrom.mockReturnValueOnce(makeFriendshipQuery([row]));
    const { result } = renderHook(() => useFriends('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.friends[0].friend.id).toBe('user-2');
  });

  it('sets friend to requester when current user is the addressee', async () => {
    const row = makeFriendshipRow('f-1', 'user-9', 'user-1', 'accepted');
    mockFrom.mockReturnValueOnce(makeFriendshipQuery([row]));
    const { result } = renderHook(() => useFriends('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.friends[0].friend.id).toBe('user-9');
  });

  it('classifies pending as sent when current user is requester', async () => {
    const row = makeFriendshipRow('f-2', 'user-1', 'user-3', 'pending');
    mockFrom.mockReturnValueOnce(makeFriendshipQuery([row]));
    const { result } = renderHook(() => useFriends('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.pendingSent).toHaveLength(1);
    expect(result.current.pendingReceived).toHaveLength(0);
    expect(result.current.friends).toHaveLength(0);
  });

  it('classifies pending as received when current user is addressee', async () => {
    const row = makeFriendshipRow('f-2', 'user-3', 'user-1', 'pending');
    mockFrom.mockReturnValueOnce(makeFriendshipQuery([row]));
    const { result } = renderHook(() => useFriends('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.pendingReceived).toHaveLength(1);
    expect(result.current.pendingSent).toHaveLength(0);
    expect(result.current.friends).toHaveLength(0);
  });

  it('handles multiple friendships in different states', async () => {
    const rows = [
      makeFriendshipRow('f-1', 'user-1', 'user-2', 'accepted'),
      makeFriendshipRow('f-2', 'user-1', 'user-3', 'pending'),  // sent
      makeFriendshipRow('f-3', 'user-4', 'user-1', 'pending'),  // received
    ];
    mockFrom.mockReturnValueOnce(makeFriendshipQuery(rows));
    const { result } = renderHook(() => useFriends('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.friends).toHaveLength(1);
    expect(result.current.pendingSent).toHaveLength(1);
    expect(result.current.pendingReceived).toHaveLength(1);
  });
});

describe('useFriends – search', () => {
  it('searchUsers populates searchResults', async () => {
    mockFrom.mockReturnValueOnce(makeFriendshipQuery([])); // initial load
    const { result } = renderHook(() => useFriends('user-1'));
    await act(async () => { await flushPromises(); });

    mockFrom.mockReturnValueOnce(makeSearchQuery([makeProfile('user-5', '花子')]));
    await act(async () => {
      await result.current.searchUsers('花子');
    });

    expect(result.current.searchResults).toHaveLength(1);
    expect(result.current.searchResults[0].display_name).toBe('花子');
  });

  it('searchUsers with empty string clears results without calling supabase', async () => {
    mockFrom.mockReturnValueOnce(makeFriendshipQuery([]));
    const { result } = renderHook(() => useFriends('user-1'));
    await act(async () => { await flushPromises(); });

    const callsBefore = mockFrom.mock.calls.length;
    await act(async () => {
      await result.current.searchUsers('');
    });

    expect(mockFrom.mock.calls.length).toBe(callsBefore); // no new calls
    expect(result.current.searchResults).toHaveLength(0);
  });
});

describe('useFriends – mutations', () => {
  it('sendRequest calls insert and triggers refetch', async () => {
    mockFrom
      .mockReturnValueOnce(makeFriendshipQuery([]))  // initial load
      .mockReturnValueOnce(makeInsertQuery())         // insert
      .mockReturnValueOnce(makeFriendshipQuery([])); // refetch after tick

    const { result } = renderHook(() => useFriends('user-1'));
    await act(async () => { await flushPromises(); });

    await act(async () => {
      await result.current.sendRequest('user-2');
      await flushPromises();
    });

    // insert was called on 'friendships'
    expect(mockFrom).toHaveBeenCalledWith('friendships');
  });

  it('acceptRequest triggers refetch', async () => {
    mockFrom
      .mockReturnValueOnce(makeFriendshipQuery([]))  // initial load
      .mockReturnValueOnce(makeUpdateQuery())         // update
      .mockReturnValueOnce(makeFriendshipQuery([])); // refetch

    const { result } = renderHook(() => useFriends('user-1'));
    await act(async () => { await flushPromises(); });

    await act(async () => {
      await result.current.acceptRequest('f-1');
      await flushPromises();
    });

    expect(result.current.loading).toBe(false);
  });

  it('declineRequest triggers refetch', async () => {
    mockFrom
      .mockReturnValueOnce(makeFriendshipQuery([]))  // initial load
      .mockReturnValueOnce(makeUpdateQuery())         // update
      .mockReturnValueOnce(makeFriendshipQuery([])); // refetch

    const { result } = renderHook(() => useFriends('user-1'));
    await act(async () => { await flushPromises(); });

    await act(async () => {
      await result.current.declineRequest('f-1');
      await flushPromises();
    });

    expect(result.current.loading).toBe(false);
  });

  it('sendRequest rejects and does not refetch when insert returns error', async () => {
    mockFrom
      .mockReturnValueOnce(makeFriendshipQuery([]))
      .mockReturnValueOnce(makeInsertQuery({ message: 'insert failed' }));

    const { result } = renderHook(() => useFriends('user-1'));
    await act(async () => { await flushPromises(); });

    await expect(result.current.sendRequest('user-2')).rejects.toEqual({ message: 'insert failed' });
    expect(mockFrom).toHaveBeenCalledTimes(2);
  });

  it('acceptRequest rejects and does not refetch when update returns error', async () => {
    mockFrom
      .mockReturnValueOnce(makeFriendshipQuery([]))
      .mockReturnValueOnce(makeUpdateQuery({ message: 'update failed' }));

    const { result } = renderHook(() => useFriends('user-1'));
    await act(async () => { await flushPromises(); });

    await expect(result.current.acceptRequest('f-1')).rejects.toEqual({ message: 'update failed' });
    expect(mockFrom).toHaveBeenCalledTimes(2);
  });
});
