"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { ArrowLeft, Loader2, ClipboardList, Users } from "lucide-react"
import { estudiantesApi }   from "@/lib/api/services/estudiantes"
import { expedienteApi }    from "@/lib/api/services/expediente"
import { PersonaView }      from "@/components/personas/PersonaView"
import { StatusBadge }      from "@/components/shared/status-badge"
import FichaEstudianteView  from "@/components/forms/ficha/ficheroEstudiante/FichaEstudianteView"
import ViviendaEstudianteView from "@/components/forms/ficha/vidiendaEstudiante/ViviendaEstudianteView"
import ColegioAnteriorList  from "@/components/forms/ficha/colegiosAnteriores/ColegioAnteriorList"
import type { EstudianteWithPersonaDocumento, ExpedienteResponse } from "@/lib/types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFecha(iso?: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit", month: "long", year: "numeric",
  })
}

function DatoFila({ label, valor }: { label: string; valor?: React.ReactNode }) {
  if (!valor) return null
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{valor}</dd>
    </div>
  )
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function DetallesEstudiantePage() {
  const params      = useParams()
  const router      = useRouter()
  const estudianteId = parseInt(params.id as string)

  const [est,        setEst]        = useState<EstudianteWithPersonaDocumento | null>(null)
  const [expediente, setExpediente] = useState<ExpedienteResponse | null>(null)
  const [cargando,   setCargando]   = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      estudiantesApi.getById(estudianteId),
      expedienteApi.get(estudianteId),
    ])
      .then(([estRes, expRes]) => {
        setEst(estRes.data as unknown as EstudianteWithPersonaDocumento)
        setExpediente(expRes.data ?? null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar"))
      .finally(() => setCargando(false))
  }, [estudianteId])

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !est) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-sm text-destructive">{error ?? "Estudiante no encontrado"}</p>
        <Link href="/dashboard/estudiantes" className="text-sm text-primary hover:underline">
          ← Volver a la lista
        </Link>
      </div>
    )
  }

  // ── Contenido específico del rol: datos del estudiante + expediente ────────

  const rolContent = (
    <div className="flex flex-col gap-5">

      {/* Datos básicos del estudiante */}
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3">
        <DatoFila label="Estudiante ID" valor={`#${est.estudiante.estudiante_id}`} />
        <DatoFila label="Estado"        valor={<StatusBadge status={est.estudiante.estado} />} />
        <DatoFila label="Fecha de ingreso" valor={formatFecha(est.estudiante.fecha_ingreso as unknown as string)} />
      </dl>

      {/* Expediente — solo si existe */}
      {expediente && (
        <div className="border-t border-border pt-4 flex flex-col gap-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Expediente académico
          </p>

          {expediente.ficha && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3">Ficha</p>
              <FichaEstudianteView
                estudianteId={estudianteId}
                fichaInicial={expediente.ficha}
              />
            </div>
          )}

          {expediente.vivienda && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3">Vivienda</p>
              <ViviendaEstudianteView
                estudianteId={estudianteId}
                viviendaInicial={expediente.vivienda}
              />
            </div>
          )}

          {expediente.colegios && expediente.colegios.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3">Colegios anteriores</p>
              <ColegioAnteriorList
                estudianteId={estudianteId}
                colegiosIniciales={expediente.colegios}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )

  // ── Acciones en el sidebar ─────────────────────────────────────────────────

  const accionesSidebar = (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => router.push(`/dashboard/matriculas?estudiante=${estudianteId}`)}
        className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
      >
        <ClipboardList className="h-4 w-4 text-muted-foreground" />
        Ver matrículas
      </button>
      <button
        onClick={() => router.push(`/dashboard/acudientes?estudiante=${estudianteId}`)}
        className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
      >
        <Users className="h-4 w-4 text-muted-foreground" />
        Ver acudientes
      </button>
    </div>
  )

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* Cabecera de la página */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/estudiantes"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Perfil del estudiante</h1>
      </div>

      {/* PersonaView — reutilizable, recibe el contenido del rol por props */}
      <PersonaView
        persona={est.persona}
        rolLabel="Estudiante"
        rolColor="blue"
        rolContent={rolContent}
        editHref={`/dashboard/estudiantes/${estudianteId}/editar`}
        accionesSidebar={accionesSidebar}
        archivosEditables
      />
    </div>
  )
}
