"use client"

import { useState, useEffect } from "react"
import type { ColegioAnterior } from "@/lib/types"
import {
  colegiosAnterioresApi
} from "@/lib/api/services/Colegiosanteriores"

// ─── tipos locales ────────────────────────────────────────────────────────────

// Fila dentro del formulario. Usa un id temporal (string) para que React
// pueda trackear correctamente cada fila con key= incluso antes de guardarse
// en la BD (donde el id sería un número real).
interface ColegioFila {
  _tempId:       string
  nombre_colegio: string
  ciudad:        string
  grado_cursado: string
  anio:          string   // string para el input, se parsea al guardar
}

function filaVacia(): ColegioFila {
  return {
    _tempId:        crypto.randomUUID(),
    nombre_colegio: "",
    ciudad:         "",
    grado_cursado:  "",
    anio:           "",
  }
}

function fromApi(c: ColegioAnterior): ColegioFila {
  return {
    _tempId:        String(c.colegio_ant_id),
    nombre_colegio: c.nombre_colegio,
    ciudad:         c.ciudad        ?? "",
    grado_cursado:  c.grado_cursado ?? "",
    anio:           c.anio          ? String(c.anio) : "",
  }
}

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  estudianteId: number
  /** Callback opcional: se llama tras guardar exitosamente */
  onGuardado?: (colegios: ColegioAnterior[]) => void
}

// ─── componente ───────────────────────────────────────────────────────────────

export default function ColegioAnteriorForm({ estudianteId, onGuardado }: Props) {
  const [filas, setFilas]       = useState<ColegioFila[]>([filaVacia()])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [exito, setExito]       = useState(false)

  // ── precargar datos existentes ─────────────────────────────────────────────
  useEffect(() => {
    setCargando(true)
    colegiosAnterioresApi.getByEstudiante(estudianteId)
      .then((res) => {
        const lista = res.data ?? []
        setFilas(lista.length > 0 ? lista.map(fromApi) : [filaVacia()])
      })
      .catch(() => {
        // Si falla la carga inicial, dejamos una fila vacía igualmente
        setFilas([filaVacia()])
      })
      .finally(() => setCargando(false))
  }, [estudianteId])

  // ── editar campo de una fila ───────────────────────────────────────────────
  function handleChange(
    tempId: string,
    campo: keyof Omit<ColegioFila, "_tempId">,
    valor: string
  ) {
    setFilas((prev) =>
      prev.map((f) => (f._tempId === tempId ? { ...f, [campo]: valor } : f))
    )
  }

  // ── agregar fila ──────────────────────────────────────────────────────────
  function agregarFila() {
    setFilas((prev) => [...prev, filaVacia()])
  }

  // ── eliminar fila ─────────────────────────────────────────────────────────
  function eliminarFila(tempId: string) {
    setFilas((prev) => {
      const nuevas = prev.filter((f) => f._tempId !== tempId)
      // Siempre dejamos al menos una fila vacía
      return nuevas.length > 0 ? nuevas : [filaVacia()]
    })
  }

  // ── guardar — llama replaceAll ─────────────────────────────────────────────
  async function handleGuardar() {
    setError(null)
    setExito(false)

    // Filtrar filas vacías (si el usuario agregó pero no llenó)
    const filasValidas = filas.filter((f) => f.nombre_colegio.trim() !== "")

    if (filasValidas.length === 0) {
      setError("Agrega al menos un colegio con nombre.")
      return
    }

    setGuardando(true)
    try {
      const colegios = filasValidas.map((f) => ({
        nombre_colegio: f.nombre_colegio.trim(),
        ...(f.ciudad        && { ciudad:        f.ciudad.trim() }),
        ...(f.grado_cursado && { grado_cursado: f.grado_cursado.trim() }),
        ...(f.anio          && { anio:          Number(f.anio) }),
      }))

      const res = await colegiosAnterioresApi.replaceAll(estudianteId, { colegios })
      const guardados = res.data ?? []
      setFilas(guardados.map(fromApi))
      setExito(true)
      onGuardado?.(guardados)

      setTimeout(() => setExito(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  // ── render ────────────────────────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-400 text-sm">
        Cargando colegios anteriores…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Colegios Anteriores
        </h3>
        <span className="text-xs text-slate-400">{filas.length} registro(s)</span>
      </div>

      {/* ── tabla de filas ── */}
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
            {filas.map((fila) => (
              <tr key={fila._tempId} className="bg-white hover:bg-slate-50/50 transition-colors">
                {/* nombre_colegio — obligatorio */}
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={fila.nombre_colegio}
                    onChange={(e) =>
                      handleChange(fila._tempId, "nombre_colegio", e.target.value)
                    }
                    placeholder="Ej: I.E. Simón Bolívar"
                    className="w-full min-w-[180px] rounded border border-slate-200 px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </td>

                {/* ciudad */}
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={fila.ciudad}
                    onChange={(e) =>
                      handleChange(fila._tempId, "ciudad", e.target.value)
                    }
                    placeholder="Ej: Barranquilla"
                    className="w-full min-w-[130px] rounded border border-slate-200 px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </td>

                {/* grado_cursado */}
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={fila.grado_cursado}
                    onChange={(e) =>
                      handleChange(fila._tempId, "grado_cursado", e.target.value)
                    }
                    placeholder="Ej: 5°"
                    className="w-full min-w-[100px] rounded border border-slate-200 px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </td>

                {/* anio */}
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={fila.anio}
                    onChange={(e) =>
                      handleChange(fila._tempId, "anio", e.target.value)
                    }
                    placeholder={String(new Date().getFullYear())}
                    min={1900}
                    max={new Date().getFullYear()}
                    className="w-full min-w-[80px] rounded border border-slate-200 px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </td>

                {/* eliminar fila */}
                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => eliminarFila(fila._tempId)}
                    title="Eliminar fila"
                    className="text-slate-300 hover:text-red-400 transition-colors p-1 rounded"
                  >
                    {/* ícono X simple — sin dependencia de librería de íconos */}
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

      {/* ── agregar fila ── */}
      <button
        type="button"
        onClick={agregarFila}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Agregar colegio
      </button>

      {/* ── feedback ── */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}
      {exito && (
        <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded px-3 py-2">
          Colegios guardados correctamente.
        </p>
      )}

      {/* ── guardar ── */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleGuardar}
          disabled={guardando}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {guardando ? "Guardando…" : "Guardar colegios"}
        </button>
      </div>
    </div>
  )
}
