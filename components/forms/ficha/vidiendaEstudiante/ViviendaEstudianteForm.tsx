"use client"

import { useState, useEffect } from "react"
import type { ViviendaEstudiante } from "@/lib/types"
import {
  viviendaEstudianteApi
} from "@/lib/api/services/viviendaEstudiante"
import type { UpsertViviendaDTO } from "@/lib/types"

// ─── tipos locales ────────────────────────────────────────────────────────────

interface ViviendaForm {
  tipo_paredes: string
  tipo_techo:   string
  tipo_pisos:   string
  num_banos:    string
  num_cuartos:  string
}

function formVacio(): ViviendaForm {
  return {
    tipo_paredes: "",
    tipo_techo:   "",
    tipo_pisos:   "",
    num_banos:    "",
    num_cuartos:  "",
  }
}

function fromApi(v: ViviendaEstudiante): ViviendaForm {
  return {
    tipo_paredes: v.tipo_paredes ?? "",
    tipo_techo:   v.tipo_techo   ?? "",
    tipo_pisos:   v.tipo_pisos   ?? "",
    num_banos:    v.num_banos  != null ? String(v.num_banos)  : "",
    num_cuartos:  v.num_cuartos != null ? String(v.num_cuartos) : "",
  }
}

function toDTO(f: ViviendaForm): UpsertViviendaDTO["vivienda"] {
  return {
    ...(f.tipo_paredes !== "" && { tipo_paredes: f.tipo_paredes }),
    ...(f.tipo_techo   !== "" && { tipo_techo:   f.tipo_techo }),
    ...(f.tipo_pisos   !== "" && { tipo_pisos:   f.tipo_pisos }),
    ...(f.num_banos    !== "" && { num_banos:    Number(f.num_banos) }),
    ...(f.num_cuartos  !== "" && { num_cuartos:  Number(f.num_cuartos) }),
  }
}

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  estudianteId: number
  onGuardado?:  (vivienda: ViviendaEstudiante) => void
}

// ─── helpers de presentación ──────────────────────────────────────────────────

const inputCls =
  "w-full rounded border border-slate-200 px-3 py-1.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

// ─── componente principal ─────────────────────────────────────────────────────

export default function ViviendaEstudianteForm({ estudianteId, onGuardado }: Props) {
  const [form, setForm]           = useState<ViviendaForm>(formVacio())
  const [cargando, setCargando]   = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [exito, setExito]         = useState(false)

  useEffect(() => {
    setCargando(true)
    viviendaEstudianteApi
      .getByEstudiante(estudianteId)
      .then((res) => { if (res.data) setForm(fromApi(res.data)) })
      .catch(() => { /* vivienda inexistente — form vacío */ })
      .finally(() => setCargando(false))
  }, [estudianteId])

  function handleChange(campo: keyof ViviendaForm, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  async function handleGuardar() {
    setError(null)
    setExito(false)
    setGuardando(true)
    try {
      const res = await viviendaEstudianteApi.upsert(estudianteId, { vivienda: toDTO(form) })
      if (res.data) {
        setForm(fromApi(res.data))
        onGuardado?.(res.data)
      }
      setExito(true)
      setTimeout(() => setExito(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-400 text-sm">
        Cargando vivienda…
      </div>
    )
  }

  return (
    <div className="space-y-6">

      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold text-slate-500 uppercase tracking-wide pb-1 border-b border-slate-100 w-full">
          Características del hogar
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Campo label="Tipo de paredes">
            <input
              type="text"
              value={form.tipo_paredes}
              onChange={(e) => handleChange("tipo_paredes", e.target.value)}
              placeholder="Ej: Ladrillo, Madera, Bahareque"
              className={inputCls}
            />
          </Campo>

          <Campo label="Tipo de techo">
            <input
              type="text"
              value={form.tipo_techo}
              onChange={(e) => handleChange("tipo_techo", e.target.value)}
              placeholder="Ej: Zinc, Concreto, Palma"
              className={inputCls}
            />
          </Campo>

          <Campo label="Tipo de pisos">
            <input
              type="text"
              value={form.tipo_pisos}
              onChange={(e) => handleChange("tipo_pisos", e.target.value)}
              placeholder="Ej: Cerámica, Cemento, Tierra"
              className={inputCls}
            />
          </Campo>

          <Campo label="Número de baños">
            <input
              type="number"
              min={0}
              value={form.num_banos}
              onChange={(e) => handleChange("num_banos", e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </Campo>

          <Campo label="Número de cuartos">
            <input
              type="number"
              min={0}
              value={form.num_cuartos}
              onChange={(e) => handleChange("num_cuartos", e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </Campo>
        </div>
      </fieldset>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}
      {exito && (
        <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded px-3 py-2">
          Vivienda guardada correctamente.
        </p>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleGuardar}
          disabled={guardando}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {guardando ? "Guardando…" : "Guardar vivienda"}
        </button>
      </div>
    </div>
  )
}
