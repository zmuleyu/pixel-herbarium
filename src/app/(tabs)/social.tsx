import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { useFriends } from '@/hooks/useFriends';
import { useBouquets } from '@/hooks/useBouquets';
import { useHerbarium } from '@/hooks/useHerbarium';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { RARITY_LABELS } from '@/constants/plants';
import type { Friendship, Profile } from '@/hooks/useFriends';
import type { Bouquet } from '@/hooks/useBouquets';

type TabKey = 'friends' | 'bouquets';

export default function SocialScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const userId = user?.id ?? '';

  const friends = useFriends(userId);
  const bouquets = useBouquets(userId);

  const [activeTab, setActiveTab] = useState<TabKey>('friends');

  if (!userId) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>ログインが必要です</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab switcher */}
      <View style={styles.tabBar}>
        <TabButton label="友達" active={activeTab === 'friends'} onPress={() => setActiveTab('friends')} badge={friends.pendingReceived.length} />
        <TabButton label="花束" active={activeTab === 'bouquets'} onPress={() => setActiveTab('bouquets')} badge={bouquets.inbox.length} />
      </View>

      {activeTab === 'friends' ? (
        <FriendsPanel friends={friends} userId={userId} onVisit={(id) => router.push(`/friend/${id}` as any)} />
      ) : (
        <BouquetsPanel bouquets={bouquets} userId={userId} friends={friends.friends} />
      )}
    </View>
  );
}

// ── Tab button ────────────────────────────────────────────────────────────────
function TabButton({ label, active, onPress, badge }: {
  label: string; active: boolean; onPress: () => void; badge?: number;
}) {
  return (
    <TouchableOpacity style={[styles.tabBtn, active && styles.tabBtnActive]} onPress={onPress}>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
      {!!badge && badge > 0 && (
        <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>
      )}
    </TouchableOpacity>
  );
}

