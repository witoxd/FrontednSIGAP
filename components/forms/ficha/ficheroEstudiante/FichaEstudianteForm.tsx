"use client"

import { useState, useEffect } from "react"
import { FichaEstudiante } from "@/lib/types"
import {
  fichaEstudianteApi
} from "@/lib/api/services/fichaEstudiante"
import type { UpsertFichaDTO } from "@/lib/types"

// ─── tipos locales ────────────────────────────────────────────────────────────
// Todo como string para los inputs, excepto los booleanos.
// Se convierte a los tipos correctos solo al guardar.

interface FichaForm {
  // Contexto familiar
  numero_hermanos:      string
  posicion_hermanos:    string
  nombre_hermano_mayor: string
  parientes_hogar:      string
  total_parientes:      string
  // Contexto escolar
  motivo_traslado:      string
  limitaciones_fisicas: string
  otras_limitaciones:   string
  talentos_especiales:  string
  otras_actividades:    string
  // Médico
  eps_ars:              string
  alergia:              string
  centro_atencion_medica: string
  // Transporte
  medio_transporte:     string
  transporte_propio:    boolean
  // General
  observaciones:        string
}

function formVacio(): FichaForm {
  return {
    numero_hermanos:      "",
    posicion_hermanos:    "",
    nombre_hermano_mayor: "",
    parientes_hogar:      "",
    total_parientes:      "",
    motivo_traslado:      "",
    limitaciones_fisicas: "",
    otras_limitaciones:   "",
    talentos_especiales:  "",
    otras_actividades:    "",
    eps_ars:              "",
    alergia:              "",
    centro_atencion_medica: "",
    medio_transporte:     "",
    transporte_propio:    false,
    observaciones:        "",
  }
}

function fromApi(f: FichaEstudiante): FichaForm {
  return {
    numero_hermanos:      f.numero_hermanos      != null ? String(f.numero_hermanos)   : "",
    posicion_hermanos:    f.posicion_hermanos     != null ? String(f.posicion_hermanos) : "",
    nombre_hermano_mayor: f.nombre_hermano_mayor  ?? "",
    parientes_hogar:      f.parientes_hogar       ?? "",
    total_parientes:      f.total_parientes       != null ? String(f.total_parientes)  : "",
    motivo_traslado:      f.motivo_traslado       ?? "",
    limitaciones_fisicas: f.limitaciones_fisicas  ?? "",
    otras_limitaciones:   f.otras_limitaciones    ?? "",
    talentos_especiales:  f.talentos_especiales   ?? "",
    otras_actividades:    f.otras_actividades     ?? "",
    eps_ars:              f.eps_ars               ?? "",
    alergia:              f.alergia               ?? "",
    centro_atencion_medica: f.centro_atencion_medica ?? "",
    medio_transporte:     f.medio_transporte      ?? "",
    transporte_propio:    f.transporte_propio     ?? false,
    observaciones:        f.observaciones         ?? "",
  }
}

