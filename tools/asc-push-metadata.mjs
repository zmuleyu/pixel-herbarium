/**
 * ASC Metadata Push — App Store Connect API
 * Pushes app name, subtitle, description, keywords, URLs for ja-JP locale
 * Uses ES2022 + Node built-in crypto (no external deps)
 */
import { createSign } from 'crypto';
import { readFileSync } from 'fs';
import { homedir } from 'os';

// ── Credentials ──────────────────────────────────────────────────────────────
const KEY_ID      = 'XJHT7346H7';
const ISSUER_ID   = 'd25809ce-3341-4b28-851e-b82de0e92d63';
const APP_ID      = '6760695082';   // ASC numeric App ID
const PRIVATE_KEY = readFileSync(homedir() + '/.appstoreconnect/AuthKey_XJHT7346H7.p8', 'utf8');

// ── Metadata ──────────────────────────────────────────────────────────────────
const METADATA = {
  name:        '花図鉑 — 花めぐりスタンプ帖',
  subtitle:    '花を撮って、スタンプを押そう',
  description: `桜の名所を巡りながら、スタンプ水印つき写真を残していこう。

花図鉑（はなずかん）は、日本各地の花スポットでチェックインして、スタンプ水印つきの思い出写真を作るアプリです。
春は桜、夏は紫陽花、秋は紅葉——季節ごとに変わる花の名所を、あなただけの写真帖に残しましょう。


◆ 桜スポットでチェックイン

日本各地100箇所の花の名所が登録されています。行きたいスポットを選んで、その場で写真を撮ったら、スタンプでチェックイン完了。

上野公園、哲学の道、弘前城、高遠城址——全国の桜名所をめぐる、あなただけの花めぐり旅が始まります。


◆ スタンプ水印つき写真を作る

3つのスタンプスタイルから選べます。

・ピクセル — ドット絵テイストのかわいいスタンプ
・印鑑 — 和風の雅なシヤチハタ風スタンプ
・ミニマル — シンプルでスタイリッシュなラベル

写真の隅にそっと添えるだけで、「ここに来た」という証になります。


◆ フットプリントで振り返る

訪れたスポットの記録がグリッドで並びます。季節ごとに積み重なった思い出を、あとからゆっくり振り返れます。

春はここに行って、夏はあそこで——花めぐりの軌跡が、あなただけの図録になっていきます。


◆ LINE・Instagram・Twitterでシェア

作ったスタンプ写真は、すぐにシェアできます。「今日はここに来たよ」という報告も、スタンプ水印があればひとつ上の写真に。


◆ ゲストモードで、すぐ使える

ログイン不要。ゲストとして今すぐ使えます。Apple Sign Inでアカウントを作れば、記録をクラウドに保存できます。


◆ 花図鉑を選ぶ理由

・完全無料——チェックインも写真生成もシェアも、すべて無料
・広告なし——純粋に花めぐりを楽しめます
・ログイン不要——ゲストモードで即開始
・データのエクスポートとアカウント削除に対応


◆ こんな方におすすめ

- 桜の季節に花の名所を巡りたい方
- お散歩・ハイキングの思い出を形に残したい方
- スタンプラリーや記録が好きな方
- ピクセルアートやレトロなデザインが好きな方
- 家族・友人と花めぐりを楽しみたい方


◆ 主な機能

・花スポットチェックイン — 日本各地100箇所の花の名所
・スタンプ水印つき写真 — ピクセル/印鑑/ミニマルの3スタイル
・フットプリント — 花めぐり履歴グリッド
・写真シェア — LINE / Instagram / Twitter
・季節テーマ — 桜シーズンのカラーとアニメーション
・ゲストモード — ログイン不要ですぐ使える


◆ プライバシー

・位置情報はチェックイン時のみ使用（常時追跡なし）
・データのエクスポートとアカウント削除に対応


桜の季節は、毎年やってきます。
今年の花めぐりを、花図鉑と一緒に残していきましょう。`,
  keywords:        '桜,花めぐり,チェックイン,スタンプ,花スポット,ピクセルアート,写真,散歩,季節,花言葉',
  marketingUrl:    'https://pixel-herbarium.app/',
  supportUrl:      'https://pixel-herbarium.app/support',
  privacyPolicyUrl:'https://pixel-herbarium.app/privacy-policy',
  // Promotional text goes on the version localization (updated without review)
  promotionalText: '🌸 2026年 桜シーズン開幕。日本各地の桜名所でチェックイン、スタンプ水印つき写真を作ろう。完全無料・広告なし。',
};

