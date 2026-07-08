import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "今日の献立 | 自分だけのレシピノート",
  description: "食材の在庫を管理し、手作りレシピを記録・検索できるアプリ",
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
