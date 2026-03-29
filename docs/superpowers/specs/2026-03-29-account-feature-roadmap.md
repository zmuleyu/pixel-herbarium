# Account Feature Roadmap — 账户功能改造路线图

**Date:** 2026-03-29
**Status:** Approved for planning
**Scope:** Supabase auth + cloud sync architecture

---

## 背景与现状分析

### 当前架构的核心问题

Pixel Herbarium 采用 offline-first 架构，打卡数据（`checkin_history`）完全存储在 AsyncStorage，即使用户已登录也**从不同步到 Supabase**。这导致：

- 换手机 → 日记全部消失
- 卸载重装 → 数据归零
- 账户功能对核心数据毫无保护价值

### 数据分布现状

| 数据类型 | 存储位置 | 登录后同步？ |
|----------|----------|-------------|
| 打卡记录（checkin_history） | AsyncStorage | ❌ 从不同步 |
| 照片（composedUri） | 本地文件系统 | ❌ 从不上传 |
| 好友关系 | Supabase `friendships` | ✅ |
| 花束 | Supabase `bouquets` | ✅ |
| 用户 Profile | Supabase `profiles` | ✅ |
| 植物收藏 | Supabase `collections` | ✅ |

### 登录方式

Apple Sign-In / LINE（需 `EXPO_PUBLIC_LINE_CHANNEL_ID`）/ Email+Password / ゲストとして続ける

### 现有问题清单

| 问题 | 影响 |
|------|------|
| 云备份价值在 UI 中无任何说明 | 用户不知道为什么要登录，登录率低 |
| `handleDeleteData` 只清本地，不清 Supabase | 账户删除后服务端残留数据 |
| Social tab 对未登录用户显示硬墙 | 无内容预览，体验断崖 |
| Discover tab 打卡需登录，主流程不需要 | 逻辑不一致，用户困惑 |
| 账户删除失败时本地数据已清空 | 数据不一致风险 |

---

## 改造路线图

### P1 — 登录价值传达（v1.3.0，低风险）

**目标**：让用户明白登录有什么好处，提升登录率。

**改动文件**：`src/app/(tabs)/settings.tsx`、`src/i18n/ja.json`、`src/i18n/en.json`

**具体内容**：

1. **设置页登录入口加说明副标题**

   ```
   ログイン                              ›
   クラウドで記録を守る
   ```

   新增 i18n key：`settings.loginSubtitle` = `"クラウドで記録を守る"` / `"Back up your diary to the cloud"`

2. **首次打卡后轻量 nudge**（仅未登录用户，仅触发一次）

   打卡保存成功后，底部 Toast：
   > 「記録を守るためにログインしませんか？」

   使用 `AsyncStorage` 记录 `ph_nudge_shown` 标志防止重复显示。

   新增 i18n key：`checkin.backupNudge` = `"記録を守るためにログインしませんか？"`

**验收**：设置页登录行有副标题；首次无登录打卡后显示 toast；再次打卡不重复显示。

---

### P2 — 数据一致性修复（v1.3.0，消除现有 bug）

**目标**：确保账户删除/数据删除操作前后数据状态一致。

**改动文件**：`src/app/(tabs)/settings.tsx`（`handleDeleteData`、`handleDeleteAccount`）

**具体内容**：

1. **`handleDeleteData` — 同步删除 Supabase 数据**

   ```typescript
   // 当前：只清本地
   await AsyncStorage.removeItem('ph_checkin_history');

   // 修复后：先清 Supabase，再清本地
   if (session) {
     await supabase.from('checkin_records').delete().eq('user_id', session.user.id);
   }
   await AsyncStorage.removeItem('ph_checkin_history');
   ```

   注意：P0 完成前 `checkin_records` 表不存在，此步骤在 P0 之后才有实际效果。P2 先做好防御性检查即可。

2. **`handleDeleteAccount` — 原子性删除**

   ```
   当前流程：edge function → (本地清理可能失败) → navigate
   修复流程：edge function → 成功后清本地 → navigate；失败则提示用户重试，不清本地
   ```

3. **Discover tab 打卡逻辑统一**

   评估 `src/app/(tabs)/discover.tsx` 里的 `if (!user?.id)` 阻断。
   若 checkin-wizard 本身不需要登录，则 Discover 的打卡入口也应允许离线使用，或在 checkin-wizard 里统一处理登录引导。

