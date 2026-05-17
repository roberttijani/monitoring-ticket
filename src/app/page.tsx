"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      const lastPath = localStorage.getItem('last-visited-path');
      const defaultPath = user?.role === "admin" ? "/admin/dashboard" : "/user/dashboard";
      // Only restore path if it matches the user's role prefix
      const rolePrefix = user?.role === "admin" ? "/admin" : "/user";
      if (lastPath && lastPath.startsWith(rolePrefix)) {
        router.push(lastPath);
      } else {
        router.push(defaultPath);
      }
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
