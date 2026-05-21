"use client"

import { useState, useEffect } from "react"
import { Users, Plus, Trash2, Loader2, X, Check, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { directorGrupoApi } from "@/lib/api/services/directorGrupo"
import { asignacionesApi } from "@/lib/api/services/asignaciones"
import { cursosApi } from "@/lib/api/services/cursos"
import { periodoMatriculaApi, type PeriodoMatricula } from "@/lib/api/services/periodoMatricula"
import type { DirectorGrupoProfesor, AsignacionDocente, Curso } from "@/lib/types"

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"

function nivelLabel(d: DirectorGrupoProfesor) {
  return `${d.grado}°${d.grupo} — ${d.nivel}`
}

// ── Modal asignar director ────────────────────────────────────────────────────

interface ModalDirectorProps {
  profesorId: number
  cursos: Curso[]
  periodos: PeriodoMatricula[]
  asignacionesExistentes: AsignacionDocente[]
  onClose: () => void
  onGuardado: () => void
}

function ModalDirector({
  profesorId, cursos, periodos, asignacionesExistentes, onClose, onGuardado,
}: ModalDirectorProps) {
  const [cursoId,   setCursoId]   = useState<number>(0)
  const [periodoId, setPeriodoId] = useState<number>(0)
  const [materia,   setMateria]   = useState("")
  const [horas,     setHoras]     = useState<number | "">("")
  const [guardando, setGuardando] = useState(false)

  // ¿Ya tiene asignación para este curso+periodo?
  const tieneAsignacion = asignacionesExistentes.some(
    (a) => a.curso_id === cursoId && a.periodo_id === periodoId
  )
  const necesitaAsignacion = cursoId > 0 && periodoId > 0 && !tieneAsignacion

  async function handleGuardar() {
    if (!cursoId || !periodoId) {
      toast.error("Selecciona curso y período")
      return
    }
    if (necesitaAsignacion && !materia.trim()) {
      toast.error("El director debe tener una materia asignada en este curso")
      return
    }

    setGuardando(true)
    try {
      // Si no tiene asignación, crearla primero
      if (necesitaAsignacion) {
        await asignacionesApi.create({
          curso_id:        cursoId,
          profesor_id:     profesorId,
          periodo_id:      periodoId,
          materia:         materia.trim(),
          horas_semanales: horas === "" ? null : Number(horas),
        })
      }

      // Crear la dirección de grupo
      await directorGrupoApi.create({ curso_id: cursoId, periodo_id: periodoId, profesor_id: profesorId })
      toast.success("Director de grupo asignado")
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
          <h3 className="text-base font-semibold text-foreground">Asignar como director de grupo</h3>
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
              disabled={guardando}
              value={cursoId || ""}
              onChange={(e) => { setCursoId(Number(e.target.value)); setMateria(""); setHoras("") }}
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
              disabled={guardando}
              value={periodoId || ""}
              onChange={(e) => { setPeriodoId(Number(e.target.value)); setMateria(""); setHoras("") }}
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

          {/* Aviso + campos de asignación si no existe */}
          {necesitaAsignacion && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <p className="text-xs font-medium">
                  Este profesor no tiene asignación en ese curso/período. Se creará automáticamente.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <input
                  disabled={guardando}
                  value={materia}
                  onChange={(e) => setMateria(e.target.value)}
                  placeholder="Materia que dicta * (ej: Matemáticas)"
                  className={inputCls}
                />
                <input
                  type="number"
                  min={1}
                  max={40}
                  disabled={guardando}
                  value={horas}
                  onChange={(e) => setHoras(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Horas semanales (opcional)"
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {cursoId > 0 && periodoId > 0 && tieneAsignacion && (
            <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 px-3 py-2 text-xs text-green-700 dark:text-green-400">
              ✓ El profesor ya tiene una asignación en este curso y período.
            </div>
          )}
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
            Asignar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

interface DirectorGrupoSectionProps {
  profesorId: number
}

export function DirectorGrupoSeccion({ profesorId }: DirectorGrupoSectionProps) {
  const [direcciones,  setDirecciones]  = useState<DirectorGrupoProfesor[]>([])
  const [asignaciones, setAsignaciones] = useState<AsignacionDocente[]>([])
  const [cursos,       setCursos]       = useState<Curso[]>([])
  const [periodos,     setPeriodos]     = useState<PeriodoMatricula[]>([])
  const [cargando,     setCargando]     = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)

  async function cargar() {
    setCargando(true)
    try {
      const [dirRes, asigRes, cursosRes, periodosRes] = await Promise.all([
        directorGrupoApi.getByProfesor(profesorId),
        asignacionesApi.getByProfesor(profesorId),
        cursosApi.getAll(200),
        periodoMatriculaApi.getAll(),
      ])
      setDirecciones((dirRes.data as any) ?? [])
      setAsignaciones((asigRes.data as any) ?? [])
      setCursos(cursosRes.data ?? [])
      setPeriodos(periodosRes.data ?? [])
    } catch {
      toast.error("Error al cargar direcciones de grupo")
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [profesorId])

  async function handleEliminar(id: number) {
    if (!confirm("¿Quitar esta dirección de grupo?")) return
    try {
      await directorGrupoApi.delete(id)
      toast.success("Dirección de grupo eliminada")
      setDirecciones((prev) => prev.filter((d) => d.director_id !== id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar")
    }
  }

  return (
    <>
      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Director de grupo
            </p>
          </div>
          <button
            onClick={() => setModalAbierto(true)}
            className="flex items-center gap-1.5 h-8 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Asignar
          </button>
        </div>

        {cargando ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Cargando…</span>
          </div>
        ) : direcciones.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3">Sin direcciones de grupo registradas.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {direcciones.map((d) => (
              <div
                key={d.director_id}
                className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{nivelLabel(d)}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground">
                      {d.anio} — {d.periodo_descripcion}
                    </p>
                    {d.periodo_activo && (
                      <span className="text-xs font-medium text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400 rounded px-1.5 py-0.5">
                        Período activo
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleEliminar(d.director_id)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  aria-label="Quitar dirección"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalAbierto && (
        <ModalDirector
          profesorId={profesorId}
          cursos={cursos}
          periodos={periodos}
          asignacionesExistentes={asignaciones}
          onClose={() => setModalAbierto(false)}
          onGuardado={cargar}
        />
      )}
    </>
  )
}
