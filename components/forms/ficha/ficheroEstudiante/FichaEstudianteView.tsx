"use client"
import type { FichaEstudiante } from "@/lib/types"
import { useState, useEffect } from "react"
import {
  fichaEstudianteApi
} from "@/lib/api/services/fichaEstudiante"

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  estudianteId:       number
  fichaInicial?:      FichaEstudiante   // opcional: evita el fetch si ya tienes el dato
}

// ─── sub-componentes ──────────────────────────────────────────────────────────

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide pb-1 border-b border-slate-100">
        {titulo}
      </h4>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {children}
      </dl>
    </div>
  )
}

function Fila({ label, valor }: { label: string; valor?: string | number | boolean | null }) {
  const mostrar = (() => {
    if (valor === null || valor === undefined || valor === "") return null
    if (typeof valor === "boolean") return valor ? "Sí" : "No"
    return String(valor)
  })()

  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-700">
        {mostrar ?? <span className="text-slate-300 text-xs">—</span>}
      </dd>
    </div>
  )
}

// Para campos de texto largo (textarea en el form) ocupamos todo el ancho
function FilaAncha({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <div className="sm:col-span-2 flex flex-col gap-0.5">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-700 whitespace-pre-wrap">
        {valor?.trim() || <span className="text-slate-300 text-xs">—</span>}
      </dd>
    </div>
  )
}

// ─── componente principal ─────────────────────────────────────────────────────

export default function FichaEstudianteView({ estudianteId, fichaInicial }: Props) {
  const [ficha, setFicha]       = useState<FichaEstudiante | null>(fichaInicial ?? null)
  const [cargando, setCargando] = useState(!fichaInicial)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    if (fichaInicial) return

    setCargando(true)
    fichaEstudianteApi
      .getByEstudiante(estudianteId)
      .then((res) => setFicha(res.data ?? null))
      .catch(() => setError("No se pudo cargar la ficha del estudiante."))
      .finally(() => setCargando(false))
  }, [estudianteId, fichaInicial])

  if (cargando) {
    return (
      <div className="flex items-center gap-2 py-6 text-slate-400 text-sm">
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Cargando ficha…
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
        {error}
      </p>
    )
  }

  if (!ficha) {
    return (
      <div className="text-sm text-slate-400 italic py-4 text-center border border-dashed border-slate-200 rounded-lg">
        No hay ficha registrada para este estudiante.
      </div>
    )
  }

  return (
    <div className="space-y-6">

      <Seccion titulo="Contexto familiar">
        <Fila label="Número de hermanos"      valor={ficha.numero_hermanos} />
        <Fila label="Posición entre hermanos" valor={ficha.posicion_hermanos} />
        <Fila label="Nombre del hermano mayor" valor={ficha.nombre_hermano_mayor} />
        <Fila label="Total personas en hogar" valor={ficha.total_parientes} />
        <FilaAncha label="Parientes en el hogar" valor={ficha.parientes_hogar} />
      </Seccion>

      <Seccion titulo="Contexto escolar">
        <Fila label="Motivo de traslado" valor={ficha.motivo_traslado} />
        <FilaAncha label="Limitaciones físicas"  valor={ficha.limitaciones_fisicas} />
        <FilaAncha label="Otras limitaciones"    valor={ficha.otras_limitaciones} />
        <FilaAncha label="Talentos especiales"   valor={ficha.talentos_especiales} />
        <FilaAncha label="Otras actividades"     valor={ficha.otras_actividades} />
      </Seccion>

      <Seccion titulo="Datos médicos">
        <Fila label="EPS / ARS"                valor={ficha.eps_ars} />
        <Fila label="Centro de atención médica" valor={ficha.centro_atencion_medica} />
        <FilaAncha label="Alergias"            valor={ficha.alergia} />
      </Seccion>

      <Seccion titulo="Transporte">
        <Fila label="Medio de transporte"   valor={ficha.medio_transporte} />
        <Fila label="Transporte propio"     valor={ficha.transporte_propio} />
      </Seccion>

      <Seccion titulo="Observaciones generales">
        <FilaAncha label="" valor={ficha.observaciones} />
      </Seccion>

    </div>
  )
}
