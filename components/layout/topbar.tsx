"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { LogOut, User, Menu, Sun, Moon, KeyRound } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { ChangePasswordModal } from "./change-password-modal"

interface TopbarProps {
  onMenuToggle?: () => void
}

// ── Hook de dark mode ─────────────────────────────────────────────────────────
/**
 * Persiste la preferencia en localStorage y sincroniza la clase .dark
 * en document.documentElement, donde globals.css la lee.
 *
 * Analogía: es como el interruptor de luz de una habitación —
 * cuando lo tocas cambia el estado global de toda la casa (el HTML),
 * no solo el de una ventana.
 */
function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    const stored = localStorage.getItem("sigap_theme")
    if (stored) return stored === "dark"
    // Si no hay preferencia guardada, usar la del sistema operativo
    return window.matchMedia("(prefers-color-scheme: dark)").matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add("dark")
      localStorage.setItem("sigap_theme", "dark")
    } else {
      root.classList.remove("dark")
      localStorage.setItem("sigap_theme", "light")
    }
  }, [isDark])

  return { isDark, toggle: () => setIsDark((d) => !d) }
}

// ── Componente ────────────────────────────────────────────────────────────────

export function Topbar({ onMenuToggle }: TopbarProps) {
  const { user, logout } = useAuth()
  const { isDark, toggle } = useDarkMode()

  const [dropdownOpen,       setDropdownOpen]       = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">

        {/* Izquierda: menú móvil + título */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden text-muted-foreground hover:text-foreground"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-medium text-muted-foreground">
            Panel de Administración
          </h2>
        </div>

        {/* Derecha: toggle dark mode siempre visible + avatar */}
        <div className="flex items-center gap-2">

          {/* ── Toggle dark mode en la topbar (siempre visible) ── */}
          <button
            type="button"
            onClick={toggle}
            title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={isDark ? "Modo claro" : "Modo oscuro"}
          >
            {isDark
              ? <Sun  className="w-4 h-4" />
              : <Moon className="w-4 h-4" />
            }
          </button>

          {/* ── Avatar + dropdown ── */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium text-foreground">
                  {user?.email || "Usuario"}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {user?.roles?.[0] || "Sin rol"}
                </span>
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 rounded-lg border border-border bg-card py-1 shadow-lg z-50">

                {/* Info del usuario */}
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user?.roles}
                  </p>
                </div>

                {/* ── Toggle dark mode dentro del dropdown también ── */}
                <button
                  type="button"
                  onClick={() => { toggle(); setDropdownOpen(false) }}
                  className="flex w-full items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {isDark
                      ? <Sun  className="w-4 h-4 text-muted-foreground" />
                      : <Moon className="w-4 h-4 text-muted-foreground" />
                    }
                    {isDark ? "Modo claro" : "Modo oscuro"}
                  </span>
                  {/* Indicador visual del estado actual */}
                  <span className={`h-2 w-2 rounded-full ${isDark ? "bg-amber-400" : "bg-slate-400"}`} />
                </button>

                {/* Cambiar contraseña */}
                <button
                  type="button"
                  onClick={() => { setDropdownOpen(false); setChangePasswordOpen(true) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <KeyRound className="w-4 h-4 text-muted-foreground" />
                  Cambiar contraseña
                </button>

                <div className="border-t border-border mt-1" />

                {/* Cerrar sesión */}
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>

              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal de cambio de contraseña — fuera del header para evitar z-index issues */}
      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </>
  )
}