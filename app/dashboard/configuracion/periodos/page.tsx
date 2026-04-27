"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import {
  CalendarRange, Plus, Loader2, Pencil, Trash2, X,
  Power, PowerOff, CheckCircle2,
} from "lucide-react"
import { swrFetcher } from "@/lib/api/fetcher"
import { periodoMatriculaApi, type PeriodoMatricula, type CreatePeriodoInput } from "@/lib/api/services/periodoMatricula"

// ── Drawer ────────────────────────────────────────────────────────────────────

interface PeriodoDrawerProps {
  open:      boolean
  editando?: PeriodoMatricula | null
  onClose:   () => void
  onSuccess: () => void
}

function PeriodoDrawer({ open, editando, onClose, onSuccess }: PeriodoDrawerProps) {
  const [anio,        setAnio]        = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin,    setFechaFin]    = useState("")
  const [saving,      setSaving]      = useState(false)

  useEffect(() => {
    if (open) {
      setAnio(editando?.anio?.toString() ?? "")
      setDescripcion(editando?.descripcion ?? "")
      setFechaInicio(editando?.fecha_inicio?.slice(0, 10) ?? "")
      setFechaFin(editando?.fecha_fin?.slice(0, 10) ?? "")
    }
  }, [open, editando])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!anio || !fechaInicio || !fechaFin) return
    setSaving(true)
    try {
      const periodoData = {
        anio:         parseInt(anio),
        fecha_inicio: fechaInicio,
        fecha_fin:    fechaFin,
        descripcion:  descripcion.trim() || undefined,
      }
      if (editando) {
        await periodoMatriculaApi.update(editando.periodo_id, { periodo: periodoData })
        toast.success("Periodo actualizado")
      } else {
        await periodoMatriculaApi.create({ periodo: periodoData })
        toast.success("Periodo creado")
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
            {editando ? "Editar periodo" : "Nuevo periodo de matrícula"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto px-6 py-5 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Año *</label>
            <input
              type="number"
              value={anio}
              onChange={e => setAnio(e.target.value)}
              placeholder="2025"
              min="2000"
              max="2100"
              required
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Descripción</label>
            <input
              type="text"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Ej: Periodo regular 2025"
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Fecha inicio *</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                required
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Fecha fin *</label>
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
              disabled={saving || !anio || !fechaInicio || !fechaFin}
              className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editando ? "Guardar cambios" : "Crear periodo"}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function PeriodosPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editando,   setEditando]   = useState<PeriodoMatricula | null>(null)

  const { data, isLoading, mutate } = useSWR<{ success: boolean; data: PeriodoMatricula[] }>(
    "/periodos-matricula/getAll",
    swrFetcher,
  )

  const periodos  = data?.data ?? []
  const activos   = periodos.filter(p => p.activo).length
  const inactivos = periodos.filter(p => !p.activo).length

  function openCreate() {
    setEditando(null)
    setDrawerOpen(true)
  }

  function openEdit(p: PeriodoMatricula) {
    setEditando(p)
    setDrawerOpen(true)
  }

  async function handleToggle(p: PeriodoMatricula) {
    const accion = p.activo ? "desactivar" : "activar"
    if (!confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} el periodo ${p.anio}?`)) return
    try {
      if (p.activo) {
        await periodoMatriculaApi.desactivar(p.periodo_id)
      } else {
        await periodoMatriculaApi.activar(p.periodo_id)
      }
      toast.success(`Periodo ${p.activo ? "desactivado" : "activado"}`)
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar estado")
    }
  }

  async function handleDelete(p: PeriodoMatricula) {
    if (!confirm(`¿Eliminar el periodo ${p.anio}? Esta acción no se puede deshacer.`)) return
    try {
      await periodoMatriculaApi.delete(p.periodo_id)
      toast.success("Periodo eliminado")
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20 ring-1 ring-cyan-500/30">
                <CalendarRange className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Periodos de Matrícula</h1>
                <p className="text-xs text-zinc-400 mt-0.5">Gestión de periodos académicos</p>
              </div>
            </div>

            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nuevo periodo
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total",     value: periodos.length, color: "border-zinc-600" },
              { label: "Activos",   value: activos,         color: "border-emerald-500" },
              { label: "Inactivos", value: inactivos,       color: "border-zinc-500" },
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
              <span className="text-sm">Cargando periodos...</span>
            </div>
          ) : periodos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <CalendarRange className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No hay periodos registrados</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Año</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Descripción</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Inicio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Fin</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado</th>
                  <th className="px-5 py-3 w-28" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {periodos.map(p => (
                  <tr key={p.periodo_id} className={`hover:bg-muted/30 transition-colors ${!p.activo ? "opacity-60" : ""}`}>
                    <td className="px-5 py-3">
                      <span className="font-mono font-bold text-foreground">{p.anio}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                      {p.descripcion || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{fmtDate(p.fecha_inicio)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{fmtDate(p.fecha_fin)}</td>
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
                          onClick={() => handleToggle(p)}
                          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                            p.activo
                              ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              : "text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600"
                          }`}
                          aria-label={p.activo ? "Desactivar" : "Activar"}
                        >
                          {p.activo ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                        </button>
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

      <PeriodoDrawer
        open={drawerOpen}
        editando={editando}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => mutate()}
      />
    </>
  )
}
