import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 静的エクスポートのビルドは各ページを一度サーバー側でもプリレンダリングするため、
// このモジュールはNode.js環境でも読み込まれる。さらにブラウザ側でも、
// NEXT_PUBLIC_FIREBASE_* が未設定/ダミー値の場合、getAuth()はAPIキーの形式を
// 検証してその場で例外を投げる。これがモジュール評価（import）のタイミングで
// 発生すると、アプリ全体の起動が失敗し白画面になってしまう。
// Firebase未設定でもUI確認だけはできるよう、失敗時はconsole.warnに留めて
// auth/db を空のダミーオブジェクトにフォールバックする。
// （実際のFirebaseプロジェクトが設定されていれば、通常通り正しく初期化される）
function safeGetAuth(): Auth {
  try {
    return getAuth(app);
  } catch (err) {
    console.warn(
      "[firebase] Authの初期化に失敗しました。NEXT_PUBLIC_FIREBASE_* の設定を確認してください。",
      err
    );
    return {} as Auth;
  }
}

function safeGetFirestore(): Firestore {
  try {
    return getFirestore(app);
  } catch (err) {
    console.warn(
      "[firebase] Firestoreの初期化に失敗しました。NEXT_PUBLIC_FIREBASE_* の設定を確認してください。",
      err
    );
    return {} as Firestore;
  }
}

export const auth = typeof window !== "undefined" ? safeGetAuth() : ({} as Auth);
export const db =
  typeof window !== "undefined" ? safeGetFirestore() : ({} as Firestore);
