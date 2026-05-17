"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";
import { VoxLogo } from "@/components/VoxLogo";

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, user, loading, error, clearError } = useAuthStore();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        if (isAuthenticated && user) {
            const lastPath = localStorage.getItem('last-visited-path');
            const defaultPath = user.role === "admin" ? "/admin/dashboard" : "/user/dashboard";
            const rolePrefix = user.role === "admin" ? "/admin" : "/user";
            if (lastPath && lastPath.startsWith(rolePrefix)) {
                router.push(lastPath);
            } else {
                router.push(defaultPath);
            }
        }
    }, [isAuthenticated, user, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        clearError();
        await login(email, password);
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-canvas">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md z-10 p-4"
            >
                <div className="bg-canvas border border-hairline p-8 rounded-none">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-0">
                            <div className="p-0 text-ink">
                                <VoxLogo className="w-24 h-24" />
                            </div>
                        </div>
                        <p className="text-mute mt-4">[+] Sign in to your dashboard</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-3 rounded-sm bg-surface-soft border border-danger flex items-center gap-3"
                        >
                            <AlertCircle className="w-5 h-5 text-danger shrink-0" />
                            <p className="text-sm text-danger">{error}</p>
                        </motion.div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2 relative">
                            <label className="text-sm font-bold text-ink ml-1">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-mute" />
                                </div>
                                <Input
                                    type="email"
                                    placeholder="name@example.com"
                                    className="pl-10 h-10 bg-surface-soft border border-hairline text-ink placeholder:text-mute rounded-sm w-full focus:bg-canvas focus:border-ink outline-none"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-ink ml-1">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-mute" />
                                </div>
                                <Input
                                    type="password"
                                    placeholder="Enter your password"
                                    className="pl-10 h-10 bg-surface-soft border border-hairline text-ink placeholder:text-mute rounded-sm w-full focus:bg-canvas focus:border-ink outline-none"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-10 text-base mt-6 bg-primary text-on-primary hover:bg-ink-deep rounded-sm"
                            disabled={loading || !email || !password}
                        >
                            {loading ? (
                                "[...] Verifying"
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4 mr-2" />
                                    Sign In
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
