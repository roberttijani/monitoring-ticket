"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, Role } from "@/store/authStore";

export function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: Role[] }) {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
        } else if (user && !allowedRoles.includes(user.role)) {
            // Redirect to correct dashboard if trying to access unauthorized roles
            router.push(user.role === "admin" ? "/admin/dashboard" : "/user/dashboard");
        } else {
            setIsReady(true);
        }
    }, [isAuthenticated, user, allowedRoles, router]);

    if (!isReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return <>{children}</>;
}
