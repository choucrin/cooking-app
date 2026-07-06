# 今日の献立 — 冷蔵庫の食材からレシピ提案アプリ

自宅にある食材・調味料を登録しておくと、Claude（Anthropic API）がそれらを使ったレシピを提案してくれる Web アプリです。作ったレシピはライブラリに保存され、カレンダーからいつ何を作ったか振り返ることができます。

## 主な機能

| 機能 | 内容 |
|---|---|
| 食材・調味料の登録 | 「野菜」「果物」「肉」「卵・乳製品」「その他」「調味料」に分類して登録。在庫数と「買い足し可」フラグを管理 |
| レシピ提案 | 在庫あり／買い足し可の食材から選択 → Claude API が料理名・材料と分量・具体的な手順・1人分の栄養成分（エネルギー・たんぱく質・脂質・炭水化物・食塩相当量）を提案（調味料は登録済みのものが自動的にすべて使用可能） |
| レシピライブラリ | 「作った」を選んだレシピを保存。使用食材で検索可能 |
| カレンダー記録 | 「作った」を選ぶと当日の日付に自動記録。カレンダーから日付ジャンプで過去のレシピを閲覧 |
| アクセス制限 | 共通パスワードによる簡易ログイン。URL を知っているだけの第三者が Claude API 利用枠を消費したりデータを閲覧・編集したりできないようにする |

## 技術スタック

- **Next.js 16 (App Router) + TypeScript** — フロントエンド／APIルート共通
- **Tailwind CSS v4** — スタイリング
- **Prisma 7 + PostgreSQL** — データ永続化（`@prisma/adapter-pg` 経由）
- **Anthropic SDK (`@anthropic-ai/sdk`)** — レシピ提案（Claude API, tool use による構造化出力）
- **Vercel** — ホスティング想定

## データベースについて（提案）

iPhone / Windows の両方から同じデータを見られる必要があるため、**ローカルストレージではなくクラウド上の共有 DB** が必須です。個人利用規模のデータ量（食材マスタ＋レシピ履歴）であれば、以下のいずれかの「サーバーレス PostgreSQL」が最適です。いずれも無料枠があり、Vercel との相性が良いものを選んでいます。

- **Vercel Postgres (Neon)**［推奨］— Vercel ダッシュボードから数クリックで作成でき、環境変数が自動連携される
- **Neon** を直接使う — Vercel 連携なしで単体利用も可能。無料枠が大きい
- **Supabase** — 将来的にユーザー認証や画像アップロードを追加したくなった場合に拡張しやすい

本アプリは Prisma の driver adapters（`@prisma/adapter-pg`）を使っており、標準的な `postgres://` 接続文字列であればどのサービスでも動作します。迷ったら **Vercel Postgres (Neon)** を選んでください。

### スキーマ概要（`prisma/schema.prisma`）

- `Ingredient` — 食材・調味料マスタ（`category`, `stock`, `canBuy`）
- `Recipe` — 保存済みレシピ（材料は `Json` で保存し、検索用に `ingredientNames: String[]` を別途保持。`cookedAt` が作った日付＝カレンダーのキー）

Claude が都度提案するレシピ（保存前）は DB に保存せず、ユーザーが「作った」を選んだ時点で初めて `Recipe` として永続化します。

---

## セットアップ手順

### 1. 前提

- Node.js 20 以上
- PostgreSQL データベース（後述の「データベースについて」を参照）
- Anthropic の API キー（後述）

### 2. 依存関係のインストール

```bash
npm install
```

（`postinstall` で `prisma generate` が自動実行されます）

### 3. 環境変数の設定

`.env.example` をコピーして `.env.local` を作成します。

```bash
cp .env.example .env.local
```

`.env.local` の中身：

```
DATABASE_URL="postgres://user:password@host:5432/dbname?sslmode=require"
ANTHROPIC_API_KEY="sk-ant-xxxxxxxx"
ANTHROPIC_MODEL="claude-sonnet-5"
APP_PASSWORD="好きなパスワードを設定"
```

#### `DATABASE_URL` の取得方法（Vercel Postgres / Neon の例）

