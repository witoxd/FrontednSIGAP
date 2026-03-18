"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Plus, Search, Pencil, Trash2, Loader2, Users, X } from "lucide-react"
import { toast } from "sonner"
import { acudientesApi } from "@/lib/api/services/acudientes"
import type { AcudienteWithPersona } from "@/lib/types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function nombreCompleto(a: AcudienteWithPersona) {
  return [
    a.persona.nombres,
    a.persona.apellido_paterno,
    a.persona.apellido_materno,
  ]
    .filter(Boolean)
    .join(" ")
}

function coincide(a: AcudienteWithPersona, q: string) {
  const lower = q.toLowerCase()
  return (
    nombreCompleto(a).toLowerCase().includes(lower) ||
    a.persona.numero_documento.toLowerCase().includes(lower)
  )
}

const PAGE_SIZE = 20

// ── Componente ────────────────────────────────────────────────────────────────

export default function AcudientesPage() {
  const [acudientes, setAcudientes]   = useState<AcudienteWithPersona[]>([])
  const [cargando, setCargando]       = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [query, setQuery]             = useState("")
  const [eliminandoId, setEliminandoId] = useState<number | null>(null)

  // ── Carga ──────────────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await acudientesApi.getAll(PAGE_SIZE, 0)
      setAcudientes((res.data ?? []) as AcudienteWithPersona[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar acudientes")
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // ── Eliminar ───────────────────────────────────────────────────────────────
  async function handleEliminar(acudiente: AcudienteWithPersona) {
    if (!confirm(`¿Eliminar a ${nombreCompleto(acudiente)}?`)) return

    setEliminandoId(acudiente.acudiente.acudiente_id)
    try {
      await acudientesApi.delete(acudiente.acudiente.acudiente_id)
      setAcudientes((prev) =>
        prev.filter((a) => a.acudiente.acudiente_id !== acudiente.acudiente.acudiente_id)
      )
      toast.success("Acudiente eliminado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar")
    } finally {
      setEliminandoId(null)
    }
  }

  // ── Filtrado cliente ───────────────────────────────────────────────────────
  const filtrados = query.trim()
    ? acudientes.filter((a) => coincide(a, query))
    : acudientes

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto py-6 max-w-5xl space-y-6">

      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold">Acudientes</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {cargando ? "Cargando..." : `${acudientes.length} registrado(s)`}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/acudientes/nuevo"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo acudiente
        </Link>
      </div>

      {/* ── Buscador ── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre o documento..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-8 h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Estado: cargando ── */}
      {cargando && (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* ── Estado: error ── */}
      {!cargando && error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
          <button
            type="button"
            onClick={cargar}
            className="mt-2 text-sm text-destructive underline hover:no-underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ── Tabla ── */}
      {!cargando && !error && (
        <>
          {filtrados.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {query
                  ? "Sin resultados para tu búsqueda."
                  : "No hay acudientes registrados. Crea el primero."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Nombre completo</th>
                    <th className="px-4 py-3 text-left font-medium">Documento</th>
                    <th className="px-4 py-3 text-left font-medium">Tipo doc.</th>
                    <th className="px-4 py-3 w-24" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtrados.map((a) => {
                    const eliminando = eliminandoId === a.acudiente.acudiente_id
                    return (
                      <tr
                        key={a.acudiente.acudiente_id}
                        className={`bg-background transition-opacity hover:bg-muted/30 ${
                          eliminando ? "opacity-40" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {nombreCompleto(a)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                          {a.persona.numero_documento}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {a.persona.tipo_documento.tipo_documento}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {eliminando ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : (
                              <>
                                <Link
                                  href={`/dashboard/acudientes/${a.acudiente.acudiente_id}/editar`}
                                  className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                  title="Editar"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleEliminar(a)}
                                  title="Eliminar"
                                  className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Nota: paginación futura cuando el backend soporte offset/cursor */}
          {acudientes.length === PAGE_SIZE && (
            <p className="text-xs text-center text-muted-foreground">
              Mostrando los primeros {PAGE_SIZE} registros.
            </p>
          )}
        </>
      )}
    </div>
  )
}