// ── JWT ───────────────────────────────────────────────────────────────────────
function makeJWT() {
  const header  = Buffer.from(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' })).toString('base64url');
  const now     = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ iss: ISSUER_ID, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' })).toString('base64url');
  const sign    = createSign('SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign({ key: PRIVATE_KEY, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return `${header}.${payload}.${sig}`;
}

// ── HTTP helper ───────────────────────────────────────────────────────────────
async function asc(method, path, body) {
  const url = `https://api.appstoreconnect.apple.com/v1${path}`;
  const opts = {
    method,
    headers: { Authorization: `Bearer ${makeJWT()}`, 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('── Step 1: get app info localizations ──');
  const appInfos = await asc('GET', `/apps/${APP_ID}/appInfos`);
  const liveInfo = appInfos.data.find(i => i.attributes.appStoreState !== 'DEVELOPER_REMOVED') ?? appInfos.data[0];
  console.log('appInfo id:', liveInfo.id, '| state:', liveInfo.attributes.appStoreState);

  const locs = await asc('GET', `/appInfos/${liveInfo.id}/appInfoLocalizations`);
  const jaLoc = locs.data.find(l => l.attributes.locale === 'ja-JP');
  const enLoc = locs.data.find(l => l.attributes.locale === 'en-US');
  console.log('ja-JP localization id:', jaLoc?.id ?? 'NOT FOUND');
  console.log('en-US localization id:', enLoc?.id ?? 'NOT FOUND');

  // Update ja-JP app info localization (name, subtitle, description, keywords, URLs)
  if (jaLoc) {
    console.log('\n── Step 2: update ja-JP app info localization ──');
    await asc('PATCH', `/appInfoLocalizations/${jaLoc.id}`, {
      data: {
        type: 'appInfoLocalizations',
        id: jaLoc.id,
        attributes: {
          name:            METADATA.name,
          subtitle:        METADATA.subtitle,
          privacyPolicyUrl:METADATA.privacyPolicyUrl,
          privacyChoicesUrl: null,
        },
      },
    });
    console.log('✅ ja-JP app info localization updated (name, subtitle, privacyPolicyUrl)');
  }

  console.log('\n── Step 3: get app store version localizations ──');
  const versionsRes = await asc('GET', `/apps/${APP_ID}/appStoreVersions?filter%5BappStoreState%5D=PREPARE_FOR_SUBMISSION,REJECTED,METADATA_REJECTED,WAITING_FOR_REVIEW,DEVELOPER_REJECTED&limit=5`);
  if (!versionsRes.data.length) {
    // Try to get any version
    const allVersions = await asc('GET', `/apps/${APP_ID}/appStoreVersions?limit=5`);
    console.log('Available versions:', allVersions.data.map(v => `${v.id} (${v.attributes.versionString} / ${v.attributes.appStoreState})`));
    if (!allVersions.data.length) { console.log('No versions found'); return; }
    versionsRes.data.push(...allVersions.data);
  }

  const version = versionsRes.data[0];
  console.log('Version:', version.attributes.versionString, '|', version.attributes.appStoreState, '| id:', version.id);

  const vLocRes = await asc('GET', `/appStoreVersions/${version.id}/appStoreVersionLocalizations`);
  const jaVLoc = vLocRes.data.find(l => l.attributes.locale === 'ja-JP');
  console.log('ja-JP version localization id:', jaVLoc?.id ?? 'NOT FOUND');

  if (jaVLoc) {
    console.log('\n── Step 4: update ja-JP version localization (description, keywords, URLs, promo text) ──');
    await asc('PATCH', `/appStoreVersionLocalizations/${jaVLoc.id}`, {
      data: {
        type: 'appStoreVersionLocalizations',
        id: jaVLoc.id,
        attributes: {
          description:     METADATA.description,
          keywords:        METADATA.keywords,
          marketingUrl:    METADATA.marketingUrl,
          supportUrl:      METADATA.supportUrl,
          promotionalText: METADATA.promotionalText,
        },
      },
    });
    console.log('✅ ja-JP version localization updated (description, keywords, URLs, promotionalText)');
  } else {
    console.log('⚠️  ja-JP version localization not found — may need to be created');
  }

  console.log('\n✅ Done. Review at https://appstoreconnect.apple.com');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