1. [Vercel ダッシュボード](https://vercel.com/dashboard) → 対象プロジェクト → **Storage** タブ → **Create Database** → **Postgres (Neon)** を選択
2. 作成後に表示される接続情報から `DATABASE_URL`（`postgres://...` 形式、`sslmode=require` 付き）をコピー
3. ローカル開発用に `.env.local` に貼り付け（本番用は後述の「Vercelへのデプロイ」でVercel側に設定します）

#### `ANTHROPIC_API_KEY` の取得方法

1. [Anthropic Console](https://console.anthropic.com/) にログイン（アカウントがなければ作成）
2. 左メニューの **API Keys** から **Create Key** を選択し、キーを発行
3. 発行したキーを `.env.local` の `ANTHROPIC_API_KEY` に貼り付け

利用するモデルは `ANTHROPIC_MODEL` で切り替えられます（未設定時は `claude-sonnet-5`）。Anthropic Console の Billing 設定でクレジットを追加しておく必要があります。

#### `APP_PASSWORD`（アクセス制限）について

このアプリは URL さえ知っていれば誰でもアクセスできてしまうため、`APP_PASSWORD` に十分に推測されにくい文字列を設定してください。ログイン画面でこのパスワードを入力すると、以後30日間有効なセッションCookieが発行されます。

- `src/proxy.ts`（Next.js の Proxy／旧 Middleware）が全ページ・全APIへのアクセスをチェックし、未ログインなら `/login` にリダイレクト（APIの場合は401を返却）します
- **パスワードを変更すると、発行済みの全セッションが即座に無効化されます**（全端末で再ログインが必要になります）。第三者にパスワードが漏れた疑いがある場合は、`APP_PASSWORD` を変更して再デプロイしてください
- 追加の安全策として、[Anthropic Console](https://console.anthropic.com/settings/limits) で API キーの使用上限（Spend Limit）を設定しておくことを推奨します

### 4. データベースにテーブルを作成

```bash
npx prisma migrate deploy
```

`prisma/migrations` にあるマイグレーションが適用され、`Ingredient` / `Recipe` テーブルが作成されます。

### 5. ローカルで起動

```bash
npm run dev
```

`http://localhost:3000` にアクセスして動作を確認してください。

---

## Vercel へのデプロイ

1. **データベースを用意する**（上記「`DATABASE_URL` の取得方法」参照。まだ作っていなければ Vercel の Storage タブから作成すると、環境変数が自動でプロジェクトに紐づきます）
2. **リポジトリを Vercel に接続する**（GitHub 等に push した上で Vercel の *Add New Project* からインポート、または `vercel` CLI を利用）
3. **環境変数を設定する** — Vercel プロジェクトの **Settings → Environment Variables** で以下を登録（Production / Preview / Development すべてに設定推奨）
   - `DATABASE_URL`（Storage 連携済みなら自動設定済み）
   - `ANTHROPIC_API_KEY`
   - `ANTHROPIC_MODEL`（任意、省略可）
   - `APP_PASSWORD`（第三者による無断利用を防ぐための必須設定。上記「`APP_PASSWORD`（アクセス制限）について」を参照）
4. **マイグレーションを本番 DB に適用する** — 初回デプロイ前後に、ローカルから本番 `DATABASE_URL` を指定して1回実行します
   ```bash
   DATABASE_URL="（本番の接続文字列）" npx prisma migrate deploy
   ```
   （`vercel env pull .env.production.local` で本番の環境変数を取得してから実行すると楽です）
5. **デプロイ** — Git push で自動デプロイ、または `vercel --prod`

以降、`prisma/schema.prisma` を変更した場合は `npx prisma migrate dev --name <変更内容>` でマイグレーションファイルを作成し、コミット後にデプロイ前後で本番 DB に対して `npx prisma migrate deploy` を実行してください。

## iPhone / Windows でのデータ共有について

本アプリはクラウド DB を使う通常の Web アプリのため、**iPhone の Safari／Windows のブラウザどちらからアクセスしても同じデータ**を見ることができます（同一の Vercel URL を開くだけです）。特別なアプリインストールは不要ですが、iPhone では Safari の共有メニューから「ホーム画面に追加」するとアプリのように使えます。

複数人・複数端末から同時に使う場合でも、DB が共有されているため登録した食材やレシピはすぐに反映されます。全ページ・全APIが `APP_PASSWORD` による共通パスワード認証で保護されているため、家族内など特定のメンバーだけで安全に共有できます（各端末で最初の1回だけログインすれば、以後30日間はログイン状態が保たれます）。

---

## ディレクトリ構成（抜粋）

```
src/
  proxy.ts                    # 全ページ/APIの認証チェック（旧middleware）
  app/
    page.tsx                 # トップページ
    login/page.tsx           # ログイン画面
    ingredients/page.tsx     # 食材・調味料登録画面
    suggest/page.tsx         # レシピ提案画面
    library/page.tsx         # レシピライブラリ画面
    calendar/page.tsx        # カレンダー画面
    api/
      auth/                  # ログイン・ログアウトAPI
      ingredients/           # 食材CRUD API
      recipes/               # レシピ保存・検索・削除API
      suggest/               # Claude APIを呼び出すレシピ提案API
  lib/
    prisma.ts                # Prisma Client（driver adapter設定）
    anthropic.ts             # Anthropic Clientラッパー
    auth.ts                  # セッショントークンの発行・検証
    types.ts                 # 共通の型・カテゴリ定義
prisma/
  schema.prisma              # DBスキーマ定義
  migrations/                # マイグレーション履歴
```

## 主なコマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番ビルドの起動（ローカル確認用） |
| `npm run db:migrate` | 本番/検証DBへマイグレーション適用（`prisma migrate deploy`） |
| `npm run db:studio` | Prisma Studio（DBの中身をGUIで確認） |
| `npx prisma migrate dev --name <name>` | スキーマ変更時にマイグレーションファイルを作成 |
