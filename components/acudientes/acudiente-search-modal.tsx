"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, X, Loader2, UserPlus } from "lucide-react"
import { acudientesApi } from "@/lib/api/services/acudientes"
import type { AcudienteWithPersona } from "@/lib/types"

// ── Constantes ────────────────────────────────────────────────────────────────

export const TIPOS_RELACION_ACUDIENTE = [
  "Madre",
  "Padre",
  "Abuelo/a",
  "Tío/a",
  "Hermano/a",
  "Tutor legal",
  "Otro",
] as const

const DEBOUNCE_MS = 400
const MIN_CHARS   = 2

// ── Shape reducido que usa la UI ──────────────────────────────────────────────

export interface AcudienteResumen {
  acudiente_id:     number
  persona_id:       number
  nombres:          string
  apellido_paterno?: string
  apellido_materno?: string
  numero_documento: string
  parentesco?:      string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function nombreCompleto(a: AcudienteResumen) {
  return [a.nombres, a.apellido_paterno, a.apellido_materno].filter(Boolean).join(" ")
}

function mapSearchResult(raw: any): AcudienteResumen {
  const p = raw.persona ?? raw
  return {
    acudiente_id:     raw.acudiente?.acudiente_id ?? raw.acudiente_id,
    persona_id:       p.persona_id,
    nombres:          p.nombres          ?? "",
    apellido_paterno: p.apellido_paterno,
    apellido_materno: p.apellido_materno,
    numero_documento: p.numero_documento  ?? "",
    parentesco:       raw.acudiente?.parentesco,
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface AcudienteSearchModalProps {
  /** acudiente_ids ya asignados — se deshabilitan en la lista */
  acudientesAsignados?: number[]
  onAsignar: (acudiente: AcudienteResumen, tipoRelacion: string) => Promise<void>
  onCerrar: () => void
}

// ── Componente ────────────────────────────────────────────────────────────────

export function AcudienteSearchModal({
  acudientesAsignados = [],
  onAsignar,
  onCerrar,
}: AcudienteSearchModalProps) {
  const [query, setQuery]               = useState("")
  const [resultados, setResultados]     = useState<AcudienteResumen[]>([])
  const [buscando, setBuscando]         = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [seleccionado, setSeleccionado] = useState<AcudienteResumen | null>(null)
  const [tipoRelacion, setTipoRelacion] = useState<string>(TIPOS_RELACION_ACUDIENTE[0])
  const [asignando, setAsignando]       = useState(false)
  const inputRef    = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50) }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onCerrar])

  // ── Búsqueda con debounce ─────────────────────────────────────────────────
  const buscar = useCallback(async (texto: string) => {
    const q = texto.trim()
    if (q.length < MIN_CHARS) { setResultados([]); setError(null); return }

    setBuscando(true)
    setError(null)
    try {
      const res  = await acudientesApi.searchIndex(q)
      const raw  = res.data
      const lista = Array.isArray(raw) ? raw : raw ? [raw] : []
      setResultados(lista.map(mapSearchResult))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al buscar")
      setResultados([])
    } finally {
      setBuscando(false)
    }
  }, [])

  function handleQueryChange(valor: string) {
    setQuery(valor)
    setSeleccionado(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => buscar(valor), DEBOUNCE_MS)
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  async function handleAsignar() {
    if (!seleccionado) return
    setAsignando(true)
    try { await onAsignar(seleccionado, tipoRelacion); onCerrar() }
    finally { setAsignando(false) }
  }

  const queryCorta   = query.trim().length < MIN_CHARS
  const mostrarVacio = !buscando && !error && resultados.length === 0
  const mensajeVacio = queryCorta
    ? `Escribe al menos ${MIN_CHARS} caracteres para buscar.`
    : "Sin resultados. Prueba con el número de documento."

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Asignar acudiente</h2>
          </div>
          <button type="button" onClick={onCerrar}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Buscador */}
        <div className="px-5 py-3 border-b border-border shrink-0">
          <div className="relative">
            {buscando
              ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              : <Search  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            }
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar por nombre o documento..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="w-full pl-9 pr-8 h-9 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {query && (
              <button type="button"
                onClick={() => { setQuery(""); setResultados([]); setSeleccionado(null) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            ¿El acudiente no aparece?{" "}
            <a href="/dashboard/acudientes/nuevo" target="_blank"
              className="text-primary hover:underline">
              Regístralo primero →
            </a>
          </p>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {error ? (
            <p className="text-sm text-destructive text-center py-8">{error}</p>
          ) : mostrarVacio ? (
            <p className="text-sm text-muted-foreground text-center py-8">{mensajeVacio}</p>
          ) : (
            <ul className="divide-y divide-border">
              {resultados.map((a) => {
                const yaAsignado = acudientesAsignados.includes(a.acudiente_id)
                const activo     = seleccionado?.acudiente_id === a.acudiente_id
                return (
                  <li key={a.acudiente_id}>
                    <button type="button" disabled={yaAsignado}
                      onClick={() => setSeleccionado(activo ? null : a)}
                      className={`w-full text-left px-5 py-3 flex items-center gap-3 transition-colors
                        ${yaAsignado ? "opacity-40 cursor-not-allowed"
                        : activo     ? "bg-primary/8 border-l-2 border-primary"
                        :              "hover:bg-muted/50"}`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold
                        ${activo ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {a.nombres.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{nombreCompleto(a)}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.numero_documento}
                          {a.parentesco && <span className="ml-2 text-muted-foreground/60">· {a.parentesco}</span>}
                        </p>
                      </div>
                      {yaAsignado && <span className="text-xs text-muted-foreground shrink-0">Ya asignado</span>}
                      {activo && !yaAsignado && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {seleccionado && (
          <div className="px-5 py-4 border-t border-border shrink-0 space-y-3 bg-muted/30">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Seleccionado: <span className="text-foreground">{nombreCompleto(seleccionado)}</span>
              </p>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-foreground whitespace-nowrap">Tipo de relación</label>
                <select value={tipoRelacion} onChange={(e) => setTipoRelacion(e.target.value)}
                  className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {TIPOS_RELACION_ACUDIENTE.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <button type="button" disabled={asignando} onClick={handleAsignar}
              className="w-full flex items-center justify-center gap-2 h-9 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {asignando
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Asignando...</>
                : <><UserPlus className="h-4 w-4" /> Asignar acudiente</>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  )
}