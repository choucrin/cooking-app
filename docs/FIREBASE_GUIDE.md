# Firebase 運用手順書

このアプリのログイン(Firebase Authentication)とデータ保存(Cloud Firestore)を管理するための手順書です。初回セットアップと、その後の日常的な運用(ユーザー管理・データ確認・トラブル対応)の両方をまとめています。

対象読者: このアプリのFirebaseプロジェクトを管理する人(自分や家族内の管理者)。

---

## 目次

1. [初回セットアップ](#1-初回セットアップ)
2. [GitHub側の設定](#2-github側の設定)
3. [日常運用](#3-日常運用)
4. [トラブルシューティング](#4-トラブルシューティング)
5. [セキュリティ運用の考え方](#5-セキュリティ運用の考え方)

---

## 1. 初回セットアップ

### 1-1. Firebaseプロジェクトの作成

1. https://console.firebase.google.com/ にアクセスし、Googleアカウントでログイン
2. 「プロジェクトを追加」→ プロジェクト名を入力(例: `cooking-app`)→ 作成
3. Google Analyticsの設定を聞かれた場合は「オフ」で問題ありません(このアプリでは使用しません)

### 1-2. Authentication(ログイン機能)の有効化

1. 左メニューから **Authentication** を選択 → 「始める」
2. 「Sign-in method」タブ → プロバイダ一覧から **メール/パスワード** を選択 → 有効にする → 保存

### 1-3. ログインユーザーの作成

このアプリにはサインアップ(新規登録)画面がありません。使う人のアカウントは管理者がConsole側で手動作成します。

1. **Authentication → Users** タブ → 「ユーザーを追加」
2. メールアドレスとパスワードを入力して追加
3. 家族など複数人で使う場合は、人数分繰り返す

> 💡 パスワードは各自Consoleで後から変更・リセットできます(→ [4-1](#4-1-パスワードを忘れた再設定したい))。

### 1-4. Firestore Database の作成

1. 左メニューから **Firestore Database** → 「データベースの作成」
2. ロケーションを選択(例: `asia-northeast1`(東京)。一度決めたら変更できないので注意)
3. セキュリティルールは「本番環境モード」で作成して問題ありません(次の手順で正しいルールを上書きします)

### 1-5. セキュリティルールの適用

1. **Firestore Database → ルール** タブを開く
2. リポジトリ内の `firestore.rules` の中身を全文コピーして貼り付け
3. 「公開」をクリック

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

このルールは「ログイン済みユーザーのみ読み書き可能」という設定です。**これがこのアプリの実質的なセキュリティの要**です(詳しくは[5章](#5-セキュリティ運用の考え方)参照)。

### 1-6. ウェブアプリを登録して接続情報を取得

1. プロジェクトの概要ページ(歯車アイコン → プロジェクトの設定)→ 「全般」タブ
2. 下部の「マイアプリ」→ `</>`(ウェブ)アイコンをクリック
3. アプリのニックネームを入力(例: `cooking-app-web`)→ Firebase Hostingの設定はチェック不要 → アプリを登録
4. 表示される `firebaseConfig` の値を控える(次の手順で使います)

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "xxxx.firebaseapp.com",
  projectId: "xxxx",
  storageBucket: "xxxx.appspot.com",
  messagingSenderId: "...",
  appId: "1:...:web:...",
};
```

> これらの値は公開されても問題ない設定値です(実際のアクセス制御はFirestoreルール側で行われるため)。

---

## 2. GitHub側の設定

### 2-1. リポジトリのSecretsに登録

1. GitHubリポジトリ → **Settings → Secrets and variables → Actions**
2. 「New repository secret」で、1-6で控えた値をそれぞれ登録

| Secret名 | 値 |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` |

### 2-2. GitHub Pagesを有効化

1. リポジトリ → **Settings → Pages**
2. 「Source」を **GitHub Actions** に設定

### 2-3. 承認済みドメインの追加(重要・忘れやすい)

GitHub Pagesにデプロイした後、**必ず**以下を行ってください。忘れるとログイン時に `auth/unauthorized-domain` エラーになります。

1. Firebase Console → **Authentication → Settings → 承認済みドメイン**
2. 「ドメインを追加」→ `<GitHubユーザー名>.github.io` を追加

### 2-4. デプロイ

`main` ブランチにpushすると、`.github/workflows/deploy.yml` が自動的にビルド・公開します。

```bash
git push origin main
```

公開後のURL: `https://<user>.github.io/<repo>/`

---

## 3. 日常運用

### 3-1. ユーザーを追加する

**Authentication → Users → ユーザーを追加** から、メールアドレスとパスワードを指定するだけです。アプリ側の設定変更やデプロイは不要です。

### 3-2. ユーザーを削除する(アクセスを取り消す)

**Authentication → Users** で対象ユーザーの「⋮」メニュー → 「アカウントを削除」。即座にそのユーザーはログインできなくなります(既にログイン中のセッションも、次にトークンが検証されるタイミングで無効になります)。

### 3-3. パスワードを変更・リセットする

**Authentication → Users** で対象ユーザーの「⋮」メニュー → 「パスワードをリセット」からパスワード再設定メールを送るか、Console上で直接新しいパスワードを設定できます。

### 3-4. データを直接確認・修正する

**Firestore Database → データ** タブから、`ingredients`(食材)・`recipes`(レシピ)の各コレクションを直接閲覧・編集・削除できます。アプリの表示がおかしい場合の実データ確認に便利です。

### 3-5. 誤って登録したデータを消す

Firestore Databaseのデータタブから該当ドキュメントを選び、右上の「⋮」→「ドキュメントを削除」。アプリ側からも同様の削除操作が可能です(食材管理画面の「削除」、ライブラリ画面の「ライブラリから削除」)。

### 3-6. 使用量・料金を確認する

**Firebase Console → 使用量と請求額** から、Firestoreの読み取り/書き込み回数やAuthenticationのアクティブユーザー数を確認できます。個人・家族利用の規模であれば、無料枠(Sparkプラン)の範囲内で収まるのが一般的です。

### 3-7. セキュリティルールを変更する

`firestore.rules` を編集 → Firebase Console → Firestore Database → ルール タブに貼り直して「公開」。リポジトリ側のファイルも合わせて更新・コミットしておくと、変更履歴が残ります。

### 3-8. バックアップを取る

個人利用规模であれば必須ではありませんが、心配な場合は [Firestoreのエクスポート機能](https://firebase.google.com/docs/firestore/manage-data/export-import)(Google Cloud Consoleから実行、Blaze従量課金プランへのアップグレードが必要)でCloud Storageへのバックアップが可能です。

---

## 4. トラブルシューティング

### 4-1. パスワードを忘れた・再設定したい

管理者が **Authentication → Users** から対象ユーザーの「パスワードをリセット」を行ってください(→ [3-3](#3-3-パスワードを変更リセットする))。

### 4-2. ログイン時に「auth/unauthorized-domain」エラーが出る

公開先のドメイン(`<user>.github.io` など)が承認済みドメインに追加されていません。[2-3](#2-3-承認済みドメインの追加重要忘れやすい)の手順を行ってください。

### 4-3. ログイン時に「auth/invalid-api-key」エラーが出る

GitHub Secretsに設定した値が間違っている、または未設定の可能性があります。[2-1](#2-1-リポジトリのsecretsに登録)を再確認し、値を再設定した上で再度pushしてビルドし直してください(Secretsを更新しただけでは既存のデプロイには反映されません。再ビルド・再デプロイが必要です)。

### 4-4. データの読み書きで「permission-denied」エラーが出る

- ログインできているか確認してください(未ログイン状態だとFirestoreルールにより拒否されます)
- `firestore.rules` が正しく公開されているか、Firebase Console側で確認してください([1-5](#1-5-セキュリティルールの適用))

### 4-5. 画面が真っ白・何も表示されない

ブラウザの開発者ツール(F12)のConsoleタブにエラーが出ていないか確認してください。よくある原因:

- Firebaseの設定値(Secrets)が未設定・誤りでFirebaseの初期化に失敗している
- ブラウザのキャッシュが古いビルドを保持している(スーパーリロード: Ctrl+Shift+R で解消することがあります)

### 4-6. テスト用にログインをスキップして動作確認したい

READMEの「テストモード」の章を参照してください。`npm run build:test` でログイン不要のビルドをローカルで作成できます(本番ビルドには影響しません)。

---

## 5. セキュリティ運用の考え方

- このアプリはGitHub Pages(静的ホスティング)上で動くため、サーバー側の認証チェックは存在しません。**実際のアクセス制御はすべてFirestoreセキュリティルール(`request.auth != null`)が担っています。**
- サインアップ画面がないため、新しくアクセスできる人を増やすには管理者がFirebase Consoleでユーザーを作成する必要があります。
- 特定の人のアクセスを止めたい場合は、Authenticationからそのユーザーを削除するだけで完結します(アプリの再デプロイは不要)。
- 万が一、意図しない第三者にログイン情報が渡ってしまった場合は、該当ユーザーを削除するか、パスワードをリセットしてください。
