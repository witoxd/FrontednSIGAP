"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { profesoresApi } from "@/lib/api/services/profesores"
import { reemplazosApi } from "@/lib/api/services/reemplazos"
import { PersonaView }   from "@/components/personas/PersonaView"
import { StatusBadge }   from "@/components/shared/status-badge"
import { ReemplazoModal } from "@/components/profesores/reemplazo-modal"
import { AsignacionesSeccion } from "@/components/profesores/asignaciones-seccion"
import { DirectorGrupoSeccion } from "@/components/profesores/director-grupo-seccion"
import type { ProfesorDetalles, ReemplazosProfesorResponse } from "@/lib/types"
import { toast } from "sonner"

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

export default function DetallesProfesorPage() {
  const params     = useParams()
  const profesorId = parseInt(params.id as string)

  const [data,         setData]         = useState<ProfesorDetalles | null>(null)
  const [cargando,     setCargando]     = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [reemplazos,   setReemplazos]   = useState<ReemplazosProfesorResponse | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    try {
      const [detallesRes, reemplazosRes] = await Promise.all([
        profesoresApi.getDetalles(profesorId),
        reemplazosApi.getByProfesor(profesorId),
      ])
      setData(detallesRes.data ?? null)
      setReemplazos((reemplazosRes.data as any) ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar")
    } finally {
      setCargando(false)
    }
  }, [profesorId])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-sm text-destructive">{error ?? "Profesor no encontrado"}</p>
        <Link href="/dashboard/profesores" className="text-sm text-primary hover:underline">
          ← Volver a profesores
        </Link>
      </div>
    )
  }

  const { docente, profesor, contactos_emergencia } = data

  const rolContent = (
    <div className="flex flex-col gap-6">

      {/* Estado + fechas */}
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3">
        <DatoFila label="Estado"               valor={<StatusBadge status={docente.estado} />} />
        <DatoFila label="Fecha de contratación" valor={formatFecha(docente.fecha_contratacion)} />
        <DatoFila label="Fecha de nombramiento" valor={formatFecha(docente.fecha_nombramiento ?? undefined)} />
        <DatoFila label="N° de resolución"      valor={docente.numero_resolucion ?? undefined} />
        <DatoFila label="Tipo de contrato"      valor={docente.tipo_contrato ?? undefined} />
        <DatoFila label="Grado de escalafón"    valor={docente.grado_escalafon_codigo ?? undefined} />
      </dl>

      {/* Ubicación */}
      <div className="border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Asignación
        </p>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3">
          <DatoFila label="Área"    valor={docente.area ?? undefined} />
          <DatoFila label="Sede"    valor={docente.sede ?? undefined} />
          <DatoFila label="Jornada" valor={docente.jornada_nombre ?? undefined} />
        </dl>
      </div>

      {/* Formación */}
      {(docente.titulo || docente.posgrado || docente.perfil_profesional) && (
        <div className="border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Formación académica
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            <DatoFila label="Título profesional" valor={docente.titulo} />
            <DatoFila label="Posgrado"           valor={docente.posgrado} />
            {docente.perfil_profesional && (
              <div className="sm:col-span-2 flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">Perfil profesional</dt>
                <dd className="text-sm text-foreground whitespace-pre-line">{docente.perfil_profesional}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Contactos de emergencia */}
      <div className="border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Contactos de emergencia
        </p>
        {contactos_emergencia.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border py-4 px-3">
            <AlertCircle className="h-4 w-4 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Sin contactos de emergencia registrados.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {contactos_emergencia.map((c) => (
              <li key={c.contacto_emergencia_id}
                className="rounded-lg border border-border bg-background px-3 py-2.5"
              >
                <p className="text-sm font-medium text-foreground">{c.nombre}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                  <span>{c.parentesco}</span>
                  <span>{c.telefono}</span>
                  {c.celular && <span>{c.celular}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Asignaciones docentes */}
      <AsignacionesSeccion profesorId={profesorId} />

      {/* Dirección de grupo */}
      <DirectorGrupoSeccion profesorId={profesorId} />

      {/* Reemplazos */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Reemplazos
          </p>
          <div className="flex gap-2">
            {docente.estado === "activo" && (
              <button
                type="button"
                onClick={() => setModalAbierto(true)}
                className="flex items-center gap-1.5 h-8 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <RefreshCw className="w-3 h-3" />
                Asignar reemplazo
              </button>
            )}
          </div>
        </div>

        {reemplazos && (reemplazos.realizados.length > 0 || reemplazos.recibidos.length > 0) ? (
          <div className="flex flex-col gap-4">
            {reemplazos.recibidos.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Reemplazos recibidos</p>
                <ul className="flex flex-col gap-1.5">
                  {reemplazos.recibidos.map((r) => (
                    <li key={r.reemplazo_id}
                      className="flex items-start justify-between rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">{r.nombre_reemplazante ?? "Profesor sin nombre"}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFecha(r.fecha_inicio)} → {formatFecha(r.fecha_fin)}
                        </p>
                        {r.motivo && <p className="text-xs text-muted-foreground">{r.motivo}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {reemplazos.realizados.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Reemplazos realizados</p>
                <ul className="flex flex-col gap-1.5">
                  {reemplazos.realizados.map((r) => (
                    <li key={r.reemplazo_id}
                      className="rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <p className="font-medium">{r.nombre_reemplazado ?? "Profesor sin nombre"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFecha(r.fecha_inicio)} → {formatFecha(r.fecha_fin)}
                      </p>
                      {r.motivo && <p className="text-xs text-muted-foreground">{r.motivo}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border py-4 px-3">
            <AlertCircle className="h-4 w-4 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Sin historial de reemplazos.</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/profesores"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Perfil del profesor</h1>
      </div>

      <PersonaView
        persona={data.persona}
        rolLabel="Profesor"
        rolColor="green"
        rolContent={rolContent}
        editHref={`/dashboard/profesores/${profesorId}/editar`}
        archivosEditables
      />

      <ReemplazoModal
        open={modalAbierto}
        profesorReemplazadoId={profesorId}
        onClose={() => setModalAbierto(false)}
        onSuccess={cargarDatos}
      />
    </div>
  )
}
