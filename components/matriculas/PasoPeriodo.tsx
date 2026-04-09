"use client"

import { useState, useEffect } from "react"
import {
  CalendarClock, CheckCircle2, Lock, Loader2,
  ArrowRight, AlertCircle,
} from "lucide-react"
import { periodoMatriculaApi, type PeriodoMatricula } from "@/lib/api/services/periodoMatricula"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit", month: "long", year: "numeric",
  })
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface PasoPeriodoProps {
  periodo:     PeriodoMatricula | null
  onConfirmar: (periodo: PeriodoMatricula) => void
}

// ── Componente ────────────────────────────────────────────────────────────────

export function PasoPeriodo({ periodo: periodoInicial, onConfirmar }: PasoPeriodoProps) {
  const [periodo,  setPeriodo]  = useState<PeriodoMatricula | null>(periodoInicial)
  const [abierto,  setAbierto]  = useState(false)
  const [loading,  setLoading]  = useState(!periodoInicial)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    // Si ya viene precargado del stepper, no volver a consultar
    if (periodoInicial) {
      setPeriodo(periodoInicial)
      setAbierto(true)
      setLoading(false)
      return
    }

    periodoMatriculaApi.getActivo()
      .then((res) => {
        setPeriodo(res.data ?? null)
        setAbierto(res.abierto)
      })
      .catch(() => setError("No se pudo verificar el período de matrícula"))
      .finally(() => setLoading(false))
  }, [])

  // ── Render: cargando ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Verificando período de matrícula...</p>
      </div>
    )
  }

  // ── Render: error de red ───────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>
        <div className="text-center">
          <p className="font-medium text-foreground">{error}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Verifica tu conexión e intenta nuevamente.
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); setError(null) }}
          className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  // ── Render: período cerrado ────────────────────────────────────────────────

  if (!abierto || !periodo) {
    return (
      <div className="flex flex-col items-center gap-6 py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center max-w-sm">
          <h3 className="text-lg font-semibold text-foreground">
            Proceso de matrícula cerrado
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            No hay ningún período de matrícula activo en este momento.
            Contacta al administrador del sistema para habilitar el proceso.
          </p>
        </div>

        {/* Separador */}
        <div className="w-full max-w-sm border-t border-border" />

        <p className="text-xs text-muted-foreground text-center">
          Solo un administrador puede abrir o cerrar el período de matrícula.
        </p>
      </div>
    )
  }

  // ── Render: período activo ─────────────────────────────────────────────────

  const diasRestantes = Math.ceil(
    (new Date(periodo.fecha_fin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* Tarjeta principal del período */}
      <div className="rounded-xl border border-success/30 bg-success/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/15">
            <CheckCircle2 className="h-6 w-6 text-success" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-foreground">
                {periodo.descripcion ?? `Matrícula ${periodo.anio}`}
              </h3>
              <span className="text-xs font-medium bg-success/15 text-success px-2 py-0.5 rounded-full">
                Activo
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Año escolar {periodo.anio}
            </p>
          </div>
        </div>

        {/* Fechas */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <DatoCard
            label="Inicio del proceso"
            valor={formatFecha(periodo.fecha_inicio as unknown as string)}
            icon={<CalendarClock className="h-4 w-4" />}
          />
          <DatoCard
            label="Cierre del proceso"
            valor={formatFecha(periodo.fecha_fin as unknown as string)}
            icon={<CalendarClock className="h-4 w-4" />}
          />
          <DatoCard
            label="Tiempo restante"
            valor={
              diasRestantes > 0
                ? `${diasRestantes} día${diasRestantes !== 1 ? "s" : ""}`
                : "Cierra hoy"
            }
            icon={<CalendarClock className="h-4 w-4" />}
            destacado={diasRestantes <= 3}
          />
        </div>
      </div>

      {/* Advertencia si queda poco tiempo */}
      {diasRestantes <= 3 && diasRestantes > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <p className="text-sm text-warning-foreground">
            El período de matrícula cierra en {diasRestantes} día{diasRestantes !== 1 ? "s" : ""}.
            Las matrículas no guardadas se perderán.
          </p>
        </div>
      )}

      {/* Botón continuar */}
      <div className="flex justify-end">
        <button
          onClick={() => onConfirmar(periodo)}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Continuar al registro
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ── Sub-componente de dato ────────────────────────────────────────────────────

function DatoCard({
  label,
  valor,
  icon,
  destacado = false,
}: {
  label:      string
  valor:      string
  icon:       React.ReactNode
  destacado?: boolean
}) {
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${
      destacado
        ? "border-warning/30 bg-warning/5"
        : "border-border bg-background"
    }`}>
      <div className={`flex items-center gap-1.5 text-xs mb-1 ${
        destacado ? "text-warning" : "text-muted-foreground"
      }`}>
        {icon}
        {label}
      </div>
      <p className={`text-sm font-medium ${
        destacado ? "text-warning-foreground" : "text-foreground"
      }`}>
        {valor}
      </p>
    </div>
  )
}
