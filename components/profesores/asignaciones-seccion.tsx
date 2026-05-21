"use client"

import { useState, useEffect } from "react"
import { BookOpen, Plus, Pencil, Trash2, Loader2, X, Check } from "lucide-react"
import { toast } from "sonner"
import { asignacionesApi } from "@/lib/api/services/asignaciones"
import { cursosApi } from "@/lib/api/services/cursos"
import { periodoMatriculaApi, type PeriodoMatricula } from "@/lib/api/services/periodoMatricula"
import type { AsignacionDocente, Curso } from "@/lib/types"

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"

function NombreCurso(a: AsignacionDocente) {
  if (a.grado && a.grupo) return `${a.grado}°${a.grupo} — ${a.nivel ?? ""}`
  return `Curso #${a.curso_id}`
}

// ── Modal nueva/editar asignación ─────────────────────────────────────────────

interface ModalAsignacionProps {
  profesorId: number
  cursos: Curso[]
  periodos: PeriodoMatricula[]
  asignacionEditar?: AsignacionDocente
  onClose: () => void
  onGuardado: () => void
}

function ModalAsignacion({
  profesorId, cursos, periodos, asignacionEditar, onClose, onGuardado,
}: ModalAsignacionProps) {
  const editando = !!asignacionEditar

  const [form, setForm] = useState({
    curso_id:        asignacionEditar?.curso_id   ?? 0,
    periodo_id:      asignacionEditar?.periodo_id ?? 0,
    materia:         asignacionEditar?.materia    ?? "",
    horas_semanales: asignacionEditar?.horas_semanales ?? ("" as number | ""),
  })
  const [guardando, setGuardando] = useState(false)

  async function handleGuardar() {
    if (!form.curso_id || !form.periodo_id || !form.materia.trim()) {
      toast.error("Curso, período y materia son obligatorios")
      return
    }
    setGuardando(true)
    try {
      if (editando) {
        await asignacionesApi.update(asignacionEditar!.asignacion_id, {
          materia:         form.materia,
          horas_semanales: form.horas_semanales === "" ? null : Number(form.horas_semanales),
        })
        toast.success("Asignación actualizada")
      } else {
        await asignacionesApi.create({
          curso_id:        form.curso_id,
          profesor_id:     profesorId,
          periodo_id:      form.periodo_id,
          materia:         form.materia,
          horas_semanales: form.horas_semanales === "" ? null : Number(form.horas_semanales),
        })
        toast.success("Asignación creada")
      }
      onGuardado()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl flex flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">
            {editando ? "Editar asignación" : "Nueva asignación docente"}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {/* Curso */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Curso <span className="text-destructive">*</span>
            </label>
            <select
              disabled={guardando || editando}
              value={form.curso_id || ""}
              onChange={(e) => setForm((p) => ({ ...p, curso_id: Number(e.target.value) }))}
              className={inputCls}
            >
              <option value="">Seleccionar curso…</option>
              {cursos.map((c) => (
                <option key={c.curso_id} value={c.curso_id}>
                  {c.grado}°{c.grupo} — {c.nivel} {c.jornada_nombre ? `(${c.jornada_nombre})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Período */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Período <span className="text-destructive">*</span>
            </label>
            <select
              disabled={guardando || editando}
              value={form.periodo_id || ""}
              onChange={(e) => setForm((p) => ({ ...p, periodo_id: Number(e.target.value) }))}
              className={inputCls}
            >
              <option value="">Seleccionar período…</option>
              {periodos.map((p) => (
                <option key={p.periodo_id} value={p.periodo_id}>
                  {p.anio} — {p.descripcion ?? "Sin descripción"}
                  {p.activo ? " (activo)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Materia */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Materia <span className="text-destructive">*</span>
            </label>
            <input
              disabled={guardando}
              value={form.materia}
              onChange={(e) => setForm((p) => ({ ...p, materia: e.target.value }))}
              placeholder="Ej: Matemáticas, Física…"
              className={inputCls}
            />
          </div>

          {/* Horas semanales */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Horas semanales</label>
            <input
              type="number"
              min={1}
              max={40}
              disabled={guardando}
              value={form.horas_semanales}
              onChange={(e) =>
                setForm((p) => ({ ...p, horas_semanales: e.target.value === "" ? "" : Number(e.target.value) }))
              }
              placeholder="Ej: 5"
              className={inputCls}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={guardando}
            className="h-9 rounded-lg border border-border px-4 text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {guardando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

interface AsignacionesSectionProps {
  profesorId: number
}

export function AsignacionesSeccion({ profesorId }: AsignacionesSectionProps) {
  const [asignaciones, setAsignaciones] = useState<AsignacionDocente[]>([])
  const [cursos,    setCursos]    = useState<Curso[]>([])
  const [periodos,  setPeriodos]  = useState<PeriodoMatricula[]>([])
  const [cargando,  setCargando]  = useState(true)
  const [modal,     setModal]     = useState<"crear" | AsignacionDocente | null>(null)

  async function cargar() {
    setCargando(true)
    try {
      const [asigRes, cursosRes, periodosRes] = await Promise.all([
        asignacionesApi.getByProfesor(profesorId),
        cursosApi.getAll(200),
        periodoMatriculaApi.getAll(),
      ])
      setAsignaciones((asigRes.data as any) ?? [])
      setCursos(cursosRes.data ?? [])
      setPeriodos(periodosRes.data ?? [])
    } catch {
      toast.error("Error al cargar asignaciones")
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [profesorId])

  async function handleEliminar(id: number) {
    if (!confirm("¿Eliminar esta asignación?")) return
    try {
      await asignacionesApi.delete(id)
      toast.success("Asignación eliminada")
      setAsignaciones((prev) => prev.filter((a) => a.asignacion_id !== id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar")
    }
  }

  return (
    <>
      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Asignaciones docentes
            </p>
          </div>
          <button
            onClick={() => setModal("crear")}
            className="flex items-center gap-1.5 h-8 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar
          </button>
        </div>

        {cargando ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Cargando…</span>
          </div>
        ) : asignaciones.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3">Sin asignaciones registradas.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {asignaciones.map((a) => (
              <div
                key={a.asignacion_id}
                className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{a.materia}</p>
                  <p className="text-xs text-muted-foreground">
                    {NombreCurso(a)} · {a.anio ?? a.periodo_id}
                    {a.horas_semanales ? ` · ${a.horas_semanales}h/sem` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setModal(a)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleEliminar(a.asignacion_id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <ModalAsignacion
          profesorId={profesorId}
          cursos={cursos}
          periodos={periodos}
          asignacionEditar={modal === "crear" ? undefined : modal}
          onClose={() => setModal(null)}
          onGuardado={cargar}
        />
      )}
    </>
  )
}
