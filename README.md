# 今日の献立 — 自分だけのレシピノート

自宅にある食材・調味料の在庫を管理しながら、自分で考えたレシピを工程ごとに記録できる Web アプリです。使った食材・調味料は登録済みの一覧から選んでタグ付けして保存しておくことで、あとから食材名で検索したり、カレンダーからいつ何を作ったか振り返ったりできます。

> 以前のバージョンではClaude(Anthropic API)によるレシピ自動提案機能とVercel + PostgreSQLでの運用を想定していましたが、本バージョンではAI機能を廃止し、**GitHub Pages（静的ホスティング）+ Firebase（認証・データベース）** による構成に全面的に作り直しています。レシピは手動で執筆・登録する運用になりました。

## 主な機能

| 機能 | 内容 |
|---|---|
| 食材・調味料の登録 | 「野菜」「果物」「肉」「卵・乳製品」「その他」「調味料」に分類して登録（デフォルトのジャンルにないものは登録画面から自由に新しいジャンルを追加できる）。在庫数と「買い足し可」フラグを管理。同名の食材・調味料は重複登録できない。よみがな（ひらがな）を登録しておくと、レシピ作成時にひらがな入力だけで漢字・カタカナ名の食材を検索できる |
| レシピを書く | 料理名・作った日を記録し、使った「食材」「調味料」をそれぞれ別枠で登録済みの一覧から選択式で登録。材料入力欄に単語を打つと候補を絞り込める（ひらがな入力でも、登録済みのよみがなやカタカナ名を自動で正規化して一致させる）。一覧にないものは「その他」からその場で新規登録でき、食材管理にも自動で追加される（同名の重複登録は行われない）。作り方は1. 2. 3. ...と工程ごとに分けて記録できる |
| レシピライブラリ | 書いたレシピを保存。料理名・食材名のテキスト検索に加え、登録済みの食材一覧から選んで絞り込む検索もできる。「作った日」はレシピごとに複数登録・削除でき、内容の閲覧・編集・削除も可能 |
| カレンダー記録 | レシピに登録された「作った日」（複数可）を基準に、カレンダーの該当日すべてにレシピが表示される。日付をクリックしてその日のレシピにジャンプできる |
| ログイン | Firebase Authentication（メール/パスワード）による認証。サインアップ画面は用意していないため、利用者はFirebase Console側で管理者が作成する想定 |

## 技術スタック

- **Next.js 16 (App Router) + TypeScript** — `output: "export"` による完全な静的サイト生成
- **Tailwind CSS v4** — スタイリング
- **Firebase Authentication** — ログイン機能
- **Cloud Firestore** — 食材・レシピデータの保存（リアルタイム同期）
- **GitHub Pages + GitHub Actions** — ホスティングと自動デプロイ

## アーキテクチャと認証まわりの考え方

このアプリは**完全な静的サイト**としてビルドされ、サーバーサイドのAPIやミドルウェアは一切持ちません（GitHub PagesはHTML/CSS/JSを配信するだけのホスティングのため、サーバーサイド処理ができません）。そのため：

- 全データの読み書きは、ブラウザから直接 Firebase（Authentication / Firestore）へアクセスする形になります。
- ログインしていないユーザーを `/login` へリダイレクトする処理はアプリのJavaScript（クライアントサイド）で行っていますが、これは**あくまでUX上の制御**です。実際のアクセス制御（第三者にデータを読み書きされないようにする本当の防御線）は **Firestore セキュリティルール（`firestore.rules`）+ Firebase Authentication** が担っています。
- `firestore.rules` はログイン済みユーザー（`request.auth != null`）のみ読み書きを許可する設定にしてあります。Firebase Console の Firestore → ルール タブに貼り付けてデプロイしてください。

### データモデル（Firestore）

- `ingredients` コレクション — `{ name, category, reading, stock, canBuy, createdAt, updatedAt }`
  - `category` は固定の列挙型ではなく自由入力の文字列（値がそのまま表示ラベルになる）。「調味料」だけは特別扱いで在庫・買い足し可を持たない
  - `reading` は検索用のよみがな（ひらがな、任意項目）。登録画面でのみ入力・自動提案され（カタカナ名は自動変換、漢字名はIME変換前のひらがな入力をそのまま採用）、レシピ作成時の材料検索にのみ使われる（食材一覧には表示されない）
  - 同名（大文字・小文字を区別しない）の食材・調味料は登録できない
  - レシピ作成画面で「その他」から新規の食材・調味料名を入力すると、保存時にここへ自動追加される（`category` は食材なら `その他`、調味料なら `調味料` で仮登録され、在庫数やジャンルなどは後から食材管理画面で調整できる。既存と同名の場合は追加登録されず既存のものが使われる）
