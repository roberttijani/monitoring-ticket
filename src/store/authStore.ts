import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetchAllUsers, loginUser, insertUser, destroyUser } from '@/lib/supabase/users'

export type Role = 'admin' | 'user'

export interface User {
    id: string
    name: string
    email: string
    role: Role
    assignedEventIds?: string[] // For staff (Users)
}

interface AuthState {
    users: User[]
    user: User | null
    isAuthenticated: boolean
    loading: boolean
    error: string | null
    fetchUsers: () => Promise<void>
    login: (email: string, password: string) => Promise<void>
    logout: () => void
    addUser: (user: { name: string; email: string; password: string; role: Role }) => Promise<void>
    removeUser: (id: string) => Promise<void>
    clearError: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            users: [],
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null,

            fetchUsers: async () => {
                set({ loading: true, error: null })
                try {
                    const users = await fetchAllUsers()
                    set({ users, loading: false })
                } catch (err: any) {
                    set({ error: err.message || 'Failed to fetch users', loading: false })
                }
            },

            login: async (email, password) => {
                set({ loading: true, error: null })
                try {
                    const user = await loginUser(email, password)
                    if (user) {
                        set({ user, isAuthenticated: true, loading: false, error: null })
                    } else {
                        set({ error: 'Invalid email or password', loading: false })
                    }
                } catch (err: any) {
                    set({ error: err.message || 'Login failed', loading: false })
                }
            },

            logout: () => set({ user: null, isAuthenticated: false, error: null }),

            addUser: async (newUser) => {
                set({ loading: true, error: null })
                try {
                    const created = await insertUser(newUser)
                    set((state) => ({
                        users: [...state.users, created],
                        loading: false,
                    }))
                } catch (err: any) {
                    set({ error: err.message || 'Failed to add user', loading: false })
                }
            },

            removeUser: async (id) => {
                set({ loading: true, error: null })
                try {
                    await destroyUser(id)
                    set((state) => ({
                        users: state.users.filter(u => u.id !== id),
                        loading: false,
                    }))
                } catch (err: any) {
                    set({ error: err.message || 'Failed to remove user', loading: false })
                }
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'auth-session',
            // Only persist session-related fields, not the full user list
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
)