// ── Friends panel ─────────────────────────────────────────────────────────────
function FriendsPanel({ friends, userId, onVisit }: {
  friends: ReturnType<typeof useFriends>;
  userId: string;
  onVisit: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleQueryChange(text: string) {
    setQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => friends.searchUsers(text), 400);
  }

  async function handleSend(profile: Profile) {
    await friends.sendRequest(profile.id);
    setQuery('');
    friends.searchUsers('');
  }

  const sentIds = new Set(friends.pendingSent.map((f) => f.addressee_id));
  const friendIds = new Set(friends.friends.map((f) => f.friend.id));

  return (
    <ScrollView contentContainerStyle={styles.panel}>
      {/* Search */}
      <Text style={styles.sectionTitle}>ユーザーを検索</Text>
      <TextInput
        style={styles.input}
        placeholder="表示名で検索…"
        placeholderTextColor={colors.textSecondary}
        value={query}
        onChangeText={handleQueryChange}
        autoCapitalize="none"
      />
      {friends.searching && <ActivityIndicator color={colors.plantPrimary} style={{ marginVertical: spacing.sm }} />}
      {query.length > 0 && friends.searchResults.map((p) => {
        const alreadyFriend = friendIds.has(p.id);
        const pendingSent = sentIds.has(p.id);
        return (
          <View key={p.id} style={styles.row}>
            <AvatarCircle seed={p.avatar_seed} name={p.display_name} size={40} />
            <Text style={[styles.rowText, { flex: 1 }]}>{p.display_name}</Text>
            {alreadyFriend ? (
              <Text style={styles.tagText}>友達</Text>
            ) : pendingSent ? (
              <Text style={styles.tagText}>申請中</Text>
            ) : (
              <TouchableOpacity style={styles.smallBtn} onPress={() => handleSend(p)}>
                <Text style={styles.smallBtnText}>申請</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {/* Pending requests */}
      {friends.pendingReceived.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>フレンド申請</Text>
          {friends.pendingReceived.map((f) => (
            <View key={f.id} style={styles.row}>
              <AvatarCircle seed={f.friend.avatar_seed} name={f.friend.display_name} size={40} />
              <Text style={[styles.rowText, { flex: 1 }]}>{f.friend.display_name}</Text>
              <TouchableOpacity style={styles.smallBtn} onPress={() => friends.acceptRequest(f.id)}>
                <Text style={styles.smallBtnText}>承認</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smallBtn, styles.smallBtnSecondary]} onPress={() => friends.declineRequest(f.id)}>
                <Text style={[styles.smallBtnText, styles.smallBtnTextSecondary]}>拒否</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      {/* Friends list */}
      <Text style={styles.sectionTitle}>友達 ({friends.friends.length})</Text>
      {friends.loading ? (
        <ActivityIndicator color={colors.plantPrimary} />
      ) : friends.friends.length === 0 ? (
        <Text style={styles.emptyText}>まだ友達がいません</Text>
      ) : (
        friends.friends.map((f) => (
          <TouchableOpacity key={f.id} style={styles.row} onPress={() => onVisit(f.friend.id)}>
            <AvatarCircle seed={f.friend.avatar_seed} name={f.friend.display_name} size={40} />
            <Text style={[styles.rowText, { flex: 1 }]}>{f.friend.display_name}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

// ── Bouquets panel ────────────────────────────────────────────────────────────
function BouquetsPanel({ bouquets, userId, friends }: {
  bouquets: ReturnType<typeof useBouquets>;
  userId: string;
  friends: Friendship[];
}) {
  const [showCompose, setShowCompose] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.panel}>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowCompose(true)}>
        <Text style={styles.primaryBtnText}>🌸 花束を贈る</Text>
      </TouchableOpacity>

      {/* Inbox */}
      {bouquets.inbox.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>受け取った花束</Text>
          {bouquets.inbox.map((b) => (
            <BouquetCard key={b.id} bouquet={b} isReceiver onAccept={() => bouquets.acceptBouquet(b.id)} onDecline={() => bouquets.declineBouquet(b.id)} />
          ))}
        </>
      )}

      {/* Sent */}
      <Text style={styles.sectionTitle}>送った花束</Text>
      {bouquets.loading ? (
        <ActivityIndicator color={colors.plantPrimary} />
      ) : bouquets.sent.length === 0 ? (
        <Text style={styles.emptyText}>まだ送っていません</Text>
      ) : (
        bouquets.sent.map((b) => (
          <BouquetCard key={b.id} bouquet={b} isReceiver={false} />
        ))
      )}

      <ComposeModal
        visible={showCompose}
        friends={friends}
        userId={userId}
        onSend={async (receiverId, plantIds, message) => {
          await bouquets.sendBouquet(receiverId, plantIds, message);
          setShowCompose(false);
        }}
        onClose={() => setShowCompose(false)}
      />
    </ScrollView>
  );
}

// ── Bouquet card ──────────────────────────────────────────────────────────────
function BouquetCard({ bouquet, isReceiver, onAccept, onDecline }: {
  bouquet: Bouquet;
  isReceiver: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
}) {
  const statusLabel: Record<string, string> = { pending: '未回答', accepted: '受け取り済み', declined: '辞退' };
  const other = isReceiver ? bouquet.sender : bouquet.receiver;

  return (
    <View style={styles.bouquetCard}>
      <Text style={styles.bouquetFrom}>
        {isReceiver ? `${other?.display_name ?? '?'} より` : `${other?.display_name ?? '?'} へ`}
      </Text>
      <View style={styles.bouquetPlants}>
        {(bouquet.plants ?? []).map((p) => (
          <View key={p.id} style={styles.bouquetPlantChip}>
            <Text style={styles.bouquetPlantName}>{p.name_ja}</Text>
          </View>
        ))}
      </View>
      {bouquet.message ? <Text style={styles.bouquetMessage}>"{bouquet.message}"</Text> : null}
      {isReceiver && bouquet.status === 'pending' ? (
        <View style={styles.bouquetActions}>
          <TouchableOpacity style={styles.smallBtn} onPress={onAccept}>
            <Text style={styles.smallBtnText}>受け取る</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.smallBtn, styles.smallBtnSecondary]} onPress={onDecline}>
            <Text style={[styles.smallBtnText, styles.smallBtnTextSecondary]}>辞退</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.statusTag}>{statusLabel[bouquet.status] ?? bouquet.status}</Text>
      )}
    </View>
  );
}

// ── Compose modal ─────────────────────────────────────────────────────────────
function ComposeModal({ visible, friends, userId, onSend, onClose }: {
  visible: boolean;
  friends: Friendship[];
  userId: string;
  onSend: (receiverId: string, plantIds: number[], message: string) => Promise<void>;
  onClose: () => void;
}) {
  const herbarium = useHerbarium(userId);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [selectedPlants, setSelectedPlants] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const collectedPlants = herbarium.plants.filter((p) => herbarium.collected.has(p.id));

  function togglePlant(id: number) {
    setSelectedPlants((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  }

  async function handleSend() {
    if (!selectedFriend || selectedPlants.length < 3) return;
    setSending(true);
    await onSend(selectedFriend, selectedPlants, message);
    setSending(false);
    setSelectedFriend(null);
    setSelectedPlants([]);
    setMessage('');
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>花束を贈る</Text>

          {/* Friend selector */}
          <Text style={styles.sectionTitle}>宛先</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
            {friends.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.friendChip, selectedFriend === f.friend.id && styles.friendChipSelected]}
                onPress={() => setSelectedFriend(f.friend.id)}
              >
                <Text style={[styles.friendChipText, selectedFriend === f.friend.id && styles.friendChipTextSelected]}>
                  {f.friend.display_name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Plant selector */}
          <Text style={styles.sectionTitle}>植物を選ぶ（3〜5種）</Text>
          <ScrollView style={{ maxHeight: 140 }}>
            {collectedPlants.map((p) => {
              const selected = selectedPlants.includes(p.id);
              const rarityLabel = RARITY_LABELS[p.rarity as keyof typeof RARITY_LABELS] ?? '★';
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.plantRow, selected && styles.plantRowSelected]}
                  onPress={() => togglePlant(p.id)}
                >
                  <Text style={styles.plantRowText}>{rarityLabel} {p.name_ja}</Text>
                  {selected && <Text style={{ color: colors.plantPrimary }}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Message */}
          <Text style={styles.sectionTitle}>メッセージ（任意）</Text>
          <TextInput
            style={[styles.input, { height: 60 }]}
            placeholder="200文字以内…"
            placeholderTextColor={colors.textSecondary}
            value={message}
            onChangeText={(t) => setMessage(t.slice(0, 200))}
            multiline
          />

          <Text style={styles.selectedCount}>{selectedPlants.length}/5 種選択中</Text>

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={handleSend}
              disabled={!selectedFriend || selectedPlants.length < 3 || sending}>
              {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>送る</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.smallBtn, styles.smallBtnSecondary, { flex: 1, justifyContent: 'center' }]} onPress={onClose}>
              <Text style={[styles.smallBtnText, styles.smallBtnTextSecondary]}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Avatar helper ─────────────────────────────────────────────────────────────
function AvatarCircle({ seed, name, size }: { seed: string; name: string; size: number }) {
  const initial = (name[0] ?? '?').toUpperCase();
  // Derive a consistent hue from the seed string
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: `hsl(${h},50%,60%)`, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontFamily: typography.fontFamily.display, fontSize: size * 0.4 }}>{initial}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.background },
  center:         { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  panel:          { padding: spacing.md, gap: spacing.sm, paddingBottom: 40 },

  // Top tab bar
  tabBar:         { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tabBtn:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, flexDirection: 'row', gap: 6 },
  tabBtnActive:   { borderBottomWidth: 2, borderBottomColor: colors.plantPrimary },
  tabLabel:       { fontSize: typography.fontSize.md, color: colors.textSecondary },
  tabLabelActive: { color: colors.plantPrimary, fontFamily: typography.fontFamily.display },
  badge:          { backgroundColor: '#e74c3c', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText:      { color: '#fff', fontSize: 11, fontFamily: typography.fontFamily.display },

  sectionTitle:   { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyText:      { color: colors.textSecondary, fontSize: typography.fontSize.sm, textAlign: 'center', paddingVertical: spacing.md },

  // Row
  row:            { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowText:        { fontSize: typography.fontSize.md, color: colors.text },
  chevron:        { fontSize: 20, color: colors.textSecondary },
  tagText:        { fontSize: typography.fontSize.xs, color: colors.textSecondary },

  // Buttons
  primaryBtn:     { backgroundColor: colors.plantPrimary, borderRadius: borderRadius.md, paddingVertical: spacing.sm, alignItems: 'center', marginVertical: spacing.sm },
  primaryBtnText: { color: '#fff', fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.md },
  smallBtn:       { backgroundColor: colors.plantPrimary, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: 6 },
  smallBtnSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  smallBtnText:   { color: '#fff', fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.display },
  smallBtnTextSecondary: { color: colors.text },

  // Input
  input:          { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, padding: spacing.sm, color: colors.text, fontSize: typography.fontSize.sm, backgroundColor: colors.white },

  // Bouquet card
  bouquetCard:    { backgroundColor: colors.white, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.xs },
  bouquetFrom:    { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  bouquetPlants:  { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  bouquetPlantChip: { backgroundColor: colors.background, borderRadius: borderRadius.sm, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: colors.border },
  bouquetPlantName: { fontSize: typography.fontSize.xs, color: colors.text },
  bouquetMessage: { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontStyle: 'italic' },
  bouquetActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  statusTag:      { fontSize: typography.fontSize.xs, color: colors.textSecondary, alignSelf: 'flex-start' },

  // Modal
  modalBackdrop:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:      { backgroundColor: colors.background, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, padding: spacing.xl, gap: spacing.sm, paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl },
  modalTitle:     { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.xl, color: colors.text, textAlign: 'center' },

  // Compose modal
  friendChip:     { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginRight: spacing.xs, backgroundColor: colors.white },
  friendChipSelected: { backgroundColor: colors.plantPrimary, borderColor: colors.plantPrimary },
  friendChipText: { fontSize: typography.fontSize.sm, color: colors.text },
  friendChipTextSelected: { color: '#fff' },
  plantRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: spacing.sm, borderRadius: borderRadius.sm },
  plantRowSelected: { backgroundColor: `${colors.plantPrimary}18` },
  plantRowText:   { fontSize: typography.fontSize.sm, color: colors.text },
  selectedCount:  { fontSize: typography.fontSize.xs, color: colors.textSecondary, textAlign: 'center' },
});
