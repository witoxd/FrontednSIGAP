"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Loader2, User } from "lucide-react"
import { contactosApi }     from "@/lib/api/services/contactos"
import { archivosApi }      from "@/lib/api/services/archivos"
import { SeccionArchivos }  from "@/components/archivos/SeccionArchivos"
import { ContactoList }     from "@/components/shared/contactos/contacto-list"
import type { PersonaWithTipoDocumento, Contacto } from "@/lib/types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFecha(iso?: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit", month: "long", year: "numeric",
  })
}

function calcularEdad(fechaNac?: string | null): string {
  if (!fechaNac) return "—"
  const hoy  = new Date()
  const nac  = new Date(fechaNac)
  const edad = hoy.getFullYear() - nac.getFullYear() -
    (hoy < new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate()) ? 1 : 0)
  return `${edad} años`
}

function inicialesNombre(nombres: string, apellido: string): string {
  const n = nombres.trim().charAt(0).toUpperCase()
  const a = apellido.trim().charAt(0).toUpperCase()
  return `${n}${a}`
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function DatoFila({ label, valor }: { label: string; valor?: string | null }) {
  if (!valor) return null
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{valor}</dd>
    </div>
  )
}

function SeccionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pb-2 border-b border-border mb-3">
      {children}
    </p>
  )
}

