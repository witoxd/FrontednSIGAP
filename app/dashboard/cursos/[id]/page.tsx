"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import {
  ArrowLeft, Pencil, Loader2, Users, GraduationCap,
  Clock, BookOpen, Star, AlertCircle,
} from "lucide-react"
import { cursosApi } from "@/lib/api/services/cursos"
import { periodoMatriculaApi } from "@/lib/api/services/periodoMatricula"
import type { PeriodoMatricula } from "@/lib/api/services/periodoMatricula"
import { toast } from "sonner"
import { Modal } from "@/components/shared/modal"
import { SeccionEstudiantes } from "@/components/cursos/SeccionEstudiantes"
import { SeccionDocentes }    from "@/components/cursos/SeccionDocentes"
import type { DirectorPeriodo, AsignacionPeriodo } from "@/components/cursos/SeccionDocentes"
import type { EstudiantePeriodo } from "@/components/cursos/SeccionEstudiantes"
import type { CursoDetalles, Jornada, NivelEducativo } from "@/lib/types"
import { jornadasApi } from "@/lib/api/services/jornadas"
import { swrFetcher } from "@/lib/api/fetcher"
import type { PaginatedApiResponse } from "@/lib/types"

// ── Helpers ───────────────────────────────────────────────────────────────────

const NIVEL_COLOR: Record<string, string> = {
  Preescolar: "bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400",
  Primaria:   "bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400",
  Secundaria: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  Media:      "bg-teal-100   text-teal-700   dark:bg-teal-900/30   dark:text-teal-400",
}

const NIVELES: NivelEducativo[] = ["Preescolar", "Primaria", "Secundaria", "Media"]

// ── Componente sidebar de info ────────────────────────────────────────────────

function InfoFila({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  )
}

// ── Formulario de edición ─────────────────────────────────────────────────────

