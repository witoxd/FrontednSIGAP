"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { authApi } from "@/lib/api/services/auth"
import { setToken, removeToken } from "@/lib/api/client"
import type { AuthUser } from "@/lib/types"

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, contraseña: string) => Promise<void>
  logout: () => void
  hasRole: (role: string) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadUser = useCallback(async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("sigap_token")
          : null
      if (!token) {
        setIsLoading(false)
        return
      }
      const res = await authApi.me()
      if (res.success && res.data) {
        setUser({
          id: res.data.userId,
          personaId: res.data.personaId,
          username: "",
          email: res.data.email,
          roles: res.data.roles,
        })
      }
    } catch {
      removeToken()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = useCallback(
    async (email: string, contraseña: string) => {
      const res = await authApi.login(email, contraseña)
      if (res.success && res.data) {
        setToken(res.data.token)
        setUser({
          id: res.data.user.id,
          personaId: res.data.user.personaId,
          username: res.data.user.username,
          email: res.data.user.email,
          roles: res.data.user.roles,
        })
      } else {
        throw new Error(res.message || "Error al iniciar sesion")
      }
    },
    []
  )

  const logout = useCallback(() => {
    removeToken()
    setUser(null)
    window.location.href = "/login"
  }, [])

  const hasRole = useCallback(
    (role: string) => {
      return user?.roles.includes(role) ?? false
    },
    [user]
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider")
  }
  return context
}
