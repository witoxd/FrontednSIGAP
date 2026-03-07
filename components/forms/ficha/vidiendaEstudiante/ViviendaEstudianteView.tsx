"use client"

import { useState, useEffect } from "react"
import type { ViviendaEstudiante } from "@/lib/types"
import {
  viviendaEstudianteApi,
} from "@/lib/api/services/viviendaEstudiante"

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  estudianteId:     number
  viviendaInicial?: ViviendaEstudiante
}

// ─── helpers de presentación ──────────────────────────────────────────────────

function Fila({ label, valor }: { label: string; valor?: string | number | null }) {
  const mostrar = valor != null && valor !== "" ? String(valor) : null

  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-700">
        {mostrar ?? <span className="text-slate-300 text-xs">—</span>}
      </dd>
    </div>
  )
}

// ─── componente principal ─────────────────────────────────────────────────────

export default function ViviendaEstudianteView({ estudianteId, viviendaInicial }: Props) {
  const [vivienda, setVivienda]  = useState<ViviendaEstudiante | null>(viviendaInicial ?? null)
  const [cargando, setCargando]  = useState(!viviendaInicial)
  const [error, setError]        = useState<string | null>(null)

  useEffect(() => {
    if (viviendaInicial) return

    setCargando(true)
    viviendaEstudianteApi
      .getByEstudiante(estudianteId)
      .then((res) => setVivienda(res.data ?? null))
      .catch(() => setError("No se pudo cargar la vivienda del estudiante."))
      .finally(() => setCargando(false))
  }, [estudianteId, viviendaInicial])

  if (cargando) {
    return (
      <div className="flex items-center gap-2 py-6 text-slate-400 text-sm">
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Cargando vivienda…
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

  if (!vivienda) {
    return (
      <div className="text-sm text-slate-400 italic py-4 text-center border border-dashed border-slate-200 rounded-lg">
        No hay datos de vivienda registrados para este estudiante.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide pb-1 border-b border-slate-100">
        Características del hogar
      </h4>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        <Fila label="Tipo de paredes" valor={vivienda.tipo_paredes} />
        <Fila label="Tipo de techo"   valor={vivienda.tipo_techo} />
        <Fila label="Tipo de pisos"   valor={vivienda.tipo_pisos} />
        <Fila label="Número de baños"   valor={vivienda.num_banos} />
        <Fila label="Número de cuartos" valor={vivienda.num_cuartos} />
      </dl>
    </div>
  )
}