function CursoEditForm({
  curso,
  jornadas,
  onSubmit,
  onCancel,
}: {
  curso:    CursoDetalles
  jornadas: Jornada[]
  onSubmit: (data: { grado: string; nivel: NivelEducativo; grupo: string; jornada_id: number; capacidad_maxima: number }) => Promise<void>
  onCancel: () => void
}) {
  const [grado,    setGrado]    = useState(curso.grado)
  const [nivel,    setNivel]    = useState<NivelEducativo>(curso.nivel)
  const [grupo,    setGrupo]    = useState(curso.grupo)
  const [jornada,  setJornada]  = useState(curso.jornada_id)
  const [cap,      setCap]      = useState(String(curso.capacidad_maxima))
  const [enviando, setEnviando] = useState(false)

  const inputCls = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    try {
      await onSubmit({ grado, nivel, grupo, jornada_id: jornada, capacidad_maxima: Number(cap) || 40 })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Grado *</label>
          <input required value={grado} onChange={(e) => setGrado(e.target.value)} placeholder="Ej: 6, 10" className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Grupo *</label>
          <input required value={grupo} onChange={(e) => setGrupo(e.target.value)} placeholder="Ej: A, B" className={inputCls} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Nivel educativo *</label>
        <select value={nivel} onChange={(e) => setNivel(e.target.value as NivelEducativo)} className={inputCls}>
          {NIVELES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Jornada *</label>
        <select required value={jornada} onChange={(e) => setJornada(Number(e.target.value))} className={inputCls}>
          <option value={0} disabled>Seleccione una jornada</option>
          {jornadas.map((j) => <option key={j.jornada_id} value={j.jornada_id}>{j.nombre}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Capacidad máxima</label>
        <input type="number" min={1} value={cap} onChange={(e) => setCap(e.target.value)} className={inputCls} />
      </div>
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button type="button" onClick={onCancel} className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={enviando} className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar cambios"}
        </button>
      </div>
    </form>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

type Tab = "estudiantes" | "docentes"

export default function CursoDetallePage() {
  const params  = useParams()
  const router  = useRouter()
  const cursoId = Number(params.id)

  const [tab,          setTab]          = useState<Tab>("estudiantes")
  const [editModal,    setEditModal]    = useState(false)
  const [periodoSelId, setPeriodoSelId] = useState<number | null>(null)

  const { data, isLoading, error, mutate } = useSWR(
    `curso-detalles-${cursoId}`,
    () => cursosApi.getDetalles(cursoId)
  )

  const { data: jornadasData } = useSWR<PaginatedApiResponse<Jornada>>(
    "/jornadas/getAll?limit=100&offset=0",
    swrFetcher
  )
  const jornadas = jornadasData?.data ?? []

  const { data: periodosData } = useSWR(
    "/periodos-matricula/getAll",
    () => periodoMatriculaApi.getAll(),
    { revalidateOnFocus: false }
  )
  const periodos: PeriodoMatricula[] = (periodosData?.data as PeriodoMatricula[]) ?? []

  const { data: periodoActivoData } = useSWR(
    "periodo-activo",
    () => periodoMatriculaApi.getActivo()
  )
  const periodoActivo = periodoActivoData?.data as PeriodoMatricula | null | undefined

  // Período efectivo: el seleccionado manualmente, o el activo al cargar
  const periodoEfectivoId = periodoSelId ?? periodoActivo?.periodo_id ?? null

  // Query unificada por período — se re-ejecuta al cambiar de período
  const { data: periodoDetallesData, isLoading: cargandoPeriodo } = useSWR(
    periodoEfectivoId ? `curso-periodo-${cursoId}-${periodoEfectivoId}` : null,
    () => cursosApi.getDetallesPorPeriodo(cursoId, periodoEfectivoId!),
    { revalidateOnFocus: false }
  )

  const periodoDetalles = (periodoDetallesData as any)?.data
  const estudiantesPeriodo: EstudiantePeriodo[] = periodoDetalles?.estudiantes ?? []
  const directorPeriodo:    DirectorPeriodo | null = periodoDetalles?.director ?? null
  const asignacionesPeriodo: AsignacionPeriodo[]  = periodoDetalles?.asignaciones ?? []

  const curso = data?.data as CursoDetalles | undefined

  async function handleUpdate(formData: {
    grado: string; nivel: NivelEducativo; grupo: string; jornada_id: number; capacidad_maxima: number
  }) {
    try {
      await cursosApi.update(cursoId, { curso: formData })
      toast.success("Curso actualizado")
      setEditModal(false)
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar")
    }
  }

  // ── Render: cargando ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Cargando curso…</span>
      </div>
    )
  }

  if (error || !curso) {
    return (
      <div className="flex items-center gap-3 py-12 text-destructive">
        <AlertCircle className="h-5 w-5" />
        <span className="text-sm">No se pudo cargar el curso.</span>
      </div>
    )
  }

  const nivelCls   = NIVEL_COLOR[curso.nivel] ?? "bg-muted text-muted-foreground"
  const titulo     = `${curso.grado}° ${curso.grupo} — ${curso.nivel}`
  const jornada    = jornadas.find((j) => j.jornada_id === curso.jornada_id)

  // Alerta: curso activo + período activo sin director asignado para ese período
  const hayPeriodoActivo = curso.directores.some((d) => d.periodo_activo)
  const sinDirectorEnPeriodoActivo = curso.activo && !hayPeriodoActivo

  return (
    <div className="flex flex-col gap-6">

      {/* ── Cabecera ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/cursos")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Cursos
          </button>
          <span className="text-muted-foreground/40">/</span>
          <h1 className="text-xl font-bold text-foreground">{titulo}</h1>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${nivelCls}`}>
            {curso.nivel}
          </span>
          {!curso.activo && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              Inactivo
            </span>
          )}
        </div>

        <button
          onClick={() => setEditModal(true)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
        >
          <Pencil className="h-4 w-4" />
          Editar
        </button>
      </div>

      {/* ── Alerta: sin director en período activo ── */}
      {sinDirectorEnPeriodoActivo && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/5 px-4 py-3.5">
          <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-warning">Sin director de grupo en el período activo</p>
            <p className="text-xs text-warning/70 mt-0.5">
              Este curso está activo y hay un período académico en curso, pero no tiene director de grupo asignado.
              Asigna un director desde el perfil del docente en la sección "Director de grupo".
            </p>
          </div>
        </div>
      )}

      {/* ── Layout: sidebar + contenido ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5 items-start">

        {/* Sidebar */}
        <div className="flex flex-col gap-3">

          {/* Datos del curso */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pb-2 border-b border-border mb-3">
              Información
            </p>
            <dl className="flex flex-col gap-2.5">
              <InfoFila label="Grado"    value={curso.grado} />
              <InfoFila label="Grupo"    value={curso.grupo} />
              <InfoFila label="Nivel"    value={curso.nivel} />
              <InfoFila label="Jornada"  value={curso.jornada_nombre ?? jornada?.nombre} />
              {jornada?.hora_inicio && (
                <InfoFila
                  label="Horario"
                  value={`${jornada.hora_inicio}–${jornada.hora_fin ?? ""}`}
                />
              )}
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">Capacidad</dt>
                <dd className="text-sm text-foreground flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  {curso.capacidad_maxima} estudiantes
                </dd>
              </div>
            </dl>
          </div>

          {/* Director del período seleccionado */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pb-2 border-b border-border mb-3">
              Director de grupo
            </p>
            {cargandoPeriodo ? (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : directorPeriodo ? (
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Star className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {[directorPeriodo.nombres, directorPeriodo.apellido_paterno].join(" ")}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin director asignado</p>
            )}
          </div>

          {/* Resumen docentes del período */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pb-2 border-b border-border mb-3">
              Docentes
            </p>
            {cargandoPeriodo ? (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : (() => {
              const profesoresUnicos = [...new Map(asignacionesPeriodo.map((a) => [a.profesor_id, a])).values()]
              return profesoresUnicos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin asignaciones</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {profesoresUnicos.slice(0, 4).map((a) => (
                    <div key={a.profesor_id} className="flex items-center gap-2">
                      <GraduationCap className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-sm text-foreground truncate">
                        {a.nombres} {a.apellido_paterno}
                      </span>
                    </div>
                  ))}
                  {profesoresUnicos.length > 4 && (
                    <p className="text-xs text-muted-foreground">+{profesoresUnicos.length - 4} más</p>
                  )}
                </div>
              )
            })()}
          </div>

          {/* Materias del período */}
          {!cargandoPeriodo && asignacionesPeriodo.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pb-2 border-b border-border mb-3">
                Materias
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[...new Set(asignacionesPeriodo.map((a) => a.materia))].map((m) => (
                  <span key={m} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    <BookOpen className="h-2.5 w-2.5" />
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contenido principal — tabs */}
        <div className="flex flex-col gap-4">

          {/* Selector de período + tabs en la misma fila */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1 w-fit">
              {([
                { key: "estudiantes", icon: Users,         label: "Estudiantes" },
                { key: "docentes",    icon: GraduationCap, label: "Docentes"    },
              ] as const).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    tab === key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Selector de período — compartido entre tabs */}
            <select
              value={periodoEfectivoId ?? ""}
              onChange={(e) => setPeriodoSelId(e.target.value ? Number(e.target.value) : null)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="" disabled>Sin período</option>
              {periodos.map((p) => (
                <option key={p.periodo_id} value={p.periodo_id}>
                  {p.anio}{p.descripcion ? ` — ${p.descripcion}` : ""}
                  {p.periodo_id === periodoActivo?.periodo_id ? " (activo)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Contenido del tab */}
          <div className="rounded-xl border border-border bg-card p-5">
            {tab === "estudiantes" ? (
              <SeccionEstudiantes
                estudiantes={estudiantesPeriodo}
                cargando={cargandoPeriodo}
              />
            ) : (
              <SeccionDocentes
                director={directorPeriodo}
                asignaciones={asignacionesPeriodo}
                cargando={cargandoPeriodo}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal de edición */}
      {editModal && (
        <Modal
          open={editModal}
          onClose={() => setEditModal(false)}
          title="Editar curso"
        >
          <CursoEditForm
            curso={curso}
            jornadas={jornadas}
            onSubmit={handleUpdate}
            onCancel={() => setEditModal(false)}
          />
        </Modal>
      )}
    </div>
  )
}