// Foto de perfil con fallback a iniciales
function AvatarPersona({
  personaId,
  iniciales,
}: {
  personaId: number
  iniciales: string
}) {
  const [src,    setSrc]    = useState<string | null>(null)
  const [error,  setError]  = useState(false)

  useEffect(() => {
    // Intentar cargar la foto de perfil
    archivosApi.getPhotoBlob(personaId)
      .then((blob) => setSrc(URL.createObjectURL(blob)))
      .catch(() => setError(true))

    return () => { if (src) URL.revokeObjectURL(src) }
  }, [personaId])

  if (src && !error) {
    return (
      <img
        src={src}
        alt="Foto de perfil"
        className="h-20 w-20 rounded-full object-cover border-2 border-border"
        onError={() => setError(true)}
      />
    )
  }

  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent border-2 border-border text-2xl font-bold text-accent-foreground">
      {iniciales}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface PersonaViewProps {
  /** Datos de la persona — requerido */
  persona:      PersonaWithTipoDocumento
  /** Badge de rol — ej: "Estudiante", "Profesor" */
  rolLabel:     string
  /** Color del acento del rol (clase Tailwind de fondo) para la card de rol */
  rolColor?:    "blue" | "green" | "teal" | "amber"
  /** Contenido específico del rol (datos de estudiante, profesor, etc.) */
  rolContent:   React.ReactNode
  /** Href para el botón "Editar" */
  editHref?:    string
  /** Acciones adicionales en el sidebar (ej: "Ver matrículas") */
  accionesSidebar?: React.ReactNode
  /** Si true, los archivos se pueden editar/eliminar */
  archivosEditables?: boolean
}

// ── Mapa de colores de acento por rol ─────────────────────────────────────────
// Analogía: cada rol tiene su "uniforme" visual — azul para estudiantes,
// verde para profesores, igual que los distintivos en un colegio real.

const rolColorMap: Record<string, { border: string; icon: string; label: string }> = {
  blue:  { border: "border-l-[3px] border-l-primary",  icon: "text-primary",  label: "text-primary"  },
  green: { border: "border-l-[3px] border-l-success",  icon: "text-success",  label: "text-success"  },
  teal:  { border: "border-l-[3px] border-l-accent-foreground", icon: "text-accent-foreground", label: "text-accent-foreground" },
  amber: { border: "border-l-[3px] border-l-warning",  icon: "text-warning",  label: "text-warning"  },
}

// ── Componente principal ──────────────────────────────────────────────────────

export function PersonaView({
  persona,
  rolLabel,
  rolColor = "blue",
  rolContent,
  editHref,
  accionesSidebar,
  archivosEditables = true,
}: PersonaViewProps) {
  const router   = useRouter()
  const colores  = rolColorMap[rolColor]
  const iniciales = inicialesNombre(persona.nombres, persona.apellido_paterno ?? "")
  const nombreCompleto = [
    persona.nombres,
    persona.apellido_paterno,
    persona.apellido_materno,
  ].filter(Boolean).join(" ")

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-start">

      {/* ════════════════════════════════════════
          SIDEBAR IZQUIERDO
      ════════════════════════════════════════ */}
      <div className="flex flex-col gap-4">

        {/* Tarjeta de identidad */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center text-center gap-3">
          <AvatarPersona personaId={persona.persona_id} iniciales={iniciales} />

          <div>
            <h2 className="text-base font-semibold text-foreground leading-snug">
              {nombreCompleto}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {persona.tipo_documento.nombre_documento} · {persona.numero_documento}
            </p>
          </div>

          {/* Badge de rol */}
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            rolColor === "blue"  ? "bg-primary/10 text-primary"              :
            rolColor === "green" ? "bg-success/10 text-success"              :
            rolColor === "teal"  ? "bg-accent text-accent-foreground"        :
                                   "bg-warning/10 text-warning"
          }`}>
            {rolLabel}
          </span>

          {/* Botón editar */}
          {editHref && (
            <button
              onClick={() => router.push(editHref)}
              className="flex items-center gap-1.5 w-full justify-center rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Pencil className="h-4 w-4" />
              Editar perfil
            </button>
          )}
        </div>

        {/* Datos de identificación clave */}
        <div className="rounded-xl border border-border bg-card p-4">
          <SeccionLabel>Identificación</SeccionLabel>
          <dl className="flex flex-col gap-2.5">
            <DatoFila label="Persona ID"         valor={`#${persona.persona_id}`} />
            <DatoFila label="Fecha de nacimiento" valor={formatFecha(persona.fecha_nacimiento)} />
            <DatoFila label="Edad"               valor={calcularEdad(persona.fecha_nacimiento)} />
            <DatoFila label="Género"             valor={persona.genero} />
            <DatoFila label="Grupo sanguíneo"    valor={persona.grupo_sanguineo} />
            <DatoFila label="Expedida en"        valor={persona.expedida_en} />
          </dl>
        </div>

        {/* Acciones adicionales pasadas por el padre */}
        {accionesSidebar && (
          <div className="rounded-xl border border-border bg-card p-4">
            <SeccionLabel>Acciones</SeccionLabel>
            {accionesSidebar}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════
          CONTENIDO PRINCIPAL DERECHO
      ════════════════════════════════════════ */}
      <div className="flex flex-col gap-4">

        {/* Datos personales completos */}
        <div className="rounded-xl border border-border bg-card p-5">
          <SeccionLabel>Datos personales</SeccionLabel>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            <DatoFila label="Nombres"           valor={persona.nombres} />
            <DatoFila label="Apellido paterno"  valor={persona.apellido_paterno} />
            <DatoFila label="Apellido materno"  valor={persona.apellido_materno} />
            <DatoFila label="Lugar de nacimiento" valor={persona.lugar_nacimiento} />
            <DatoFila label="Grupo étnico"      valor={persona.grupo_etnico} />
            <DatoFila label="Credo religioso"   valor={persona.credo_religioso} />
            <DatoFila label="Serial reg. civil" valor={persona.serial_registro_civil} />
          </dl>
        </div>

        {/* Datos específicos del rol — con acento de color */}
        <div className={`rounded-xl border border-border bg-card p-5 ${colores.border}`}>
          <SeccionLabel>{rolLabel}</SeccionLabel>
          {rolContent}
        </div>

        {/* Contactos */}
        <div className="rounded-xl border border-border bg-card p-5">
          <SeccionLabel>Contactos</SeccionLabel>
          <ContactoList personaId={persona.persona_id} />
        </div>

        {/* Documentos */}
        <div className="rounded-xl border border-border bg-card p-5">
          <SeccionLabel>Documentos</SeccionLabel>
          <SeccionArchivos
            personaId={persona.persona_id}
            editable={archivosEditables}
          />
        </div>

      </div>
    </div>
  )
}
