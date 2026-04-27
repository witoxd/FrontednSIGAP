"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { FileText, Plus, Loader2, Pencil, Trash2, X } from "lucide-react"
import { swrFetcher } from "@/lib/api/fetcher"
import { procesosInscripcionApi, type ProcesoInscripcion, type CreateProcesoInput } from "@/lib/api/services/procesosInscripcion"
import { periodoMatriculaApi, type PeriodoMatricula } from "@/lib/api/services/periodoMatricula"

const NOMBRES_PROCESO = ["Ordinaria", "Extraordinaria", "Especial"] as const

// ── Drawer ────────────────────────────────────────────────────────────────────

interface ProcesoDrawerProps {
  open:      boolean
  editando?: ProcesoInscripcion | null
  onClose:   () => void
  onSuccess: () => void
}

function ProcesoDrawer({ open, editando, onClose, onSuccess }: ProcesoDrawerProps) {
  const [periodoId,   setPeriodoId]   = useState("")
  const [nombre,      setNombre]      = useState<string>(NOMBRES_PROCESO[0])
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin,    setFechaFin]    = useState("")
  const [saving,      setSaving]      = useState(false)

  const { data: periodosData } = useSWR<{ success: boolean; data: PeriodoMatricula[] }>(
    "/periodos-matricula/getAll",
    swrFetcher,
  )
  const periodos = periodosData?.data ?? []

  useEffect(() => {
    if (open) {
      setPeriodoId(editando?.periodo_id?.toString() ?? "")
      setNombre(editando?.nombre ?? NOMBRES_PROCESO[0])
      setFechaInicio(editando?.fecha_inicio_inscripcion?.slice(0, 10) ?? "")
      setFechaFin(editando?.fecha_fin_inscripcion?.slice(0, 10) ?? "")
    }
  }, [open, editando])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!periodoId || !nombre || !fechaInicio || !fechaFin) return
    setSaving(true)
    try {
      const procesoData = {
        periodo_id:               parseInt(periodoId),
        nombre,
        fecha_inicio_inscripcion: fechaInicio,
        fecha_fin_inscripcion:    fechaFin,
      }
      if (editando) {
        await procesosInscripcionApi.update(editando.proceso_id, { proceso: procesoData })
        toast.success("Proceso actualizado")
      } else {
        await procesosInscripcionApi.create({ proceso: procesoData })
        toast.success("Proceso creado")
      }
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md bg-card border-l border-border shadow-2xl transition-transform duration-300 flex flex-col ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-foreground">
            {editando ? "Editar proceso" : "Nuevo proceso de inscripción"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto px-6 py-5 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Periodo de matrícula *</label>
            <select
              value={periodoId}
              onChange={e => setPeriodoId(e.target.value)}
              required
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Seleccionar periodo...</option>
              {periodos.map(p => (
                <option key={p.periodo_id} value={p.periodo_id}>
                  {p.anio}{p.descripcion ? ` — ${p.descripcion}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Tipo de proceso *</label>
            <div className="flex gap-2">
              {NOMBRES_PROCESO.map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNombre(n)}
                  className={`flex-1 h-9 rounded-lg border text-sm font-medium transition-colors ${
                    nombre === n
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Inicio inscripción *</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                required
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Fin inscripción *</label>
              <input
                type="date"
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                required
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="mt-auto flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !periodoId || !fechaInicio || !fechaFin}
              className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editando ? "Guardar cambios" : "Crear proceso"}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

const NOMBRE_COLORS: Record<string, string> = {
  Ordinaria:      "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Extraordinaria: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Especial:       "bg-violet-500/10 text-violet-600 dark:text-violet-400",
}

export default function ProcesosPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editando,   setEditando]   = useState<ProcesoInscripcion | null>(null)

  const { data, isLoading, mutate } = useSWR<{ success: boolean; data: ProcesoInscripcion[] }>(
    "/procesos-inscripcion/getAll",
    swrFetcher,
  )

  const procesos  = data?.data ?? []
  const vigentes  = procesos.filter(p => p.activo).length

  function openCreate() {
    setEditando(null)
    setDrawerOpen(true)
  }

  function openEdit(p: ProcesoInscripcion) {
    setEditando(p)
    setDrawerOpen(true)
  }

  async function handleDelete(p: ProcesoInscripcion) {
    if (!confirm(`¿Eliminar el proceso "${p.nombre}" del periodo ${p.anio ?? p.periodo_id}?`)) return
    try {
      await procesosInscripcionApi.delete(p.proceso_id)
      toast.success("Proceso eliminado")
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar")
    }
  }

  function fmtDate(iso?: string) {
    if (!iso) return "—"
    return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
  }

  return (
    <>
      <div className="flex flex-col gap-0 min-h-full">

        {/* Header */}
        <div className="bg-zinc-950 dark:bg-zinc-900 text-white rounded-xl px-6 py-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20 ring-1 ring-violet-500/30">
                <FileText className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Procesos de Inscripción</h1>
                <p className="text-xs text-zinc-400 mt-0.5">Ordinaria, Extraordinaria y Especial</p>
              </div>
            </div>

            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nuevo proceso
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total",    value: procesos.length, color: "border-zinc-600" },
              { label: "Activos",  value: vigentes,        color: "border-emerald-500" },
            ].map(s => (
              <div key={s.label} className={`border-l-4 ${s.color} pl-4 py-1`}>
                <span className="text-xs uppercase tracking-wide text-zinc-400">{s.label}</span>
                <p className="font-mono text-2xl font-bold text-white leading-none mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabla */}
        <div className="rounded-xl border border-border bg-card">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Cargando procesos...</span>
            </div>
          ) : procesos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <FileText className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No hay procesos registrados</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Periodo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Inicio inscripción</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Fin inscripción</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado</th>
                  <th className="px-5 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {procesos.map(p => (
                  <tr key={p.proceso_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${NOMBRE_COLORS[p.nombre] ?? "bg-muted text-foreground"}`}>
                        {p.nombre}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="font-mono font-semibold text-foreground">{p.anio ?? p.periodo_id}</span>
                      {p.periodo_descripcion && <span className="text-xs text-muted-foreground ml-1.5">{p.periodo_descripcion}</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{fmtDate(p.fecha_inicio_inscripcion)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{fmtDate(p.fecha_fin_inscripcion)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${p.activo ? "bg-emerald-500" : "bg-zinc-400"}`} />
                        <span className={`text-xs font-medium ${p.activo ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`}>
                          {p.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          aria-label="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ProcesoDrawer
        open={drawerOpen}
        editando={editando}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => mutate()}
      />
    </>
  )
}
