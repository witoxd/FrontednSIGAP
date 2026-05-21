"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Users, Star, ArrowRight, Briefcase, GraduationCap, Phone } from "lucide-react"
import { acudientesApi } from "@/lib/api/services/acudientes"
import { contactosApi } from "@/lib/api/services/contactos"
import type { AcudienteDeEstudiante, Contacto } from "@/lib/types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function nombreCompleto(p: AcudienteDeEstudiante["persona"]) {
  return [p.nombres, p.apellido_paterno, p.apellido_materno].filter(Boolean).join(" ")
}

function iniciales(p: AcudienteDeEstudiante["persona"]) {
  const n = (p.nombres ?? "").trim().charAt(0).toUpperCase()
  const a = (p.apellido_paterno ?? "").trim().charAt(0).toUpperCase()
  return `${n}${a}`
}

function primerContacto(contactos: Contacto[]): string | null {
  const c = contactos.find((c) => c.tipo_contacto === "celular" || c.tipo_contacto === "telefono")
  return c?.valor ?? null
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
      {children}
    </span>
  )
}

function AcudienteCard({
  item,
  onVerPerfil,
}: {
  item: AcudienteDeEstudiante
  onVerPerfil: (acudienteId: number) => void
}) {
  const [contactos, setContactos] = useState<Contacto[]>([])

  useEffect(() => {
    contactosApi
      .getByPersona(item.persona.persona_id)
      .then((res) => setContactos(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
  }, [item.persona.persona_id])

  const telefono = primerContacto(contactos)

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-border bg-background px-4 py-3.5 transition-colors hover:bg-muted/30">

      {/* Avatar */}
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
        item.es_principal
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-muted text-muted-foreground"
      }`}>
        {iniciales(item.persona)}
      </div>

      {/* Info central */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground truncate">
            {nombreCompleto(item.persona)}
          </p>
          {item.es_principal && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wide">
              <Star className="h-2.5 w-2.5" />
              Principal
            </span>
          )}
        </div>

        {/* Documento */}
        <p className="text-xs text-muted-foreground mt-0.5">
          {item.persona.tipo_documento?.nombre_documento ?? "Documento"} · {item.persona.numero_documento ?? "—"}
        </p>

        {/* Chips de metadatos */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {item.tipo_relacion && (
            <Chip>
              <Users className="h-3 w-3" />
              {item.tipo_relacion}
            </Chip>
          )}
          {item.acudiente.ocupacion && (
            <Chip>
              <Briefcase className="h-3 w-3" />
              {item.acudiente.ocupacion}
            </Chip>
          )}
          {item.acudiente.nivel_estudio && (
            <Chip>
              <GraduationCap className="h-3 w-3" />
              {item.acudiente.nivel_estudio}
            </Chip>
          )}
          {telefono && (
            <Chip>
              <Phone className="h-3 w-3" />
              {telefono}
            </Chip>
          )}
        </div>
      </div>

      {/* Acción */}
      <button
        onClick={() => onVerPerfil(item.acudiente.acudiente_id)}
        className="shrink-0 flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
      >
        Ver perfil
        <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
      </button>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface SeccionAcudientesProps {
  estudianteId: number
}

// ── Componente principal ──────────────────────────────────────────────────────

export function SeccionAcudientes({ estudianteId }: SeccionAcudientesProps) {
  const router = useRouter()
  const [acudientes, setAcudientes] = useState<AcudienteDeEstudiante[]>([])
  const [cargando,   setCargando]   = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  useEffect(() => {
    acudientesApi
      .getByEstudiante(estudianteId)
      .then((res) => {
        const lista = Array.isArray(res.data) ? res.data : []
        // Principal primero, luego alfabético
        lista.sort((a, b) => {
          if (a.es_principal && !b.es_principal) return -1
          if (!a.es_principal && b.es_principal) return 1
          return nombreCompleto(a.persona).localeCompare(nombreCompleto(b.persona), "es")
        })
        setAcudientes(lista)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar acudientes"))
      .finally(() => setCargando(false))
  }, [estudianteId])

  function irAPerfil(acudienteId: number) {
    router.push(`/dashboard/acudientes/${acudienteId}/detalles`)
  }

  if (cargando) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando acudientes…
      </div>
    )
  }

  if (error) {
    return (
      <p className="py-4 text-sm text-destructive">{error}</p>
    )
  }

  if (acudientes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-8 text-center">
        <Users className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Este estudiante no tiene acudientes asignados.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {acudientes.map((item) => (
        <AcudienteCard
          key={item.acudiente.acudiente_id}
          item={item}
          onVerPerfil={irAPerfil}
        />
      ))}
    </div>
  )
}