// Convierte el form de vuelta al DTO — omite campos vacíos para no pisar
// datos con strings vacíos (el backend hace upsert, no queremos borrar datos)
function toDTO(f: FichaForm): UpsertFichaDTO["ficha"] {
  return {
    ...(f.numero_hermanos      !== "" && { numero_hermanos:      Number(f.numero_hermanos) }),
    ...(f.posicion_hermanos    !== "" && { posicion_hermanos:    Number(f.posicion_hermanos) }),
    ...(f.nombre_hermano_mayor !== "" && { nombre_hermano_mayor: f.nombre_hermano_mayor }),
    ...(f.parientes_hogar      !== "" && { parientes_hogar:      f.parientes_hogar }),
    ...(f.total_parientes      !== "" && { total_parientes:      Number(f.total_parientes) }),
    ...(f.motivo_traslado      !== "" && { motivo_traslado:      f.motivo_traslado }),
    ...(f.limitaciones_fisicas !== "" && { limitaciones_fisicas: f.limitaciones_fisicas }),
    ...(f.otras_limitaciones   !== "" && { otras_limitaciones:   f.otras_limitaciones }),
    ...(f.talentos_especiales  !== "" && { talentos_especiales:  f.talentos_especiales }),
    ...(f.otras_actividades    !== "" && { otras_actividades:    f.otras_actividades }),
    ...(f.eps_ars              !== "" && { eps_ars:              f.eps_ars }),
    ...(f.alergia              !== "" && { alergia:              f.alergia }),
    ...(f.centro_atencion_medica !== "" && { centro_atencion_medica: f.centro_atencion_medica }),
    ...(f.medio_transporte     !== "" && { medio_transporte:     f.medio_transporte }),
    transporte_propio: f.transporte_propio,
    ...(f.observaciones        !== "" && { observaciones:        f.observaciones }),
  }
}

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  estudianteId: number
  onGuardado?: (ficha: FichaEstudiante) => void
}

// ─── sub-componentes ──────────────────────────────────────────────────────────

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-xs font-semibold text-slate-500 uppercase tracking-wide pb-1 border-b border-slate-100 w-full">
        {titulo}
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {children}
      </div>
    </fieldset>
  )
}

