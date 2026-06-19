# Lexilog — 写真フォト日記 × 単語学習アプリ

出会ったものを**写真に撮るだけ**で、意味・発音・例文が手に入り、ポケモンカードのように
コレクションでき、その日撮ったカードが**1日のフォト日記**になる——「辞書 × フラッシュカードの進化版」。

> コンセプト：単語を覚えるために「調べる→カードを作る→写真を添付する」手間をゼロにする。
> 見たものを撮るだけで文脈ごと記憶でき、撮るたびに間隔反復（SRS）が自然に効く。

## なぜ作るか

- 既存フラッシュカードは SRS が正しくても**文脈・物語がなく開くのが苦痛**。
- 語学日記は**何を書けばいいか分からず続かない**。
- → すでに毎日やっている「写真を撮る」に学習を乗せ、両方を解決する。

## 主な機能（MVP）

| 機能 | 説明 |
|---|---|
| 撮る → 候補確認 | 撮影すると AI が被写体を分析し、**母語訳つきの候補**を提示。違えば手動入力。 |
| 「ゲット！」演出 | 取得時にポケモン捕獲風アニメ（光る→カード化）＋触覚フィードバック。 |
| カード（裏面充実） | 意味・品詞・IPA・語彙レベル（辞書＝正）＋ 例文・コロケーション・類義語・反意語・語源・ひとこと（AI）＋ネイティブ発音。タップでフリップ。 |
| 図鑑（Pokédex） | ジャンル別グリッド。未取得語は「？」表示で外出・撮影を促す。 |
| フォト日記 | その日のカードがアルバム風に貼られた1ページに。 |
| 隠れSRS復習 | 「まだ覚えてる？」形式。**忘れるほど写真がぼやけて消える**（喪失回避）。 |
| ストリーク / 進捗 | 連続日数、資格（例: TOCFL）必要語数への到達度を可視化。 |
| 無料プランの制限 | 1日の取得枚数に上限。上限時はアップグレード導線。 |

## 技術スタック

- **アプリ**: React Native + **Expo**（TypeScript / expo-router）— 1コードで iOS/Android、**Mac なしで iOS ビルド可**。
- **デザイン**: Apple HIG 準拠の自前デザインシステム（`src/theme`：SFタイプランプ＋iOSシステムカラー、ライト/ダーク対応）。
- **バックエンド（予定）**: Supabase（Auth / Postgres / Storage / Edge Functions）。スキーマは `supabase/migrations/0001_init.sql`。
- **外部API（予定・Edge Function経由）**: 切り抜き（BiRefNet等）/ Claude（識別・enrich）/ Google・Azure TTS（発音）。

> 現状、外部APIはすべて **`src/services/mock.ts` のモック**に接続。**APIキー不要でフル機能が動きます**。

## ディレクトリ構成

```
app/                       expo-router 画面
  (tabs)/ index, dex, capture, review, profile
  card/[id]                カード詳細（フリップ）
src/
  theme/                   Apple風デザイントークン
  types/                   ドメイン型
  lib/                     srs(SM-2) / streak / quota（純粋ロジック＋テスト）
  services/                identify/cutout/enrich/tts の契約＋モック
  data/                    カテゴリ・シードデータ
  store/                   アプリ状態（React Context）
  components/              AppText / Sticker / VocabCardView / GotchaOverlay …
supabase/migrations/       DBスキーマ（RLS付き）
```

## 動かし方

```bash
npm install
npm start            # Expo Dev Server。表示されたQRを…
                     #  - Android: Expo Go アプリで読み取り
                     #  - iPad/iPhone: カメラ or Expo Go で読み取り
npm run web          # ブラウザでプレビュー
npm test             # SRS/streak/quota のユニットテスト
npm run typecheck    # 型チェック
```

開発機は Windows / Android / iPad で完結します（モックのため実機カメラやキー不要）。
Capture 画面はデモ用に被写体（🍎🐶☕🚏）をタップして撮影フローを再現します。

## 実APIへの差し替え（キー取得後）

1. Supabase プロジェクト作成 → `supabase/migrations/0001_init.sql` を適用。
2. Edge Functions（`identify` / `cutout` / `enrich` / `tts`）をデプロイし、各APIキーを Function のシークレットに設定。
3. `src/services/index.ts` のバインディングをモックから実クライアントに差し替え。

キーはクライアントに置かず、必ず Edge Function 経由で呼びます。

## iOS ビルド（Mac 不要）

```bash
npm i -g eas-cli
eas build -p ios      # クラウドビルド → .ipa を生成
eas build -p android  # Android も同様
```
TestFlight 配布で iPad/iPhone 実機検証が可能です（要 Apple Developer アカウント）。

## ロードマップ

- **Phase 1（現在）**: 個人完結のMVP（本リポジトリ）。
- **Phase 2**: 実API接続、プッシュ通知（前日の学習時間に合わせた翌日リマインダー）。
- **Phase 3**: 未取得語レコメンド、Googleマップ連携の位置情報リマインダー、資格別語彙。
- **Phase 4**: 社会機能（共有フィード／ストーリー）。
- **Phase 5**: 課金（サブスク）、企業・自治体コラボイベント。