- `recipes` コレクション — `{ title, ingredients: [{name, amount}], seasonings: [{name, amount}], steps: string[], ingredientNames: string[], cookedDates: Timestamp[], createdAt, updatedAt }`
  - `ingredients` は食材、`seasonings` は調味料（別枠で登録）
  - `steps` は作り方を工程ごとに分けた配列（表示時に1. 2. 3. ...と自動採番される）
  - `ingredientNames` は検索用に食材・調味料の名前だけを平坦化した配列
  - `cookedDates` は「作った日」の配列（複数可）。カレンダー表示ではこの配列に含まれる全ての日付にレシピが表示される。ライブラリ画面から追加・削除できる

---

## セットアップ手順

### 1. 前提

- Node.js 20 以上
- GitHubアカウント（GitHub Pagesでの公開に使用）
- Firebaseアカウント（無料のSparkプランで動作します）

### 2. Firebaseプロジェクトの準備

> より詳しい手順・スクリーンショット相当の説明・日常運用（ユーザー追加/削除、トラブル対応など）は [docs/FIREBASE_GUIDE.md](docs/FIREBASE_GUIDE.md) にまとめています。迷ったらこちらを参照してください。

1. [Firebase Console](https://console.firebase.google.com/) で新しいプロジェクトを作成
2. **Authentication** → 「Sign-in method」で **メール/パスワード** プロバイダを有効化
3. **Authentication** → 「Users」タブから、利用する家族・自分のメールアドレスでユーザーを手動作成（サインアップ画面は用意していないため、ここで作成したアカウントでのみログインできます）
4. **Firestore Database** を作成（本番モードで作成してOK。アクセス制御は後述のセキュリティルールで行います）
5. プロジェクトの設定 → 全般 → 「マイアプリ」から **ウェブアプリを追加**し、表示される `firebaseConfig` の値（`apiKey` 等）を控えておく
6. Firestore → ルール タブに、リポジトリ内の `firestore.rules` の内容を貼り付けて公開（または [Firebase CLI](https://firebase.google.com/docs/cli) を導入済みなら `firebase deploy --only firestore:rules` でも可）

### 3. ローカル開発環境

```bash
npm install
cp .env.example .env.local
```

`.env.local` に、手順2-5で控えた値を設定します。

```
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."
```

これらは `NEXT_PUBLIC_` から始まる、ブラウザに公開される設定値です（機密情報ではありません。実際のアクセス制御はFirestoreセキュリティルール側で行われます）。

```bash
npm run dev
```

`http://localhost:3000` にアクセスし、手順2-3で作成したアカウントでログインして動作を確認してください。

### 4. GitHub Pagesへのデプロイ

1. このリポジトリをGitHubにpush
2. リポジトリの **Settings → Pages** で、Source を **GitHub Actions** に設定
3. **Settings → Secrets and variables → Actions** で、以下のRepository secretsを登録
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
4. `main` ブランチにpushすると `.github/workflows/deploy.yml` が自動的にビルド・デプロイします（手動実行したい場合はActionsタブから `workflow_dispatch` で実行可能）
5. **重要:** Firebase Console → Authentication → Settings → 承認済みドメイン に、公開されるGitHub PagesのドメインURL(例: `<user>.github.io`)を追加してください。これを忘れると、本番環境でのログイン時に `auth/unauthorized-domain` エラーになります。

デプロイ後、`https://<user>.github.io/<repo>/` でアプリにアクセスできます。

#### サブパスについて

GitHub Pagesのプロジェクトサイト（`<user>.github.io/<repo>/` 形式）で公開する場合、Next.jsのビルドに `NEXT_PUBLIC_BASE_PATH=/<repo>` が必要です。`.github/workflows/deploy.yml` では自動的にリポジトリ名を使って設定しているため、通常は何もする必要はありません。

カスタムドメインや `<user>.github.io` リポジトリ本体（ユーザー/組織ルートサイト）で公開する場合は、`.github/workflows/deploy.yml` 内の `NEXT_PUBLIC_BASE_PATH` の行を削除するか空文字にしてください。

### 5. テストモード（ログイン画面のスキップ）

Firebaseの実プロジェクトをまだ用意していない場合や、ログイン操作を省いて画面・操作感だけを素早く確認したい場合のために、ログインゲートをスキップする「テストモード」を用意しています。

```bash
npm run build:test   # ログインバイパス版でビルド
npm run serve        # out/ をローカル配信
```

`npm run build:test`（`scripts/build-test.mjs`）は、ビルド直前だけ `src/components/AuthGate.tsx` をログインバイパス版（`AuthGate.testmode.tsx`）に一時的に差し替えてビルドし、**ビルドの成功・失敗・Ctrl+Cによる中断を問わず必ず元のファイルに復元**します。テストモードでビルドすると、画面上部に「⚠ テストモード」というオレンジ色のバナーが表示され、ログインなしで全ページに直接アクセスできます（Firestoreへの実際の読み書きは、`.env.local` に設定した接続先が有効な場合のみ動作します）。

このスクリプトを使わない通常の `npm run build`（本番デプロイもこちらを使用）では、`src/components/AuthGate.tsx` は常にログインバイパスを含まない本来の実装のままなので、テスト用のコードが本番ビルドに混入することはありません。

---

## iPhone / Windows でのデータ共有について

Firebase（Authentication + Firestore）を使ったクラウド同期のため、iPhoneのSafari・WindowsのブラウザどちらからGitHub PagesのURLにアクセスしても、ログインすれば同じデータを見ることができます。Firestoreはリアルタイム同期のため、片方の端末で登録・編集した内容はほぼ即座にもう片方にも反映されます。

### iPhoneでアプリのように使う（ホーム画面に追加）

1. iPhoneのSafariでアプリのURLを開く
2. 共有メニュー（下部中央の四角に上矢印のアイコン）→「ホーム画面に追加」
3. ホーム画面に専用アイコンが追加され、タップするとSafariのアドレスバー等がない全画面表示（スタンドアロンモード）で起動する

アプリ用のアイコン（`public/apple-icon.png` 等）とWeb App Manifest（`public/manifest.json`）をあらかじめ用意してあるため、追加の設定は不要です。

---

## ディレクトリ構成（抜粋）

```
src/
  app/
    page.tsx                     # トップページ
    login/                       # ログイン画面（Firebase Auth）
    ingredients/page.tsx         # 食材・調味料登録画面
    recipes/new/                 # レシピ作成・編集画面
    library/page.tsx             # レシピライブラリ画面（Suspenseラッパー）
    library/LibraryView.tsx      # ライブラリ本体（検索・一覧・編集/削除）
    library/pick-ingredients/    # 食材選択による検索画面
    calendar/page.tsx            # カレンダー画面
  components/
    AuthGate.tsx                 # 未ログイン時のリダイレクト制御
    NavBar.tsx                    # ナビゲーション・ログアウト
    MaterialRowsEditor.tsx        # 食材/調味料の検索付き選択式行入力（＋その他で新規登録）
    StepsEditor.tsx                # 作り方を工程ごとに入力するエディタ
    RecipeDetail.tsx                # 食材・調味料・工程の表示（ライブラリ/カレンダー共通）
    CookedDatesEditor.tsx           # 「作った日」を複数管理するUI（ライブラリで使用）
  lib/
    firebase.ts                   # Firebase初期化（Auth / Firestore）
    AuthContext.tsx                # ログイン状態を配信するReact Context
    useIngredients.ts               # 食材データのリアルタイム購読フック
    useRecipes.ts                    # レシピデータのリアルタイム購読フック
    types.ts                         # 共通の型・カテゴリ定義
firestore.rules                   # Firestoreセキュリティルール
firebase.json                      # Firebase CLI設定（ルールのデプロイ用）
.github/workflows/deploy.yml       # GitHub Pages自動デプロイワークフロー
```

## 主なコマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 静的サイトのビルド（`out/` ディレクトリに出力） |
| `npm run serve` | ビルド済みの `out/` を `serve` パッケージでローカル配信し、本番相当の静的ファイルを確認 |
| `npm run lint` | ESLint実行 |

## Firebaseの運用手順書

Firebaseプロジェクトの初回セットアップから、ユーザーの追加・削除、データの確認・修正、トラブルシューティングまでを1つにまとめた手順書を用意しています。

👉 [docs/FIREBASE_GUIDE.md](docs/FIREBASE_GUIDE.md)
