"use client"

import type { ViviendaEstudiante, UpsertViviendaDTO } from "@/lib/types"

// ── Tipo del formulario ───────────────────────────────────────────────────────

export interface ViviendaFormData {
  tipo_paredes: string
  tipo_techo:   string
  tipo_pisos:   string
  num_banos:    string
  num_cuartos:  string
}

// ── Helpers de conversión ─────────────────────────────────────────────────────

export function viviendaFormVacio(): ViviendaFormData {
  return {
    tipo_paredes: "",
    tipo_techo:   "",
    tipo_pisos:   "",
    num_banos:    "",
    num_cuartos:  "",
  }
}

export function viviendaFromApi(v: ViviendaEstudiante): ViviendaFormData {
  return {
    tipo_paredes: v.tipo_paredes ?? "",
    tipo_techo:   v.tipo_techo   ?? "",
    tipo_pisos:   v.tipo_pisos   ?? "",
    num_banos:    v.num_banos  != null ? String(v.num_banos)  : "",
    num_cuartos:  v.num_cuartos != null ? String(v.num_cuartos) : "",
  }
}

export function viviendaToDTO(f: ViviendaFormData): UpsertViviendaDTO["vivienda"] {
  return {
    ...(f.tipo_paredes !== "" && { tipo_paredes: f.tipo_paredes }),
    ...(f.tipo_techo   !== "" && { tipo_techo:   f.tipo_techo }),
    ...(f.tipo_pisos   !== "" && { tipo_pisos:   f.tipo_pisos }),
    ...(f.num_banos    !== "" && { num_banos:    Number(f.num_banos) }),
    ...(f.num_cuartos  !== "" && { num_cuartos:  Number(f.num_cuartos) }),
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ViviendaEstudianteFormProps {
  data: ViviendaFormData
  onChange: (data: ViviendaFormData) => void
  disabled?: boolean
}

// ── Helpers de presentación ───────────────────────────────────────────────────

const inputCls =
  "w-full rounded border border-slate-200 px-3 py-1.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function ViviendaEstudianteForm({ data, onChange, disabled = false }: ViviendaEstudianteFormProps) {

  function handleChange(campo: keyof ViviendaFormData, valor: string) {
    onChange({ ...data, [campo]: valor })
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-xs font-semibold text-slate-500 uppercase tracking-wide pb-1 border-b border-slate-100 w-full">
        Características del hogar
      </legend>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Campo label="Tipo de paredes">
          <input
            type="text"
            disabled={disabled}
            value={data.tipo_paredes}
            onChange={(e) => handleChange("tipo_paredes", e.target.value)}
            placeholder="Ej: Ladrillo, Madera, Bahareque"
            className={inputCls}
          />
        </Campo>

        <Campo label="Tipo de techo">
          <input
            type="text"
            disabled={disabled}
            value={data.tipo_techo}
            onChange={(e) => handleChange("tipo_techo", e.target.value)}
            placeholder="Ej: Zinc, Concreto, Palma"
            className={inputCls}
          />
        </Campo>

        <Campo label="Tipo de pisos">
          <input
            type="text"
            disabled={disabled}
            value={data.tipo_pisos}
            onChange={(e) => handleChange("tipo_pisos", e.target.value)}
            placeholder="Ej: Cerámica, Cemento, Tierra"
            className={inputCls}
          />
        </Campo>

        <Campo label="Número de baños">
          <input
            type="number"
            min={0}
            disabled={disabled}
            value={data.num_banos}
            onChange={(e) => handleChange("num_banos", e.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </Campo>

        <Campo label="Número de cuartos">
          <input
            type="number"
            min={0}
            disabled={disabled}
            value={data.num_cuartos}
            onChange={(e) => handleChange("num_cuartos", e.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </Campo>
      </div>
    </fieldset>
  )
}