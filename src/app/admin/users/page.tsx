"use client";

import { useState, useEffect } from "react";
import { useAuthStore, User } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Search, UserPlus, Shield, User as UserIcon, Trash2, X, Mail, Lock } from "lucide-react";

export default function AdminUsersPage() {
    const { users, removeUser, addUser, fetchUsers, loading: usersLoading } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [newUser, setNewUser] = useState({
        name: "", email: "", password: "", role: "user" as "admin" | "user"
    });

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddUser = async () => {
        if (!newUser.name || !newUser.email || !newUser.password) return;
        setIsSubmitting(true);
        await addUser({
            name: newUser.name,
            email: newUser.email,
            password: newUser.password,
            role: newUser.role,
        });
        setIsSubmitting(false);
        setIsAddUserModalOpen(false);
        setNewUser({ name: "", email: "", password: "", role: "user" });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        await removeUser(deleteTarget.id);
        setIsDeleting(false);
        setDeleteTarget(null);
    };

    if (usersLoading && users.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">User Accounts</h1>
                    <p className="text-surface-200 mt-1">Create and manage user accounts. Assign staff to events from the event management page.</p>
                </div>
                <Button className="shrink-0 group" onClick={() => setIsAddUserModalOpen(true)}>
                    <UserPlus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Add User
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-100/50 pb-4">
                    <CardTitle>User Directory</CardTitle>
                    <div className="relative w-full md:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-200" />
                        <Input
                            placeholder="Search users..."
                            className="pl-9 h-9 border-surface-100 bg-surface-50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-surface-100/50">
                        {filteredUsers.length === 0 ? (
                            <div className="p-12 text-center text-surface-200">
                                No users found.
                            </div>
                        ) : (
                            filteredUsers.map(u => (
                                <div key={u.id} className="p-6 flex flex-col sm:flex-row items-center gap-6 hover:bg-surface-100/20 transition-colors">
                                    <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center font-bold text-lg
                                        ${u.role === 'admin' ? 'bg-primary-500/20 text-primary-500' : 'bg-surface-200/20 text-surface-200'}
                                    `}>
                                        {u.name.charAt(0).toUpperCase()}
                                    </div>

                                    <div className="flex-1 text-center sm:text-left">
                                        <h3 className="text-lg font-semibold text-foreground flex items-center justify-center sm:justify-start gap-2">
                                            {u.name}
                                            {u.role === "admin" ? (
                                                <Shield className="w-4 h-4 text-primary-500" />
                                            ) : (
                                                <UserIcon className="w-4 h-4 text-surface-200" />
                                            )}
                                        </h3>
                                        <p className="text-sm text-surface-200">{u.email}</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${u.role === 'admin' ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20' :
                                                'bg-surface-200/10 text-surface-200 border border-surface-200/20'
                                            }`}>
                                            {u.role}
                                        </span>

                                        <Button
                                            variant="danger"
                                            size="icon"
                                            disabled={u.role === "admin"}
                                            onClick={() => setDeleteTarget({ id: u.id, name: u.name })}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                title="Delete User"
                message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                confirmLabel="Delete User"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteTarget(null)}
                loading={isDeleting}
            />

            {/* Add User Modal */}
            {isAddUserModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md border-surface-100/50 bg-surface-50 shadow-2xl">
                        <CardHeader className="border-b border-surface-100/50 flex flex-row items-center justify-between py-4">
                            <CardTitle className="text-lg">Add New User</CardTitle>
                            <button onClick={() => setIsAddUserModalOpen(false)} className="p-1.5 text-surface-200 hover:text-foreground hover:bg-surface-100 rounded-md">
                                <X className="w-5 h-5" />
                            </button>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Full Name</label>
                                <Input 
                                    placeholder="e.g. John Doe" 
                                    value={newUser.name}
                                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Email</label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-200" />
                                    <Input 
                                        type="email"
                                        placeholder="name@example.com" 
                                        className="pl-9"
                                        value={newUser.email}
                                        onChange={e => setNewUser({...newUser, email: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Password</label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-200" />
                                    <Input 
                                        type="password"
                                        placeholder="Set a password" 
                                        className="pl-9"
                                        value={newUser.password}
                                        onChange={e => setNewUser({...newUser, password: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Role</label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setNewUser({...newUser, role: "user"})}
                                        className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-colors ${
                                            newUser.role === "user" 
                                                ? "border-primary-500 bg-primary-500/10 text-primary-500" 
                                                : "border-surface-100 text-surface-200 hover:border-surface-200"
                                        }`}
                                    >
                                        <UserIcon className="w-4 h-4 mx-auto mb-1" />
                                        Staff
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewUser({...newUser, role: "admin"})}
                                        className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-colors ${
                                            newUser.role === "admin" 
                                                ? "border-primary-500 bg-primary-500/10 text-primary-500" 
                                                : "border-surface-100 text-surface-200 hover:border-surface-200"
                                        }`}
                                    >
                                        <Shield className="w-4 h-4 mx-auto mb-1" />
                                        Admin
                                    </button>
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setIsAddUserModalOpen(false)}>Cancel</Button>
                                <Button 
                                    className="flex-1" 
                                    onClick={handleAddUser} 
                                    disabled={!newUser.name || !newUser.email || !newUser.password || isSubmitting}
                                >
                                    {isSubmitting ? "Creating..." : "Add User"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
