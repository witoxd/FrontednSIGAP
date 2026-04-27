"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import {
  Shield, Users, UserCheck, UserX,
  Search, X, Loader2, Plus,
} from "lucide-react"
import { swrFetcher } from "@/lib/api/fetcher"
import { usersApi, type UsuarioDetalle } from "@/lib/api/services/users"
import { useAuth } from "@/lib/auth/auth-context"
import { UsuarioAvatar } from "@/components/usuarios/usuario-avatar"
import { UsuarioRolBadge } from "@/components/usuarios/usuario-rol-badge"
import { UsuarioActionsMenu } from "@/components/usuarios/usuario-actions-menu"
import { UsuarioDrawer } from "@/components/usuarios/usuario-drawer"
import type { PaginatedApiResponse } from "@/lib/types"

const PAGE_SIZE = 20

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * ARRAY_AGG de PostgreSQL puede llegar como string "{admin,profesor}"
 * o como array JS ["admin"] según cómo el driver pg resuelva el tipo.
 * Esta función normaliza ambos casos.
 */
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

function buildSWRKey(page: number, search: string) {
  const params = new URLSearchParams({
    page:  String(page + 1),
    limit: String(PAGE_SIZE),
  })
  if (search.trim().length >= 2) params.set("query", search.trim())
  return `/users/search?${params.toString()}`
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function UsuariosPage() {
  const { user } = useAuth()

  const [page, setPage]           = useState(0)
  const [search, setSearch]       = useState("")
  const [debouncedQ, setDebounced] = useState("")
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Debounce búsqueda 400 ms
  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(search)
      setPage(0)
    }, 400)
    return () => clearTimeout(id)
  }, [search])

  const swrKey = buildSWRKey(page, debouncedQ)

  const { data, isLoading, mutate } = useSWR<PaginatedApiResponse<UsuarioDetalle>>(
    swrKey,
    swrFetcher,
  )

  const usuarios    = data?.data ?? []
  const total       = data?.pagination?.total ?? 0
  const totalPages  = data?.pagination ? Math.ceil(data.pagination.total / PAGE_SIZE) : 0
  const activos     = usuarios.filter(u => u.activo).length
  const inactivos   = usuarios.filter(u => !u.activo).length

  // ── Acciones ──────────────────────────────────────────────────────────────

  async function handleResetPassword(u: UsuarioDetalle) {
    if (!confirm(`¿Resetear contraseña de ${u.username} al número de documento?`)) return
    try {
      await usersApi.resetPassword(u.persona_id)
      toast.success("Contraseña restablecida al número de documento")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al resetear contraseña")
    }
  }

  async function handleToggleStatus(u: UsuarioDetalle) {
    const accion = u.activo ? "desactivar" : "activar"
    if (!confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} a ${u.username}?`)) return
    try {
      await usersApi.toggleStatus(u.usuario_id, !u.activo)
      toast.success(`Usuario ${u.activo ? "desactivado" : "activado"} exitosamente`)
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar estado")
    }
  }

  async function handleTransferAdmin(u: UsuarioDetalle) {
    if (!confirm(`¿Transferir el rol de administrador a ${u.username}? Perderás tu acceso de admin.`)) return
    try {
      await usersApi.transferAdmin(u.usuario_id)
      toast.success("Rol de administrador transferido")
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al transferir admin")
    }
  }

  function clearSearch() {
    setSearch("")
    setDebounced("")
    setPage(0)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col gap-0 min-h-full">

        {/* ══ ZONA DE CONTROL — header oscuro ══════════════════════════════ */}
        <div className="bg-zinc-950 dark:bg-zinc-900 text-white rounded-xl px-6 py-6 mb-6">

          {/* Título */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20 ring-1 ring-red-500/30">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Gestión de Accesos</h1>
                <p className="text-xs text-zinc-400 mt-0.5">Solo administradores del sistema</p>
              </div>
            </div>

            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nuevo usuario
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Total"
              value={total}
              icon={<Users className="w-4 h-4" />}
              accent="border-zinc-600"
            />
            <StatCard
              label="Activos"
              value={activos}
              icon={<UserCheck className="w-4 h-4" />}
              accent="border-emerald-500"
              note="en esta página"
            />
            <StatCard
              label="Inactivos"
              value={inactivos}
              icon={<UserX className="w-4 h-4" />}
              accent="border-red-500"
              note="en esta página"
            />
          </div>
        </div>

        {/* ══ ZONA OPERATIVA — tabla ════════════════════════════════════════ */}
        <div className="rounded-xl border border-border bg-card flex flex-col">

          {/* Barra de búsqueda */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <div className="relative flex-1 max-w-sm">
              {isLoading && debouncedQ
                ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                : <Search   className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              }
              <input
                type="text"
                placeholder="Buscar por nombre o documento..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {search && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Cargando usuarios...</span>
              </div>
            ) : usuarios.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Users className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {debouncedQ ? `Sin resultados para "${debouncedQ}"` : "No hay usuarios registrados"}
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Usuario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Roles
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Registro
                    </th>
                    <th className="px-5 py-3 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {usuarios.map(u => (
                    <tr
                      key={u.usuario_id}
                      className={`group transition-colors hover:bg-muted/30 ${!u.activo ? "opacity-60" : ""}`}
                    >
                      {/* Identidad */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <UsuarioAvatar
                            nombres={u.nombres ?? u.username}
                            apellidoPaterno={u.apellido_paterno}
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {[u.nombres, u.apellido_paterno, u.apellido_materno]
                                .filter(Boolean).join(" ") || u.username}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              @{u.username} · {u.numero_documento ?? u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Roles */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {parseRoles(u.roles).map(r => (
                            <UsuarioRolBadge key={r} rol={r} />
                          ))}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${u.activo ? "bg-emerald-500" : "bg-zinc-400"}`} />
                          <span className={`text-xs font-medium ${u.activo ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`}>
                            {u.activo ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </td>

                      {/* Fecha */}
                      <td className="px-4 py-4 text-xs text-muted-foreground">
                        {u.fecha_creacion
                          ? new Date(u.fecha_creacion).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
                          : "—"}
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-4">
                        <UsuarioActionsMenu
                          usuario={u}
                          isCurrentUser={user?.id === u.usuario_id}
                          onResetPassword={handleResetPassword}
                          onToggleStatus={handleToggleStatus}
                          onTransferAdmin={handleTransferAdmin}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <p className="text-xs text-muted-foreground">
                Página {page + 1} de {totalPages} · {total} usuarios en total
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="h-8 rounded-lg border border-border px-3 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="h-8 rounded-lg border border-border px-3 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drawer de creación */}
      <UsuarioDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => mutate()}
      />
    </>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, accent, note,
}: {
  label:  string
  value:  number
  icon:   React.ReactNode
  accent: string
  note?:  string
}) {
  return (
    <div className={`border-l-4 ${accent} pl-4 py-1`}>
      <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="font-mono text-3xl font-bold text-white leading-none">{value}</p>
      {note && <p className="text-xs text-zinc-500 mt-1">{note}</p>}
    </div>
  )
}
