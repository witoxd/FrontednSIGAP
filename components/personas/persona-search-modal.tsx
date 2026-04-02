"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, X, Loader2, UserCheck, BadgeCheck } from "lucide-react"
import { personaApi } from "@/lib/api/services/persona"
import type { PersonaWithTipoDocumentoJSON, PersonaWithTipoDocumento } from "@/lib/types"

// ── Constantes ────────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 400
const MIN_CHARS   = 2

// ── Helpers ───────────────────────────────────────────────────────────────────

function nombreCompleto(p: PersonaWithTipoDocumento) {
  return [p.nombres, p.apellido_paterno, p.apellido_materno]
    .filter(Boolean)
    .join(" ")
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface PersonaSearchModalProps {
  /** Título del modal — ej: "Buscar persona para registrar como Profesor" */
  titulo?: string
  /** Callback cuando el usuario confirma la selección */
  onSeleccionar: (persona: PersonaWithTipoDocumento) => void
  onCerrar: () => void
}

// ── Componente ────────────────────────────────────────────────────────────────

export function PersonaSearchModal({
  titulo = "Buscar persona existente",
  onSeleccionar,
  onCerrar,
}: PersonaSearchModalProps) {
  const [query, setQuery]               = useState("")
  const [resultados, setResultados]     = useState<PersonaWithTipoDocumentoJSON[]>([])
  const [buscando, setBuscando]         = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [seleccionado, setSeleccionado] = useState<PersonaWithTipoDocumento | null>(null)

  const inputRef    = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Autofocus al montar
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50) }, [])

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onCerrar])

  // Limpiar timer al desmontar
  useEffect(
    () => () => { if (debounceRef.current) clearTimeout(debounceRef.current) },
    []
  )

  // ── Búsqueda con debounce ─────────────────────────────────────────────────
  /**
   * Analogía: igual que buscar en la agenda del teléfono —
   * no va a la nube después de cada letra, sino cuando terminás de escribir.
   */
  const buscar = useCallback(async (texto: string) => {
    const q = texto.trim()
    if (q.length < MIN_CHARS) {
      setResultados([])
      setError(null)
      return
    }

    setBuscando(true)
    setError(null)
    try {
      const res = await personaApi.searchIndex(q)
      setResultados(res.data ?? [])
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

  function handleConfirmar() {
    if (!seleccionado) return
    onSeleccionar(seleccionado)
    onCerrar()
  }

  const queryCorta   = query.trim().length < MIN_CHARS
  const mostrarVacio = !buscando && !error && resultados.length === 0

  const mensajeVacio = queryCorta
    ? `Escribe al menos ${MIN_CHARS} caracteres para buscar (nombre o documento).`
    : "Sin resultados. Intenta con otro término."

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">{titulo}</h2>
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
            {buscando
              ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              : <Search  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            }
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar por nombre o número de documento..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="w-full pl-9 pr-8 h-9 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); setResultados([]); setSeleccionado(null) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Nota informativa */}
          <p className="text-xs text-muted-foreground mt-1.5">
            Solo aparecen personas ya registradas en el sistema (estudiantes, profesores, acudientes, etc.)
          </p>
        </div>

        {/* ── Lista de resultados ── */}
        <div className="flex-1 overflow-y-auto">
          {error ? (
            <p className="text-sm text-destructive text-center py-8 px-5">{error}</p>
          ) : mostrarVacio ? (
            <p className="text-sm text-muted-foreground text-center py-8 px-5">
              {mensajeVacio}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {resultados.map((p) => {
                const activo = seleccionado?.persona_id === p.persona.persona_id
                return (
                  <li key={p.persona.persona_id}>
                    <button
                      type="button"
                      onClick={() => setSeleccionado(activo ? null : p.persona)}
                      className={`w-full text-left px-5 py-3 flex items-center gap-3 transition-colors
                        ${activo
                          ? "bg-primary/8 border-l-2 border-primary"
                          : "hover:bg-muted/50"
                        }`}
                    >
                      {/* Avatar inicial */}
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors
                          ${activo
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                          }`}
                      >
                        {p.persona.nombres}
                      </span>

                      {/* Datos */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {nombreCompleto(p.persona)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.persona.tipo_documento.nombre_documento} · {p.persona.numero_documento}
                        </p>
                      </div>

                      {/* Indicador seleccionado */}
                      {activo && (
                        <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* ── Footer — aparece cuando hay selección ── */}
        {seleccionado && (
          <div className="px-5 py-4 border-t border-border shrink-0 bg-muted/30 space-y-3">

            {/* Resumen de la persona seleccionada */}
            <div className="flex items-start gap-3 rounded-lg bg-background border border-border px-3 py-2.5">
              <BadgeCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {nombreCompleto(seleccionado)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {seleccionado.tipo_documento.nombre_documento} · {seleccionado.numero_documento}
                  {seleccionado.fecha_nacimiento && (
                    <> · Nac. {new Date(seleccionado.fecha_nacimiento).toLocaleDateString("es-CO")}</>
                  )}
                </p>
              </div>
            </div>

            {/* Botón confirmar */}
            <button
              type="button"
              onClick={handleConfirmar}
              className="w-full flex items-center justify-center gap-2 h-9 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <UserCheck className="h-4 w-4" />
              Usar esta persona
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
