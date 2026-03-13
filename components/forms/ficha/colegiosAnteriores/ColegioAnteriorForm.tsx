"use client"

import type { ReplaceColegiosDTO } from "@/lib/types"

// ── Tipo de fila del formulario ───────────────────────────────────────────────
// Usa _tempId como string para que React pueda hacer key= estable
// incluso antes de que el backend asigne un id real.

export interface ColegioFila {
  _tempId:        string
  nombre_colegio: string
  ciudad:         string
  grado_cursado:  string
  anio:           string
}

export type ColegiosFormData = ColegioFila[]

// ── Helpers de conversión ─────────────────────────────────────────────────────

export function colegioFilaVacia(): ColegioFila {
  return {
    _tempId:        crypto.randomUUID(),
    nombre_colegio: "",
    ciudad:         "",
    grado_cursado:  "",
    anio:           "",
  }
}

export function colegiosFormVacio(): ColegiosFormData {
  return [colegioFilaVacia()]
}

export function colegiosFromApi(colegios: { colegio_ant_id: number; nombre_colegio: string; ciudad?: string; grado_cursado?: string; anio?: number }[]): ColegiosFormData {
  if (colegios.length === 0) return colegiosFormVacio()
  return colegios.map((c) => ({
    _tempId:        String(c.colegio_ant_id),
    nombre_colegio: c.nombre_colegio,
    ciudad:         c.ciudad        ?? "",
    grado_cursado:  c.grado_cursado ?? "",
    anio:           c.anio          ? String(c.anio) : "",
  }))
}

/**
 * Convierte las filas al array que espera el backend.
 * Filtra filas sin nombre — el usuario puede haber agregado una fila vacía
 * y no haberla llenado.
 */
export function colegiosToDTO(filas: ColegiosFormData): ReplaceColegiosDTO["colegios"] {
  return filas
    .filter((f) => f.nombre_colegio.trim() !== "")
    .map((f) => ({
      nombre_colegio: f.nombre_colegio.trim(),
      ...(f.ciudad        && { ciudad:        f.ciudad.trim() }),
      ...(f.grado_cursado && { grado_cursado: f.grado_cursado.trim() }),
      ...(f.anio          && { anio:          Number(f.anio) }),
    }))
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ColegioAnteriorFormProps {
  data: ColegiosFormData
  onChange: (data: ColegiosFormData) => void
  disabled?: boolean
}

// ── Componente principal ──────────────────────────────────────────────────────

export function ColegioAnteriorForm({ data, onChange, disabled = false }: ColegioAnteriorFormProps) {

  function handleChangeField(
    tempId: string,
    campo: keyof Omit<ColegioFila, "_tempId">,
    valor: string
  ) {
    onChange(data.map((f) => (f._tempId === tempId ? { ...f, [campo]: valor } : f)))
  }

  function agregarFila() {
    onChange([...data, colegioFilaVacia()])
  }

  function eliminarFila(tempId: string) {
    const nuevas = data.filter((f) => f._tempId !== tempId)
    onChange(nuevas.length > 0 ? nuevas : [colegioFilaVacia()])
  }

  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{data.length} registro(s)</span>
      </div>

      {/* ── Tabla de filas ── */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Nombre del colegio *</th>
              <th className="px-3 py-2 text-left font-medium">Ciudad</th>
              <th className="px-3 py-2 text-left font-medium">Grado cursado</th>
              <th className="px-3 py-2 text-left font-medium">Año</th>
              <th className="px-3 py-2 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((fila) => (
              <tr key={fila._tempId} className="bg-white hover:bg-slate-50/50 transition-colors">

                <td className="px-3 py-2">
                  <input
                    type="text"
                    disabled={disabled}
                    value={fila.nombre_colegio}
                    onChange={(e) => handleChangeField(fila._tempId, "nombre_colegio", e.target.value)}
                    placeholder="Ej: I.E. Simón Bolívar"
                    className="w-full min-w-[180px] rounded border border-slate-200 px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                </td>

                <td className="px-3 py-2">
                  <input
                    type="text"
                    disabled={disabled}
                    value={fila.ciudad}
                    onChange={(e) => handleChangeField(fila._tempId, "ciudad", e.target.value)}
                    placeholder="Ej: Barranquilla"
                    className="w-full min-w-[130px] rounded border border-slate-200 px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                </td>

                <td className="px-3 py-2">
                  <input
                    type="text"
                    disabled={disabled}
                    value={fila.grado_cursado}
                    onChange={(e) => handleChangeField(fila._tempId, "grado_cursado", e.target.value)}
                    placeholder="Ej: 5°"
                    className="w-full min-w-[100px] rounded border border-slate-200 px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                </td>

                <td className="px-3 py-2">
                  <input
                    type="number"
                    disabled={disabled}
                    value={fila.anio}
                    onChange={(e) => handleChangeField(fila._tempId, "anio", e.target.value)}
                    placeholder={String(new Date().getFullYear())}
                    min={1900}
                    max={new Date().getFullYear()}
                    className="w-full min-w-[80px] rounded border border-slate-200 px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                </td>

                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => eliminarFila(fila._tempId)}
                    title="Eliminar fila"
                    className="text-slate-300 hover:text-red-400 transition-colors p-1 rounded disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Agregar fila ── */}
      <button
        type="button"
        disabled={disabled}
        onClick={agregarFila}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Agregar colegio
      </button>

    </div>
  )
}