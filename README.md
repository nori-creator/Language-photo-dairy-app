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
- **バックエンド**: Supabase（Auth / Postgres / Storage / **Edge Functions**）。スキーマは `supabase/migrations/0001_init.sql`、AI関数は `supabase/functions/ai/`。
- **外部AI**: **Google Gemini**（写真→単語の識別・意味/例文の生成）を Edge Function 経由で呼び出し。切り抜き・TTSは次フェーズ。

> AI接続が未設定の間は **`src/services/mock.ts` のモック**に自動フォールバック。**APIキー不要でフル機能が動きます**。
> `.env` に Supabase の値を入れると `src/services/index.ts` が実Gemini接続へ自動切替（`src/config.ts`）。

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

開発機は Windows / Android / iPad で完結します。Capture 画面は **実機カメラ**で撮影でき、
「ライブラリから選ぶ」にも対応。AI接続が未設定でも、撮影フロー自体はモックで最後まで動きます。

## 実AI接続の手順（Google Gemini × Supabase）

APIキーは**アプリに埋め込まず**、Supabase Edge Function のシークレットに置きます。アプリは公開しても
安全な Supabase URL / anon キーだけを知り、Gemini キーには一切触れません。

1. **Gemini APIキー**を [Google AI Studio](https://aistudio.google.com/apikey) で発行（`AIza…`）。
2. **Supabase プロジェクト**を作成し、DBスキーマを適用：
   ```bash
   npm i -g supabase
   supabase link --project-ref <your-project-ref>
   supabase db push                       # supabase/migrations を適用
   ```
3. **Edge Function をデプロイ**し、各キーをサーバー側シークレットに設定：
   ```bash
   supabase functions deploy ai --no-verify-jwt
   supabase secrets set GEMINI_API_KEY=<あなたの新しいGeminiキー>
   # 任意：物体の切り抜き（背景除去）を有効化する場合
   supabase secrets set REMOVEBG_API_KEY=<remove.bgの無料APIキー>
   ```
   - 使用モデルは既定で **`gemini-2.5-flash-lite`**（無料枠が最大）。`supabase secrets set GEMINI_MODEL=...` で上書き可。
   - `REMOVEBG_API_KEY` 未設定時は切り抜きをスキップし、撮った写真をそのままカード画像に使用。
4. **アプリの環境変数**を設定（`.env.example` をコピー）：
   ```bash
   cp .env.example .env
   # .env に Supabase の URL と anon キーを記入（Supabase 管理画面 → Settings → API）
   ```
5. `npx expo start -c` で再起動。`EXPO_PUBLIC_SUPABASE_URL` が設定されていれば、
   `src/services/index.ts` が自動で **実 Gemini 接続**に切り替わります（未設定ならモックのまま）。

> identify（写真→単語）・enrich（意味/例文）・cutout（remove.bg背景除去）が実API。発音TTSは次フェーズ。

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