**验收**：deleteData 后 Supabase 侧数据清空（P0 前可 skip）；deleteAccount 失败时本地数据未清空；Discover 打卡逻辑与主流程一致。

---

### P0 — 打卡数据云同步（v1.4.0，核心改造）

**目标**：登录用户的打卡记录自动备份到云端，换机登录可完整恢复。

**工程量**：约 2 周（含图片上传）

#### Supabase Schema

```sql
-- 新表：checkin_records
create table checkin_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  spot_id integer not null,
  season_id text not null,
  photo_url text,          -- Supabase Storage URL (nullable 离线创建时)
  composed_url text,       -- 印章合成后的图片 URL
  timestamp timestamptz not null,
  metadata jsonb,          -- 扩展字段（印章样式、位置等）
  synced_at timestamptz default now(),
  created_at timestamptz default now()
);

-- RLS
alter table checkin_records enable row level security;
create policy "users own records" on checkin_records
  for all using (auth.uid() = user_id);
```

```
Supabase Storage bucket: checkin-photos
  路径规则: {user_id}/{timestamp}_{filename}
  访问控制: private（仅本人可读）
```

#### checkin-store 改造

```
保存流程（新）：
  1. 立即写入 AsyncStorage（保证离线可用）
  2. 若已登录 + 联网：
     a. 上传 composedUri 到 Storage → 获得 composed_url
     b. insert into checkin_records
  3. 若离线：加入 sync_queue（AsyncStorage `ph_sync_queue`），联网后自动重试

登录后恢复流程：
  1. fetch checkin_records where user_id = current_user
  2. 与本地 history merge（timestamp 为主键，去重）
  3. 下载 composed_url → 缓存到本地文件系统
```

#### 冲突策略

- 同一 `timestamp` + `spot_id` 视为同一条记录（幂等）
- 本地优先：离线修改不被服务端数据覆盖
- 删除：软删除（`deleted_at` 字段），不物理删除

#### 改动文件

| 文件 | 改动 |
|------|------|
| `src/stores/checkin-store.ts` | 添加云同步逻辑、sync queue |
| `src/services/checkin-sync.ts` | 新建：上传、拉取、merge 逻辑 |
| `src/services/storage-upload.ts` | 新建：Supabase Storage 上传工具 |
| Supabase migration | 新建 `checkin_records` 表 + RLS |

**验收**：
- 登录状态下打卡 → Supabase 中有记录
- 卸载重装 → 登录后历史恢复
- 离线打卡 → 联网后自动上传（sync queue）
- `npx jest` 全绿

---

### P3 — 跨设备体验（v1.4.0，P0 完成后自动获得）

P0 完成后，以下体验自然实现：
- 换手机登录 → 历史记录完整恢复
- 两台设备共用一个账户（需 realtime subscription 或登录时 pull）

额外工作：登录成功后的 loading 状态（「記録を同期中...」）

---

### P4 — 社交功能完善（v1.5.0，低优先）

依赖 P0（好友之间需要能看到彼此的打卡记录）。

| 改动 | 内容 |
|------|------|
| Social tab 预览 | 未登录用户可见模糊化内容 + 引导登录 CTA |
| 好友打卡可见性 | 选择性公开 `checkin_records`（privacy 字段）|
| 活动 Feed | 好友最近打卡动态 |

---

## 执行优先级总览

| 版本 | 内容 | 工作量 | 前提 |
|------|------|--------|------|
| v1.2.0 | 三 tab UX 重设计（已完成）| — | — |
| v1.3.0 | P1 登录说明文案 + P2 数据一致性 | 2-3 天 | 无 |
| v1.4.0 | P0 打卡云同步（无图片） | 1 周 | Supabase migration |
| v1.4.x | P0 含图片上传 + P3 跨设备 | +1 周 | Storage bucket |
| v1.5.0 | P4 社交完善 | 1-2 周 | P0 |

---

## 关键设计决策

1. **离线优先不变**：所有操作先写本地，云同步是异步补充，永不阻塞 UI
2. **图片存储在 Supabase Storage**：composedUri（印章合成图）是主要存储对象，原始 photoUri 可选上传
3. **timestamp 作为幂等键**：防止重复上传，支持多设备 merge
4. **RLS 行级安全**：用户只能读写自己的数据，无需额外 API 层
