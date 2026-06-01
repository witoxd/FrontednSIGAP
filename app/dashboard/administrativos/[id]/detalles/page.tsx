"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { administrativosApi } from "@/lib/api/services/administrativos"
import { PersonaView } from "@/components/personas/PersonaView"
import { StatusBadge } from "@/components/shared/status-badge"
import type { AdministrativoWithPersonaDocumento } from "@/lib/types"

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

export default function DetallesAdministrativoPage() {
  const params           = useParams()
  const administrativoId = parseInt(params.id as string)

  const [data,     setData]     = useState<AdministrativoWithPersonaDocumento | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await administrativosApi.getById(administrativoId)
      setData(res.data ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar")
    } finally {
      setCargando(false)
    }
  }, [administrativoId])

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
        <p className="text-sm text-destructive">{error ?? "Administrativo no encontrado"}</p>
        <Link href="/dashboard/administrativos" className="text-sm text-primary hover:underline">
          ← Volver a administrativos
        </Link>
      </div>
    )
  }

  const { docente, administrativo } = data
  const doc = docente as any

  const rolContent = (
    <div className="flex flex-col gap-6">

      {/* Estado + datos principales */}
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3">
        <DatoFila label="Estado"               valor={<StatusBadge status={docente.estado} />} />
        <DatoFila label="Cargo"                valor={administrativo.cargo ?? undefined} />
        <DatoFila label="Tipo de contrato"     valor={docente.tipo_contrato ?? undefined} />
        <DatoFila label="Fecha de contratación" valor={formatFecha(docente.fecha_contratacion)} />
        <DatoFila label="Fecha de nombramiento" valor={formatFecha(doc.fecha_nombramiento)} />
        <DatoFila label="N° de resolución"     valor={doc.numero_resolucion ?? undefined} />
      </dl>

      {/* Asignación */}
      <div className="border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Asignación
        </p>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3">
          <DatoFila label="Área"    valor={doc.area            ?? undefined} />
          <DatoFila label="Sede"    valor={docente.sede        ?? undefined} />
          <DatoFila label="Jornada" valor={docente.jornada_nombre ?? undefined} />
          <DatoFila label="Decreto" valor={doc.decreto_nombre  ?? undefined} />
          <DatoFila label="Grado de escalafón" valor={doc.grado_escalafon_codigo ?? undefined} />
        </dl>
      </div>

      {/* Formación académica */}
      {(doc.titulo || doc.posgrado || doc.perfil_profesional) && (
        <div className="border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Formación académica
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            <DatoFila label="Título profesional" valor={doc.titulo} />
            <DatoFila label="Posgrado"           valor={doc.posgrado} />
            {doc.perfil_profesional && (
              <div className="sm:col-span-2 flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">Perfil profesional</dt>
                <dd className="text-sm text-foreground whitespace-pre-line">{doc.perfil_profesional}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/administrativos"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Perfil del administrativo</h1>
      </div>

      <PersonaView
        persona={data.persona}
        rolLabel="Administrativo"
        rolColor="blue"
        rolContent={rolContent}
        editHref={`/dashboard/administrativos/${administrativoId}/editar`}
        archivosEditables
      />
    </div>
  )
}
