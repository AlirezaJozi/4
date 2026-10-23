import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AUTH_UNAUTHORIZED_EVENT, clearCsrfToken } from '../lib/api/client'
import { authApi } from '../lib/api/endpoints'
import type { AdminUser } from '../lib/api/types'

interface AuthContextValue {
  user: AdminUser | null
  isLoading: boolean
  setUser: (user: AdminUser | null) => void
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()

  useEffect(() => {
    let active = true
    authApi
      .me()
      .then((admin) => {
        if (active) setUser(admin)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null)
      queryClient.removeQueries({ queryKey: ['admin'] })
    }
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [queryClient])

  const refresh = useCallback(async () => {
    const admin = await authApi.me()
    setUser(admin)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      clearCsrfToken()
      setUser(null)
      queryClient.clear()
    }
  }, [queryClient])

  const value = useMemo(
    () => ({ user, isLoading, setUser, refresh, logout }),
    [user, isLoading, refresh, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth باید داخل AuthProvider استفاده شود')
  return context
}
