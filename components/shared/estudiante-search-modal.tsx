"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Loader2, UserPlus } from "lucide-react"
import { estudiantesApi } from "@/lib/api/services/estudiantes"
import type { EstudianteResumen } from "@/lib/types"

// ── Tipos de relación ─────────────────────────────────────────────────────────

export const TIPOS_RELACION = [
  "Madre",
  "Padre",
  "Abuelo/a",
  "Tío/a",
  "Hermano/a",
  "Tutor legal",
  "Otro",
] as const

export type TipoRelacion = (typeof TIPOS_RELACION)[number]

// ── Props ─────────────────────────────────────────────────────────────────────

interface EstudianteSearchModalProps {
  /** Estudiante IDs ya asignados — para deshabilitarlos en la lista */
  estudiantesAsignados?: number[]
  onAsignar: (estudiante: EstudianteResumen, tipoRelacion: string) => Promise<void>
  onCerrar: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function nombreCompleto(e: EstudianteResumen) {
  return [e.nombres, e.apellido_paterno, e.apellido_materno]
    .filter(Boolean)
    .join(" ")
}

function coincide(e: EstudianteResumen, query: string) {
  const q = query.toLowerCase().trim()
  if (!q) return true
  return (
    nombreCompleto(e).toLowerCase().includes(q) ||
    e.numero_documento.toLowerCase().includes(q)
  )
}

// ── Componente ────────────────────────────────────────────────────────────────

export function EstudianteSearchModal({
  estudiantesAsignados = [],
  onAsignar,
  onCerrar,
}: EstudianteSearchModalProps) {
  const [estudiantes, setEstudiantes]       = useState<EstudianteResumen[]>([])
  const [cargando, setCargando]             = useState(true)
  const [errorCarga, setErrorCarga]         = useState<string | null>(null)
  const [query, setQuery]                   = useState("")
  const [seleccionado, setSeleccionado]     = useState<EstudianteResumen | null>(null)
  const [tipoRelacion, setTipoRelacion]     = useState<string>(TIPOS_RELACION[0])
  const [asignando, setAsignando]           = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Carga inicial ────────────────────────────────────────────────────────
  /**
   * Cargamos una página grande (limit=100) y filtramos en el cliente.
   * Cuando el backend soporte ?search=, solo cambia esta línea.
   *
   * Analogía: es como pedir la lista completa del salón de clases y
   * buscar el nombre tú mismo, en vez de preguntarle al profesor.
   */
  useEffect(() => {
    async function cargar() {
      try {
        const res = await estudiantesApi.getAll(100, 0)
        // Mapeamos al shape simplificado que necesita el modal
        const data = (res.data ?? []) as any[]
        setEstudiantes(
          data.map((e: any) => ({
            persona_id:       e.persona?.persona_id ?? e.persona_id,
            nombres:          e.persona?.nombres    ?? e.nombres ?? "",
            apellido_paterno: e.persona?.apellido_paterno,
            apellido_materno: e.persona?.apellido_materno,
            numero_documento: e.persona?.numero_documento ?? e.numero_documento ?? "",
            estudiante_id:    e.estudiante_id ?? e.persona_id,
          }))
        )
      } catch (err) {
        setErrorCarga(err instanceof Error ? err.message : "Error al cargar estudiantes")
      } finally {
        setCargando(false)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
    }
    cargar()
  }, [])

  // ── Filtro cliente ────────────────────────────────────────────────────────
  const filtrados = estudiantes.filter((e) => coincide(e, query))

  // ── Confirmar asignación ──────────────────────────────────────────────────
  async function handleAsignar() {
    if (!seleccionado) return
    setAsignando(true)
    try {
      await onAsignar(seleccionado, tipoRelacion)
      onCerrar()
    } finally {
      setAsignando(false)
    }
  }

  // ── Cerrar con Escape ─────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onCerrar])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Asignar estudiante</h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Buscador ── */}
        <div className="px-5 py-3 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar por nombre o documento..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSeleccionado(null)
              }}
              className="w-full pl-9 pr-4 h-9 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); setSeleccionado(null) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Lista de resultados ── */}
        <div className="flex-1 overflow-y-auto">
          {cargando ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : errorCarga ? (
            <p className="text-sm text-destructive text-center py-8">{errorCarga}</p>
          ) : filtrados.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {query ? "Sin resultados para tu búsqueda." : "No hay estudiantes disponibles."}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {filtrados.map((e) => {
                const yaAsignado = estudiantesAsignados.includes(
                  e.estudiante_id ?? e.persona_id
                )
                const activo = seleccionado?.persona_id === e.persona_id

                return (
                  <li key={e.persona_id}>
                    <button
                      type="button"
                      disabled={yaAsignado}
                      onClick={() => setSeleccionado(activo ? null : e)}
                      className={`w-full text-left px-5 py-3 flex items-center gap-3 transition-colors
                        ${yaAsignado
                          ? "opacity-40 cursor-not-allowed"
                          : activo
                            ? "bg-primary/8 border-l-2 border-primary"
                            : "hover:bg-muted/50"
                        }`}
                    >
                      {/* Avatar inicial */}
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold
                        ${activo ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                      >
                        {e.nombres.charAt(0).toUpperCase()}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {nombreCompleto(e)}
                        </p>
                        <p className="text-xs text-muted-foreground">{e.numero_documento}</p>
                      </div>

                      {yaAsignado && (
                        <span className="text-xs text-muted-foreground shrink-0">Ya asignado</span>
                      )}
                      {activo && !yaAsignado && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* ── Footer: tipo de relación + botón ── */}
        {seleccionado && (
          <div className="px-5 py-4 border-t border-border shrink-0 space-y-3 bg-muted/30">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Seleccionado: <span className="text-foreground">{nombreCompleto(seleccionado)}</span>
              </p>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-foreground whitespace-nowrap">
                  Tipo de relación
                </label>
                <select
                  value={tipoRelacion}
                  onChange={(e) => setTipoRelacion(e.target.value)}
                  className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {TIPOS_RELACION.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              disabled={asignando}
              onClick={handleAsignar}
              className="w-full flex items-center justify-center gap-2 h-9 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {asignando ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Asignando...</>
              ) : (
                <><UserPlus className="h-4 w-4" /> Asignar estudiante</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
