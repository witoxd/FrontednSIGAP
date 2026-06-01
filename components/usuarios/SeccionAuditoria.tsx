"use client"

import { useState } from "react"
import useSWR from "swr"
import { Loader2, ChevronDown, ChevronUp, ClipboardList } from "lucide-react"
import { swrFetcher } from "@/lib/api/fetcher"
import type { AuditoriaLog, PaginatedApiResponse } from "@/lib/types"

const PAGE_SIZE = 20

type AccionFiltro = AuditoriaLog["accion"] | ""

const ACCIONES_FILTRO: { value: AccionFiltro; label: string }[] = [
  { value: "",        label: "Todas las acciones" },
  { value: "CREATE",  label: "CREATE" },
  { value: "UPDATE",  label: "UPDATE" },
  { value: "DELETE",  label: "DELETE" },
  { value: "LOGIN",   label: "LOGIN" },
  { value: "LOGOUT",  label: "LOGOUT" },
]

const BADGE_ACCION: Record<AuditoriaLog["accion"], string> = {
  CREATE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  UPDATE: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  DELETE: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
  LOGIN:  "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  LOGOUT: "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border border-zinc-500/20",
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export function SeccionAuditoria() {
  const [page, setPage]               = useState(0)
  const [accionFiltro, setAccionFiltro] = useState<AccionFiltro>("")
  const [expandidos, setExpandidos]   = useState<Set<number>>(new Set())

  const swrKey = accionFiltro
    ? `/auditoria/accion/${accionFiltro}`
    : `/auditoria?page=${page + 1}&limit=${PAGE_SIZE}`

  const { data, isLoading } = useSWR<
    PaginatedApiResponse<AuditoriaLog> | { success: boolean; data: AuditoriaLog[] }
  >(swrKey, swrFetcher)

  const logs       = data?.data ?? []
  const pagination = "pagination" in (data ?? {}) ? (data as PaginatedApiResponse<AuditoriaLog>).pagination : null
  const totalPages = pagination ? Math.ceil(pagination.total / PAGE_SIZE) : 1

  const toggleExpand = (id: number) => {
    setExpandidos(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleFiltro = (valor: AccionFiltro) => {
    setAccionFiltro(valor)
    setPage(0)
  }

  return (
    <div className="flex flex-col">

      {/* Barra de filtros */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <ClipboardList className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <p className="text-sm font-medium text-foreground">Filtrar por acción:</p>
        <div className="flex gap-1.5 flex-wrap">
          {ACCIONES_FILTRO.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleFiltro(value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                accionFiltro === value
                  ? "bg-zinc-900 border-zinc-700 text-white dark:bg-zinc-700 dark:border-zinc-500"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando registros...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <ClipboardList className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Sin registros de auditoría</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Acción
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Tabla
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Detalle
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map(log => {
                const expandido = expandidos.has(log.auditoria_id)
                return (
                  <tr key={log.auditoria_id} className="hover:bg-muted/20 transition-colors align-top">

                    {/* Usuario */}
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">
                        {log.nombres && log.apellido_paterno
                          ? `${log.nombres} ${log.apellido_paterno}`
                          : log.username ?? "Sistema"}
                      </p>
                      {log.username && (
                        <p className="text-xs text-muted-foreground">@{log.username}</p>
                      )}
                    </td>

                    {/* Acción */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-mono ${BADGE_ACCION[log.accion]}`}>
                        {log.accion}
                      </span>
                    </td>

                    {/* Tabla */}
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-muted-foreground">{log.tabla_nombre}</span>
                    </td>

                    {/* Fecha */}
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatFecha(log.fecha)}
                    </td>

                    {/* Detalle */}
                    <td className="px-4 py-3">
                      {log.detalle ? (
                        <div>
                          <button
                            onClick={() => toggleExpand(log.auditoria_id)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {expandido ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {expandido ? "Ocultar" : "Ver"}
                          </button>
                          {expandido && (
                            <pre className="text-xs font-mono bg-muted rounded p-2 mt-2 overflow-x-auto max-h-32 text-foreground">
                              {JSON.stringify(log.detalle, null, 2)}
                            </pre>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación (solo cuando no hay filtro de acción) */}
      {!accionFiltro && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <p className="text-xs text-muted-foreground">
            Página {page + 1} de {totalPages}
            {pagination && ` · ${pagination.total} registros en total`}
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
  )
}
