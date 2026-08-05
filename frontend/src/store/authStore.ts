import { create } from 'zustand'
import type { User } from '../types'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User) => void
  setTokens: (access: string, refresh: string) => void
  logout: () => void
  hasRole: (role: string) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: true }),

  setTokens: (access, refresh) => {
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    set({ accessToken: access, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, accessToken: null, isAuthenticated: false })
  },

  hasRole: (role: string) => {
    const { user } = get()
    if (!user) return false
    if ((role === 'admin' || role === 'moderator') && (user.is_staff || user.is_superuser)) return true
    if (!user.roles) return false
    return user.roles.some((r) => r.name === role)
  },
}))

interface NotificationState {
  unreadCount: number
  setUnreadCount: (count: number) => void
  incrementUnread: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
}))
