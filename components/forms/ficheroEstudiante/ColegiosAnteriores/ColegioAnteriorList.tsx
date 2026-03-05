"use client"

import { useState, useEffect } from "react"
import { ColegioAnterior } from "@/lib/types"
import {
  colegiosAnterioresApi,
} from "@/lib/api/services/Colegiosanteriores"

interface Props {
  estudianteId: number
  /** Si ya tienes los datos cargados desde el padre, pásalos para evitar el fetch */
  colegiosIniciales?: ColegioAnterior[]
}

export default function ColegioAnteriorList({ estudianteId, colegiosIniciales }: Props) {
  const [colegios, setColegios] = useState<ColegioAnterior[]>(colegiosIniciales ?? [])
  const [cargando, setCargando] = useState(!colegiosIniciales)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    if (colegiosIniciales) return  // datos ya provistos por el padre, no hacemos fetch

    setCargando(true)
    colegiosAnterioresApi.getByEstudiante(estudianteId)
      .then((res) => setColegios(res.data ?? []))
      .catch(() => setError("No se pudieron cargar los colegios anteriores."))
      .finally(() => setCargando(false))
  }, [estudianteId, colegiosIniciales])

  // ── estados de carga / error / vacío ─────────────────────────────────────

  if (cargando) {
    return (
      <div className="flex items-center gap-2 py-6 text-slate-400 text-sm">
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Cargando colegios anteriores…
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

  if (colegios.length === 0) {
    return (
      <div className="text-sm text-slate-400 italic py-4 text-center border border-dashed border-slate-200 rounded-lg">
        No hay colegios anteriores registrados.
      </div>
    )
  }

  // ── tabla ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Colegios Anteriores
        </h3>
        <span className="text-xs text-slate-400">{colegios.length} registro(s)</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-2 text-left font-medium">#</th>
              <th className="px-4 py-2 text-left font-medium">Colegio</th>
              <th className="px-4 py-2 text-left font-medium">Ciudad</th>
              <th className="px-4 py-2 text-left font-medium">Grado</th>
              <th className="px-4 py-2 text-left font-medium">Año</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {colegios.map((c, idx) => (
              <tr key={c.colegio_ant_id} className="bg-white hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-2 text-slate-400 tabular-nums">{idx + 1}</td>
                <td className="px-4 py-2 font-medium text-slate-800">{c.nombre_colegio}</td>
                <td className="px-4 py-2 text-slate-500">{c.ciudad ?? <EmptyCell />}</td>
                <td className="px-4 py-2 text-slate-500">{c.grado_cursado ?? <EmptyCell />}</td>
                <td className="px-4 py-2 text-slate-500 tabular-nums">{c.anio ?? <EmptyCell />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Celda vacía — más limpio que mostrar "undefined" o "-"
function EmptyCell() {
  return <span className="text-slate-300 text-xs">—</span>
}
