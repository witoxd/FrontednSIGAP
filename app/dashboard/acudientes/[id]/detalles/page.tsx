"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { ArrowLeft, Loader2, Users } from "lucide-react"
import { acudientesApi } from "@/lib/api/services/acudientes"
import { PersonaView }   from "@/components/personas/PersonaView"
import type { AcudienteDetalles } from "@/lib/types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function DatoFila({ label, valor }: { label: string; valor?: string | null }) {
  if (!valor) return null
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{valor}</dd>
    </div>
  )
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function DetallesAcudientePage() {
  const params      = useParams()
  const acudienteId = parseInt(params.id as string)

  const [data,     setData]     = useState<AcudienteDetalles | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    acudientesApi
      .getDetalles(acudienteId)
      .then((res) => setData(res.data ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar"))
      .finally(() => setCargando(false))
  }, [acudienteId])

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
        <p className="text-sm text-destructive">{error ?? "Acudiente no encontrado"}</p>
        <Link href="/dashboard/acudientes" className="text-sm text-primary hover:underline">
          ← Volver a acudientes
        </Link>
      </div>
    )
  }

  const rolContent = (
    <div className="flex flex-col gap-4">

      {/* Datos propios del acudiente */}
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3">
        <DatoFila label="Parentesco"       valor={data.acudiente.parentesco} />
        <DatoFila label="Ocupación"        valor={data.acudiente.ocupacion} />
        <DatoFila label="Nivel de estudio" valor={data.acudiente.nivel_estudio} />
      </dl>

      {/* Estudiantes a cargo */}
      <div className="border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Estudiantes a cargo
        </p>

        {data.estudiantes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-6 text-center">
            <Users className="h-7 w-7 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No tiene estudiantes vinculados.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.estudiantes.map(({ estudiante, relacion }) => {
              const nombre = [
                estudiante.apellido_paterno,
                estudiante.apellido_materno,
                estudiante.nombres,
              ].filter(Boolean).join(" ")

              const iniciales = (
                estudiante.nombres.charAt(0) +
                (estudiante.apellido_paterno?.charAt(0) ?? "")
              ).toUpperCase()

              return (
                <li
                  key={estudiante.estudiante_id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 text-xs font-semibold select-none">
                    {iniciales}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{nombre}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      {relacion.tipo_relacion && (
                        <span className="text-xs text-muted-foreground">{relacion.tipo_relacion}</span>
                      )}
                      {relacion.es_principal && (
                        <span className="text-xs font-medium text-amber-600 bg-amber-500/10 rounded-full px-2 py-0.5">
                          Principal
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/estudiantes/${estudiante.estudiante_id}/detalles`}
                    className="text-xs text-primary hover:underline shrink-0"
                  >
                    Ver perfil
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/acudientes"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Perfil del acudiente</h1>
      </div>

      <PersonaView
        persona={data.persona}
        rolLabel="Acudiente"
        rolColor="amber"
        rolContent={rolContent}
        editHref={`/dashboard/acudientes/${acudienteId}/editar`}
        archivosEditables
      />
    </div>
  )
}
