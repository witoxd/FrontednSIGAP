"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Users, ArrowRight, Search } from "lucide-react"

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface EstudiantePeriodo {
  matricula_id:    number
  estudiante_id:   number
  nombres:         string
  apellido_paterno: string
  apellido_materno?: string | null
  numero_documento?: string | null
  tipo_documento?:   string | null
  estado_actual:   string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function nombreCompleto(e: EstudiantePeriodo) {
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
  estudiantes: EstudiantePeriodo[]
  cargando:    boolean
}

// ── Componente ────────────────────────────────────────────────────────────────

export function SeccionEstudiantes({ estudiantes, cargando }: SeccionEstudiantesProps) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState("")

  const filtrados = estudiantes.filter((e) => {
    if (!busqueda) return true
    const texto = `${e.nombres} ${e.apellido_paterno} ${e.apellido_materno ?? ""} ${e.numero_documento ?? ""}`.toLowerCase()
    return texto.includes(busqueda.toLowerCase())
  })

  return (
    <div className="flex flex-col gap-4">

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar estudiante..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="h-9 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Contador */}
      {!cargando && (
        <p className="text-xs text-muted-foreground">
          {filtrados.length} estudiante{filtrados.length !== 1 ? "s" : ""}
          {estudiantes.length !== filtrados.length && ` de ${estudiantes.length}`}
        </p>
      )}

      {/* Lista */}
      {cargando ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          Cargando estudiantes…
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
          <Users className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {estudiantes.length === 0
              ? "No hay estudiantes matriculados en este período."
              : "Ningún estudiante coincide con la búsqueda."}
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
