import { create } from 'zustand'

interface AuthState {
  token: string | null
  role: string | null
  username: string | null
  isAuthenticated: boolean
  login: (token: string, role: string, username: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('access_token'),
  role: localStorage.getItem('user_role'),
  username: localStorage.getItem('username'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  login: (token, role, username) => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('user_role', role)
    localStorage.setItem('username', username)
    set({ token, role, username, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_role')
    localStorage.removeItem('username')
    set({ token: null, role: null, username: null, isAuthenticated: false })
  },
}))
