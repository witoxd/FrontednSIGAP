"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { useRouter } from "next/navigation"
import { Loader2, Users, ArrowRight, Search } from "lucide-react"
import { cursosApi } from "@/lib/api/services/cursos"
import { periodoMatriculaApi } from "@/lib/api/services/periodoMatricula"
import type { EstudianteDeCurso } from "@/lib/types"
import type { PeriodoMatricula } from "@/lib/api/services/periodoMatricula"

// ── Helpers ───────────────────────────────────────────────────────────────────

function nombreCompleto(e: EstudianteDeCurso) {
  return [e.apellido_paterno, e.apellido_materno, e.nombres].filter(Boolean).join(", ")
}

function tipoDocAbrev(nombre?: string | null): string {
  if (!nombre) return "Doc"
  const mapa: Record<string, string> = {
    "cédula de ciudadanía": "CC",
    "tarjeta de identidad": "TI",
    "cédula de extranjería": "CE",
    "pasaporte": "PP",
    "registro civil": "RC",
    "número de identificación tributaria": "NIT",
  }
  return mapa[nombre.toLowerCase()] ?? nombre.substring(0, 3).toUpperCase()
}

const ESTADO_STYLES: Record<string, { dot: string; label: string; text: string }> = {
  activa:     { dot: "bg-success",          label: "Activa",     text: "text-success"           },
  finalizada: { dot: "bg-accent-foreground", label: "Finalizada", text: "text-accent-foreground" },
  retirada:   { dot: "bg-destructive",      label: "Retirada",   text: "text-destructive"       },
  inactiva:   { dot: "bg-muted-foreground", label: "Inactiva",   text: "text-muted-foreground"  },
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface SeccionEstudiantesProps {
  cursoId:       number
  periodoActivo: PeriodoMatricula | null
}

// ── Componente ────────────────────────────────────────────────────────────────

export function SeccionEstudiantes({ cursoId, periodoActivo }: SeccionEstudiantesProps) {
  const router = useRouter()

  // Si hay período activo lo usamos de entrada; si no, el selector queda libre
  const [periodoId, setPeriodoId] = useState<number | "">(periodoActivo?.periodo_id ?? "")
  const [estado,    setEstado]    = useState<string>(periodoActivo ? "activa" : "")
  const [busqueda,  setBusqueda]  = useState("")

  // Sincronizar si el período activo llega después (SWR carga en paralelo)
  useEffect(() => {
    if (periodoActivo) {
      setPeriodoId(periodoActivo.periodo_id)
      setEstado("activa")
    }
  }, [periodoActivo?.periodo_id])

  // Cargar todos los períodos para el selector libre
  const { data: periodosData } = useSWR(
    "/periodos-matricula/getAll",
    () => periodoMatriculaApi.getAll(),
    { revalidateOnFocus: false }
  )
  const periodos: PeriodoMatricula[] = (periodosData?.data as PeriodoMatricula[]) ?? []

  const swrKey = `byCurso-${cursoId}-${periodoId}-${estado}`
  const { data, isLoading, error } = useSWR(
    swrKey,
    () => cursosApi.getEstudiantes(cursoId, {
      periodo_id: periodoId || undefined,
      estado:     estado    || undefined,
    }),
    { revalidateOnFocus: false }
  )

  const todos: EstudianteDeCurso[] = (data?.data as EstudianteDeCurso[]) ?? []

  const filtrados = todos.filter((e) => {
    if (!busqueda) return true
    const texto = `${e.nombres} ${e.apellido_paterno} ${e.apellido_materno ?? ""} ${e.numero_documento ?? ""}`.toLowerCase()
    return texto.includes(busqueda.toLowerCase())
  })

  const selectCls = "h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"

  const labelPeriodo = periodoActivo
    ? `${periodoActivo.anio}${periodoActivo.descripcion ? ` — ${periodoActivo.descripcion}` : ""}`
    : null

  return (
    <div className="flex flex-col gap-4">

      {/* Chip de período activo o selector libre */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={periodoId}
          onChange={(e) => setPeriodoId(e.target.value ? Number(e.target.value) : "")}
          className={selectCls}
        >
          <option value="">Todos los períodos</option>
          {periodos.map((p) => (
            <option key={p.periodo_id} value={p.periodo_id}>
              {p.anio}{p.descripcion ? ` — ${p.descripcion}` : ""}
              {p.periodo_id === periodoActivo?.periodo_id ? " (activo)" : ""}
            </option>
          ))}
        </select>

        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className={selectCls}
        >
          <option value="">Todos los estados</option>
          <option value="activa">Activos</option>
          <option value="finalizada">Finalizados</option>
          <option value="retirada">Retirados</option>
          <option value="inactiva">Inactivos</option>
        </select>

        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar estudiante..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Contador */}
      {!isLoading && !error && (
        <p className="text-xs text-muted-foreground">
          {filtrados.length} estudiante{filtrados.length !== 1 ? "s" : ""}
          {todos.length !== filtrados.length && ` de ${todos.length}`}
        </p>
      )}

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando estudiantes…
        </div>
      ) : error ? (
        <p className="py-4 text-sm text-destructive">Error al cargar estudiantes</p>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
          <Users className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {todos.length === 0
              ? "No hay estudiantes matriculados en este curso."
              : "Ningún estudiante coincide con los filtros."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {filtrados.map((e) => {
            const s = ESTADO_STYLES[e.estado_actual] ?? ESTADO_STYLES.inactiva
            return (
              <div
                key={e.matricula_id}
                className="group flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-2.5 hover:bg-muted/30 transition-colors"
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} title={s.label} />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {nombreCompleto(e)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tipoDocAbrev(e.tipo_documento)} · {e.numero_documento ?? "—"}
                    <span className={`ml-2 ${s.text}`}>{s.label}</span>
                  </p>
                </div>

                <button
                  onClick={() => router.push(`/dashboard/estudiantes/${e.estudiante_id}/detalles`)}
                  className="shrink-0 flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary hover:border-primary/40 transition-all"
                >
                  Perfil
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