function Campo({
  label,
  children,
  fullWidth = false,
}: {
  label: string
  children: React.ReactNode
  fullWidth?: boolean
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  "w-full rounded border border-slate-200 px-3 py-1.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

const textareaCls =
  "w-full rounded border border-slate-200 px-3 py-1.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"

// ─── componente principal ─────────────────────────────────────────────────────

export default function FichaEstudianteForm({ estudianteId, onGuardado }: Props) {
  const [form, setForm]         = useState<FichaForm>(formVacio())
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [exito, setExito]       = useState(false)

  useEffect(() => {
    setCargando(true)
    fichaEstudianteApi
      .getByEstudiante(estudianteId)
      .then((res) => { if (res.data) setForm(fromApi(res.data)) })
      .catch(() => { /* ficha inexistente — dejamos el form vacío */ })
      .finally(() => setCargando(false))
  }, [estudianteId])

  function handleChange(
    campo: keyof FichaForm,
    valor: string | boolean
  ) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  async function handleGuardar() {
    setError(null)
    setExito(false)
    setGuardando(true)
    try {
      const res = await fichaEstudianteApi.upsert(estudianteId, { ficha: toDTO(form) })
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
        Cargando ficha…
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Contexto familiar ── */}
      <Seccion titulo="Contexto familiar">
        <Campo label="Número de hermanos">
          <input
            type="number" min={0}
            value={form.numero_hermanos}
            onChange={(e) => handleChange("numero_hermanos", e.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </Campo>

        <Campo label="Posición entre hermanos">
          <input
            type="number" min={1}
            value={form.posicion_hermanos}
            onChange={(e) => handleChange("posicion_hermanos", e.target.value)}
            placeholder="1 = el mayor"
            className={inputCls}
          />
        </Campo>

        <Campo label="Nombre del hermano mayor">
          <input
            type="text"
            value={form.nombre_hermano_mayor}
            onChange={(e) => handleChange("nombre_hermano_mayor", e.target.value)}
            placeholder="Ej: Juan Pérez"
            className={inputCls}
          />
        </Campo>

        <Campo label="Total de personas en el hogar">
          <input
            type="number" min={0}
            value={form.total_parientes}
            onChange={(e) => handleChange("total_parientes", e.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </Campo>

        <Campo label="Parientes en el hogar" fullWidth>
          <input
            type="text"
            value={form.parientes_hogar}
            onChange={(e) => handleChange("parientes_hogar", e.target.value)}
            placeholder="Ej: abuela, tío, primo"
            className={inputCls}
          />
        </Campo>
      </Seccion>

      {/* ── Contexto escolar ── */}
      <Seccion titulo="Contexto escolar">
        <Campo label="Motivo de traslado" fullWidth>
          <input
            type="text"
            value={form.motivo_traslado}
            onChange={(e) => handleChange("motivo_traslado", e.target.value)}
            placeholder="Ej: cambio de residencia"
            className={inputCls}
          />
        </Campo>

        <Campo label="Limitaciones físicas" fullWidth>
          <textarea
            rows={2}
            value={form.limitaciones_fisicas}
            onChange={(e) => handleChange("limitaciones_fisicas", e.target.value)}
            placeholder="Describe las limitaciones físicas si aplica"
            className={textareaCls}
          />
        </Campo>

        <Campo label="Otras limitaciones" fullWidth>
          <textarea
            rows={2}
            value={form.otras_limitaciones}
            onChange={(e) => handleChange("otras_limitaciones", e.target.value)}
            placeholder="Otras condiciones relevantes"
            className={textareaCls}
          />
        </Campo>

        <Campo label="Talentos especiales" fullWidth>
          <textarea
            rows={2}
            value={form.talentos_especiales}
            onChange={(e) => handleChange("talentos_especiales", e.target.value)}
            placeholder="Ej: música, deporte, arte"
            className={textareaCls}
          />
        </Campo>

        <Campo label="Otras actividades" fullWidth>
          <textarea
            rows={2}
            value={form.otras_actividades}
            onChange={(e) => handleChange("otras_actividades", e.target.value)}
            placeholder="Actividades extracurriculares"
            className={textareaCls}
          />
        </Campo>
      </Seccion>

      {/* ── Datos médicos ── */}
      <Seccion titulo="Datos médicos">
        <Campo label="EPS / ARS">
          <input
            type="text"
            value={form.eps_ars}
            onChange={(e) => handleChange("eps_ars", e.target.value)}
            placeholder="Ej: Sura, Coosalud"
            className={inputCls}
          />
        </Campo>

        <Campo label="Centro de atención médica">
          <input
            type="text"
            value={form.centro_atencion_medica}
            onChange={(e) => handleChange("centro_atencion_medica", e.target.value)}
            placeholder="Ej: Clínica del Norte"
            className={inputCls}
          />
        </Campo>

        <Campo label="Alergias" fullWidth>
          <textarea
            rows={2}
            value={form.alergia}
            onChange={(e) => handleChange("alergia", e.target.value)}
            placeholder="Describe alergias conocidas"
            className={textareaCls}
          />
        </Campo>
      </Seccion>

      {/* ── Transporte ── */}
      <Seccion titulo="Transporte">
        <Campo label="Medio de transporte">
          <input
            type="text"
            value={form.medio_transporte}
            onChange={(e) => handleChange("medio_transporte", e.target.value)}
            placeholder="Ej: Bus, Moto, A pie"
            className={inputCls}
          />
        </Campo>

        <Campo label="Transporte propio">
          <label className="flex items-center gap-2 mt-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.transporte_propio}
              onChange={(e) => handleChange("transporte_propio", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-600">El estudiante dispone de transporte propio</span>
          </label>
        </Campo>
      </Seccion>

      {/* ── Observaciones ── */}
      <Seccion titulo="Observaciones generales">
        <Campo label="" fullWidth>
          <textarea
            rows={3}
            value={form.observaciones}
            onChange={(e) => handleChange("observaciones", e.target.value)}
            placeholder="Observaciones adicionales"
            className={textareaCls}
          />
        </Campo>
      </Seccion>

      {/* ── Feedback ── */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}
      {exito && (
        <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded px-3 py-2">
          Ficha guardada correctamente.
        </p>
      )}

      {/* ── Guardar ── */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleGuardar}
          disabled={guardando}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {guardando ? "Guardando…" : "Guardar ficha"}
        </button>
      </div>
    </div>
  )
}
