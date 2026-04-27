"use client"

import { useState, useRef, useEffect } from "react"
import { MoreHorizontal, KeyRound, Power, PowerOff, ShieldCheck } from "lucide-react"
import type { UsuarioDetalle } from "@/lib/api/services/users"

function parseRoles(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter(Boolean) as string[]
  if (typeof raw === "string") {
    return raw
      .replace(/^\{|\}$/g, "")
      .split(",")
      .map(s => s.replace(/^"|"$/g, "").trim())
      .filter(Boolean)
  }
  return []
}

interface UsuarioActionsMenuProps {
  usuario: UsuarioDetalle
  isCurrentUser: boolean
  onResetPassword:  (usuario: UsuarioDetalle) => void
  onToggleStatus:   (usuario: UsuarioDetalle) => void
  onTransferAdmin:  (usuario: UsuarioDetalle) => void
}

export function UsuarioActionsMenu({
  usuario,
  isCurrentUser,
  onResetPassword,
  onToggleStatus,
  onTransferAdmin,
}: UsuarioActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Cierra al hacer clic fuera
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  const esAdmin = parseRoles(usuario.roles).includes("admin")

  return (
    <div ref={menuRef} className="relative flex items-center justify-end">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Acciones"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-50 w-52 rounded-xl border border-border bg-card shadow-xl py-1 animate-in fade-in slide-in-from-top-2 duration-100"
        >
          {/* Resetear contraseña */}
          <button
            role="menuitem"
            onClick={() => { setOpen(false); onResetPassword(usuario) }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <KeyRound className="w-4 h-4 text-muted-foreground" />
            Resetear contraseña
          </button>

          {/* Activar / Desactivar — no aplica sobre uno mismo */}
          {!isCurrentUser && (
            <button
              role="menuitem"
              onClick={() => { setOpen(false); onToggleStatus(usuario) }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                usuario.activo
                  ? "text-destructive hover:bg-destructive/10"
                  : "text-emerald-600 hover:bg-emerald-500/10"
              }`}
            >
              {usuario.activo
                ? <PowerOff className="w-4 h-4" />
                : <Power    className="w-4 h-4" />
              }
              {usuario.activo ? "Desactivar usuario" : "Activar usuario"}
            </button>
          )}

          {/* Transferir admin — solo si el target no es ya admin y no es uno mismo */}
          {!esAdmin && !isCurrentUser && (
            <>
              <div className="my-1 border-t border-border" />
              <button
                role="menuitem"
                onClick={() => { setOpen(false); onTransferAdmin(usuario) }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-amber-600 hover:bg-amber-500/10 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Transferir rol admin
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
