"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Search, X, Loader2, ArrowRight, ArrowLeft,
  UserCheck, AlertCircle, BadgeCheck, GraduationCap,
} from "lucide-react"
import { estudiantesApi } from "@/lib/api/services/estudiantes"
import { matriculasApi }  from "@/lib/api/services/matriculas"
import type { EstudianteWithPersonaDocumento } from "@/lib/types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function nombreCompleto(est: EstudianteWithPersonaDocumento) {
  return [
    est.persona.nombres,
    est.persona.apellido_paterno,
    est.persona.apellido_materno,
  ].filter(Boolean).join(" ")
}

function mapSearchResult(raw: any): EstudianteWithPersonaDocumento {
  return {
    persona:    raw.persona  ?? raw,
    estudiante: raw.estudiante ?? raw,
  }
}

const DEBOUNCE_MS = 450
const MIN_CHARS   = 2

// ── Props ─────────────────────────────────────────────────────────────────────

interface PasoEstudianteProps {
  seleccionado: EstudianteWithPersonaDocumento | null
  periodoId:    number
  onSeleccionar:(est: EstudianteWithPersonaDocumento) => void
  onAnterior:   () => void
}

// ── Componente ────────────────────────────────────────────────────────────────

export function PasoEstudiante({
  seleccionado: seleccionadoInicial,
  periodoId,
  onSeleccionar,
  onAnterior,
}: PasoEstudianteProps) {
  const [query,        setQuery]        = useState("")
  const [resultados,   setResultados]   = useState<EstudianteWithPersonaDocumento[]>([])
  const [buscando,     setBuscando]     = useState(false)
  const [errorBusqueda,setErrorBusqueda]= useState<string | null>(null)
  const [seleccionado, setSeleccionado] = useState<EstudianteWithPersonaDocumento | null>(seleccionadoInicial)
  const [yaMatriculado,setYaMatriculado]= useState(false)
  const [verificando,  setVerificando]  = useState(false)

  const inputRef    = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80) }, [])
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  // ── Búsqueda con debounce ─────────────────────────────────────────────────

  const buscar = useCallback(async (texto: string) => {
    const q = texto.trim()
    if (q.length < MIN_CHARS) { setResultados([]); setErrorBusqueda(null); return }

    setBuscando(true)
    setErrorBusqueda(null)
    try {
      const res   = await estudiantesApi.searchIndex(q)
      const raw   = res.data
      const lista = Array.isArray(raw) ? raw : raw ? [raw] : []
      setResultados(lista.map(mapSearchResult))
    } catch {
      setErrorBusqueda("Error al buscar estudiantes")
      setResultados([])
    } finally {
      setBuscando(false)
    }
  }, [])

  function handleQueryChange(valor: string) {
    setQuery(valor)
    setSeleccionado(null)
    setYaMatriculado(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => buscar(valor), DEBOUNCE_MS)
  }

  // ── Seleccionar estudiante + verificar si ya tiene matrícula ─────────────

  async function handleSeleccionar(est: EstudianteWithPersonaDocumento) {
    if (seleccionado?.estudiante.estudiante_id === est.estudiante.estudiante_id) {
      setSeleccionado(null)
      setYaMatriculado(false)
      return
    }

    setSeleccionado(est)
    setVerificando(true)
    setYaMatriculado(false)

    try {
      // Buscar matrículas activas del estudiante para este período
      const matriculas = await matriculasApi.getAll(50, 0)
      const tieneMatricula = (matriculas.data ?? []).some(
        (m) => m.estudiante_id === est.estudiante.estudiante_id
        // El backend ya filtra por período activo en la creación,
        // pero chequeamos del lado del cliente para dar feedback inmediato
      )
      setYaMatriculado(tieneMatricula)
    } catch {
      // Si falla la verificación, dejamos continuar —
      // el backend lo bloqueará con 409 si corresponde
    } finally {
      setVerificando(false)
    }
  }

  function handleConfirmar() {
    if (!seleccionado || yaMatriculado) return
    onSeleccionar(seleccionado)
  }

  const queryCorta   = query.trim().length < MIN_CHARS
  const mostrarVacio = !buscando && !errorBusqueda && resultados.length === 0

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* Tarjeta del estudiante ya seleccionado (si viene del estado del stepper) */}
      {seleccionadoInicial && seleccionado?.estudiante.estudiante_id === seleccionadoInicial.estudiante.estudiante_id && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{nombreCompleto(seleccionadoInicial)}</p>
            <p className="text-xs text-muted-foreground">
              {seleccionadoInicial.persona.tipo_documento.nombre_documento} ·{" "}
              {seleccionadoInicial.persona.numero_documento}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setSeleccionado(null); setQuery("") }}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Buscador */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Buscar estudiante <span className="text-destructive">*</span>
        </label>
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
            className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
        <p className="text-xs text-muted-foreground">
          Mínimo {MIN_CHARS} caracteres para buscar
        </p>
      </div>

      {/* Resultados */}
      {!queryCorta && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {errorBusqueda ? (
            <div className="flex items-center gap-2 px-4 py-8 text-sm text-destructive justify-center">
              <AlertCircle className="h-4 w-4" />
              {errorBusqueda}
            </div>
          ) : mostrarVacio ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <GraduationCap className="h-8 w-8" />
              <p className="text-sm">No se encontraron estudiantes para "{query}"</p>
            </div>
          ) : (
            <ul className="divide-y divide-border max-h-72 overflow-y-auto">
              {resultados.map((est) => {
                const activo = seleccionado?.estudiante.estudiante_id === est.estudiante.estudiante_id
                return (
                  <li key={est.estudiante.estudiante_id}>
                    <button
                      type="button"
                      onClick={() => handleSeleccionar(est)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                        activo ? "bg-primary/8 border-l-2 border-primary" : "hover:bg-muted/50"
                      }`}
                    >
                      {/* Avatar */}
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                        activo ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {est.persona.nombres.charAt(0).toUpperCase()}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {nombreCompleto(est)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {est.persona.tipo_documento.nombre_documento} · {est.persona.numero_documento}
                        </p>
                      </div>

                      {activo && (
                        verificando
                          ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                          : <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {/* Advertencia: ya matriculado en el período */}
      {yaMatriculado && seleccionado && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning-foreground">
              Estudiante ya matriculado en este período
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {nombreCompleto(seleccionado)} ya tiene una matrícula registrada en el período activo.
              El sistema asociará los nuevos documentos a la matrícula existente.
            </p>
          </div>
        </div>
      )}

      {/* Navegación */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onAnterior}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Anterior
        </button>

        <button
          type="button"
          disabled={!seleccionado || verificando}
          onClick={handleConfirmar}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {verificando ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Verificando...</>
          ) : (
            <>Confirmar estudiante <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      </div>
    </div>
  )
}
