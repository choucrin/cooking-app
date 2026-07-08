"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { normalizePathname } from "@/lib/paths";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = normalizePathname(usePathname());
  const router = useRouter();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (loading) return;
    if (!user && !isLoginPage) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (user && isLoginPage) {
      router.replace("/");
    }
  }, [user, loading, isLoginPage, pathname, router]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <p className="text-sm text-neutral-500">読み込み中...</p>
      </div>
    );
  }

  if (!user && !isLoginPage) {
    return null;
  }

  return <>{children}</>;
}
