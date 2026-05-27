"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { toast } from "sonner"
import {
  Plus, Pencil, Search, Loader2, BookOpen,
  Users, Star, ArrowRight, ChevronRight,
} from "lucide-react"
import { swrFetcher } from "@/lib/api/fetcher"
import { cursosApi } from "@/lib/api/services/cursos"
import { jornadasApi } from "@/lib/api/services/jornadas"
import { Modal } from "@/components/shared/modal"
import type { PaginatedApiResponse, Curso, Jornada, NivelEducativo, CursoDetalles } from "@/lib/types"

const NIVELES: NivelEducativo[] = ["Preescolar", "Primaria", "Secundaria", "Media"]

const NIVEL_COLOR: Record<string, string> = {
  Preescolar: "bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400",
  Primaria:   "bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400",
  Secundaria: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  Media:      "bg-teal-100   text-teal-700   dark:bg-teal-900/30   dark:text-teal-400",
}

// ── Card de curso ─────────────────────────────────────────────────────────────

function CursoCard({
  curso,
  onEditar,
}: {
  curso:    Curso & { director?: string }
  onEditar: (c: Curso) => void
}) {
  const router   = useRouter()
  const nivelCls = NIVEL_COLOR[curso.nivel] ?? "bg-muted text-muted-foreground"

  return (
    <div className={`relative group flex items-center gap-4 rounded-xl border bg-background px-5 py-4 transition-colors hover:bg-muted/20 ${
      curso.activo ? "border-border" : "border-border/50 opacity-60"
    }`}>

      {/* Ícono nivel */}
      <div className={`hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${nivelCls}`}>
        {curso.grado}
      </div>

      {/* Info central */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground">
            {curso.grado}° {curso.grupo}
          </p>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${nivelCls}`}>
            {curso.nivel}
          </span>
          {!curso.activo && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              Inactivo
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
          <span>{curso.jornada_nombre ?? "—"}</span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {curso.capacidad_maxima} cupos
          </span>
          {curso.director && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-primary/60" />
              {curso.director}
            </span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEditar(curso)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Editar curso"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => router.push(`/dashboard/cursos/${curso.curso_id}`)}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
        >
          Ver
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Click en toda la card → detalle */}
      <button
        onClick={() => router.push(`/dashboard/cursos/${curso.curso_id}`)}
        className="absolute inset-0 rounded-xl"
        aria-hidden
        tabIndex={-1}
      />
    </div>
  )
}

// ── Formulario ────────────────────────────────────────────────────────────────

type CursoFormData = { grado: string; nivel: NivelEducativo; grupo: string; jornada_id: number; capacidad_maxima?: number }

function CursoForm({
  initialData, jornadas, onSubmit, onCancel, submitLabel = "Guardar",
}: {
  initialData?:  Curso | null
  jornadas:      Jornada[]
  onSubmit:      (d: CursoFormData) => Promise<void>
  onCancel:      () => void
  submitLabel?:  string
}) {
  const [enviando,  setEnviando]  = useState(false)
  const [grado,     setGrado]     = useState(initialData?.grado ?? "")
  const [nivel,     setNivel]     = useState<NivelEducativo>(initialData?.nivel ?? "Primaria")
  const [grupo,     setGrupo]     = useState(initialData?.grupo ?? "")
  const [jornadaId, setJornadaId] = useState<number>(initialData?.jornada_id ?? 0)
  const [capacidad, setCapacidad] = useState<string>(String(initialData?.capacidad_maxima ?? 40))

  const inputCls = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!jornadaId) return
    setEnviando(true)
    try {
      await onSubmit({ grado, nivel, grupo, jornada_id: jornadaId, capacidad_maxima: Number(capacidad) || 40 })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Grado *</label>
          <input required value={grado} onChange={(e) => setGrado(e.target.value)} placeholder="Ej: 6, 10, Transición" className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Grupo *</label>
          <input required value={grupo} onChange={(e) => setGrupo(e.target.value)} placeholder="Ej: A, B, C" className={inputCls} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Nivel educativo *</label>
        <select required value={nivel} onChange={(e) => setNivel(e.target.value as NivelEducativo)} className={inputCls}>
          {NIVELES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Jornada *</label>
        <select required value={jornadaId} onChange={(e) => setJornadaId(Number(e.target.value))} className={inputCls}>
          <option value={0} disabled>Seleccione una jornada</option>
          {jornadas.map((j) => <option key={j.jornada_id} value={j.jornada_id}>{j.nombre}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Capacidad máxima</label>
        <input type="number" min={1} value={capacidad} onChange={(e) => setCapacidad(e.target.value)} placeholder="40" className={inputCls} />
      </div>
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button type="button" onClick={onCancel} className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={enviando} className="flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : submitLabel}
        </button>
      </div>
    </form>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function CursosPage() {
  const [page,        setPage]        = useState(0)
  const [busqueda,    setBusqueda]    = useState("")
  const [filtroNivel, setFiltroNivel] = useState<string>("")
  const [filtroJorn,  setFiltroJorn]  = useState<number | "">("")
  const [soloActivos, setSoloActivos] = useState(true)
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editando,    setEditando]    = useState<Curso | null>(null)
  const limit = 50

  const { data, isLoading, mutate } = useSWR<PaginatedApiResponse<Curso>>(
    `/cursos/getAll?limit=${limit}&offset=${page * limit}`,
    swrFetcher
  )

  const { data: jornadasData } = useSWR<PaginatedApiResponse<Jornada>>(
    "/jornadas/getAll?limit=100&offset=0",
    swrFetcher
  )
  const jornadas = jornadasData?.data ?? []

  const todos = data?.data ?? []

  // Filtros
  const filtrados = todos.filter((c) => {
    if (soloActivos && !c.activo) return false
    if (filtroNivel && c.nivel !== filtroNivel) return false
    if (filtroJorn  && c.jornada_id !== filtroJorn) return false
    if (busqueda) {
      const txt = `${c.grado} ${c.nivel} ${c.grupo} ${c.jornada_nombre ?? ""}`.toLowerCase()
      if (!txt.includes(busqueda.toLowerCase())) return false
    }
    return true
  })

  // Ordenar: nivel educativo, luego grado, luego grupo
  const ordenNivel: Record<string, number> = { Preescolar: 0, Primaria: 1, Secundaria: 2, Media: 3 }
  filtrados.sort((a, b) => {
    const nDiff = (ordenNivel[a.nivel] ?? 9) - (ordenNivel[b.nivel] ?? 9)
    if (nDiff !== 0) return nDiff
    return a.grado.localeCompare(b.grado, "es", { numeric: true }) || a.grupo.localeCompare(b.grupo)
  })

  function abrirCrear() { setEditando(null); setModalOpen(true) }
  function abrirEditar(c: Curso) { setEditando(c); setModalOpen(true) }
  function cerrarModal() { setModalOpen(false); setEditando(null) }

  async function handleCreate(formData: CursoFormData) {
    try {
      await cursosApi.create({ curso: formData })
      toast.success("Curso creado")
      cerrarModal()
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear curso")
    }
  }

  async function handleUpdate(formData: CursoFormData) {
    if (!editando) return
    try {
      await cursosApi.update(editando.curso_id, { curso: formData })
      toast.success("Curso actualizado")
      cerrarModal()
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar")
    }
  }

  const selectCls = "h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cursos</h1>
          <p className="text-sm text-muted-foreground">Gestión de cursos académicos</p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo curso
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por grado, grupo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value)} className={selectCls}>
          <option value="">Todos los niveles</option>
          {NIVELES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>

        <select value={filtroJorn} onChange={(e) => setFiltroJorn(e.target.value ? Number(e.target.value) : "")} className={selectCls}>
          <option value="">Todas las jornadas</option>
          {jornadas.map((j) => <option key={j.jornada_id} value={j.jornada_id}>{j.nombre}</option>)}
        </select>

        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={soloActivos}
            onChange={(e) => setSoloActivos(e.target.checked)}
            className="h-4 w-4 rounded border-input accent-primary"
          />
          Solo activos
        </label>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando cursos…
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-14 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {todos.length === 0 ? "No hay cursos registrados." : "Ningún curso coincide con los filtros."}
          </p>
          {todos.length === 0 && (
            <button
              onClick={abrirCrear}
              className="mt-1 flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              Crear el primer curso
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2 relative">
          {filtrados.map((curso) => (
            <CursoCard
              key={curso.curso_id}
              curso={curso}
              onEditar={abrirEditar}
            />
          ))}
        </div>
      )}

      {/* Contador */}
      {!isLoading && filtrados.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {filtrados.length} curso{filtrados.length !== 1 ? "s" : ""}
          {todos.length !== filtrados.length && ` de ${todos.length}`}
        </p>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={cerrarModal}
        title={editando ? "Editar curso" : "Nuevo curso"}
      >
        <CursoForm
          initialData={editando}
          jornadas={jornadas}
          onSubmit={editando ? handleUpdate : handleCreate}
          onCancel={cerrarModal}
          submitLabel={editando ? "Actualizar" : "Crear curso"}
        />
      </Modal>
    </div>
  )
}
