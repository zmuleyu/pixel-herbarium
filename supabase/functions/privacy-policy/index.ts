/**
 * privacy-policy
 * Serves the Japanese privacy policy for 花めぐり (Pixel Herbarium).
 * URL: https://uwdgnueaycatmkzkbxwo.supabase.co/functions/v1/privacy-policy
 */
Deno.serve(() => {
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>プライバシーポリシー — 花めぐり</title>
<style>
  body { font-family: -apple-system, 'Hiragino Sans', sans-serif; max-width: 720px; margin: 0 auto; padding: 24px 16px; color: #3a3a3a; line-height: 1.8; background: #faf9f6; }
  h1 { font-size: 1.4rem; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
  h2 { font-size: 1.1rem; margin-top: 2em; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 0.9rem; }
  th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
  th { background: #f0ede8; }
  p, li { font-size: 0.95rem; }
  .updated { color: #888; font-size: 0.85rem; }
</style>
</head>
<body>
<h1>プライバシーポリシー</h1>
<p><strong>花めぐり（Pixel Herbarium）</strong></p>
<p class="updated">最終更新日：2026年3月19日</p>

<h2>はじめに</h2>
<p>花めぐり（以下「本アプリ」）は、季節の植物を発見・記録するモバイルアプリです。本ポリシーでは、本アプリが収集する情報とその利用方法について説明します。</p>

<h2>1. 収集する情報</h2>
<h3>1-1. アカウント情報</h3>
<table>
  <tr><th>サインイン方法</th><th>取得する情報</th></tr>
  <tr><td>Apple でサインイン</td><td>Apple が提供する匿名ユーザーID、メールアドレス（任意）</td></tr>
  <tr><td>メールアドレスでサインイン</td><td>メールアドレス、パスワード（ハッシュ化して保存）</td></tr>
  <tr><td>LINE でサインイン</td><td>LINE ユーザーID（line_uid）、表示名、プロフィール画像URL、メールアドレス（LINE アカウントに設定されている場合）</td></tr>
</table>

<h3>1-2. 位置情報</h3>
<p>植物の発見記録に使用するため、本アプリは端末の位置情報（GPS）を取得します。位置情報は、発見地点の都道府県判定および地図表示にのみ使用します。アプリを使用していないときは位置情報を取得しません。</p>

<h3>1-3. 利用履歴</h3>
<p>サービス改善のため、植物の発見記録、花束の作成・送受信記録、スポット訪問記録を収集します。これらの情報はアプリの機能提供にのみ使用し、広告目的には使用しません。</p>

<h2>2. 情報の利用目的</h2>
<p>収集した情報は以下の目的にのみ使用します：</p>
<ul>
  <li>アカウントの作成・管理・認証</li>
  <li>植物発見記録・スポット情報の保存と表示</li>
  <li>フレンド機能・花束の送受信</li>
  <li>季節の花に関するプッシュ通知（同意した場合のみ）</li>
  <li>サービスの改善・不具合の修正</li>
</ul>

<h2>3. 情報の保管</h2>
<p>収集した情報は Supabase（アイルランド・EU）のサーバーに保管されます。データはSSL/TLSで暗号化されて転送されます。</p>

<h2>4. 情報の共有</h2>
<p>法令に基づく開示が必要な場合を除き、収集した情報を第三者に販売・貸与・提供することはありません。</p>
<table>
  <tr><th>サービス</th><th>用途</th><th>プライバシーポリシー</th></tr>
  <tr><td>Supabase</td><td>データベース・認証</td><td>supabase.com/privacy</td></tr>
  <tr><td>LINE Corporation</td><td>LINE ログイン</td><td>line.me/ja/terms/policy</td></tr>
  <tr><td>Apple</td><td>Apple サインイン</td><td>apple.com/legal/privacy</td></tr>
</table>

<h2>5. データの削除</h2>
<p>アカウントを削除すると、以下のデータがすべて削除されます：</p>
<ul>
  <li>プロフィール情報（表示名、アバターなど）</li>
  <li>植物の発見記録</li>
  <li>LINE ユーザーID（line_uid）の紐付け</li>
  <li>送受信した花束・フレンド関係</li>
</ul>
<p>アカウント削除はアプリ内の <strong>マイページ → 設定 → プライバシー設定 → アカウント削除</strong> から申請できます。削除申請から30日後に完全に削除されます。</p>
<p>LINE ログインとの連携解除は、LINE アプリの <strong>設定 → アカウント → 連携アプリ</strong> からも行えます。</p>

<h2>6. お子様のプライバシー</h2>
<p>本アプリは13歳未満のお子様を対象としていません。13歳未満の方の個人情報が収集されていることが判明した場合は、速やかに削除します。</p>

<h2>7. ポリシーの変更</h2>
<p>本ポリシーは予告なく変更することがあります。重要な変更がある場合は、アプリ内でお知らせします。</p>

<h2>8. お問い合わせ</h2>
<p>本ポリシーに関するご質問は、以下のメールアドレスまでお問い合わせください。</p>
<p><strong>cbnium@protonmail.com</strong></p>

<hr>
<p style="font-size:0.8rem;color:#999">本ポリシーは日本の個人情報の保護に関する法律（個人情報保護法）に準拠します。</p>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
});
