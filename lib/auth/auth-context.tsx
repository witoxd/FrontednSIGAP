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
import type { AuthUser } from "@/lib/types"

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, contraseña: string) => Promise<void>
  logout: () => Promise<void>
  hasRole: (role: string) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadUser = useCallback(async () => {
    try {
      // Con cookies httpOnly, simplemente llamamos /auth/me — el navegador
      // envía la cookie automáticamente. Si no hay sesión activa, recibiremos
      // un 401 y el cliente intentará el refresh; si tampoco funciona, el
      // fetch redirige al login.
      const res = await authApi.me()
      if (res.success && res.data) {
        setUser({
          id: res.data.userId,
          personaId: res.data.personaId,
          username: res.data.username,
          email: res.data.email,
          roles: res.data.roles,
        })
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = useCallback(async (username: string, contraseña: string) => {
    const res = await authApi.login(username, contraseña)
    if (res.success && res.data) {
      setUser({
        id: res.data.user.id,
        personaId: res.data.user.personaId,
        username: res.data.user.username,
        email: res.data.user.email,
        roles: res.data.user.roles,
      })
    } else {
      throw new Error(res.message || "Error al iniciar sesión")
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Continuar aunque falle la llamada al servidor
    }
    setUser(null)
    window.location.href = "/login"
  }, [])

  const hasRole = useCallback(
    (role: string) => user?.roles.includes(role) ?? false,
    [user],
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
