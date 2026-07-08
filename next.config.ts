import type { NextConfig } from "next";

// GitHub Pages のプロジェクトサイト（https://<user>.github.io/<repo>/）で配信するための
// サブパス設定。ワークフロー側で NEXT_PUBLIC_BASE_PATH="/<repo>" を注入する。
// カスタムドメインや <user>.github.io リポジトリ本体で配信する場合は空のままでよい。
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
