import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavBar from "@/components/NavBar";
import AuthGate from "@/components/AuthGate";
import { AuthProvider } from "@/lib/AuthContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// GitHub Pagesのサブパス配信に合わせて、アイコン等のリンクにもbasePathを付与する
// （next.config.ts と同じ仕組み）
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "今日の献立 | 自分だけのレシピノート",
  description: "食材の在庫を管理し、手作りレシピを記録・検索できるアプリ",
  manifest: `${basePath}/manifest.json`,
  icons: {
    icon: [
      { url: `${basePath}/favicon.ico`, sizes: "any" },
      { url: `${basePath}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${basePath}/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: `${basePath}/apple-icon.png`, sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "今日の献立",
  },
  other: {
    // NextのappleWebAppは標準化された mobile-web-app-capable のみを出力するため、
    // 古いiOS Safariとの互換性のためレガシーな apple- 接頭辞版も明示的に追加する
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <AuthProvider>
          <AuthGate>
            <NavBar />
            <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-20 pt-6 sm:pb-10">
              {children}
            </main>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
