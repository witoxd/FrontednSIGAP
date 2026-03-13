"use client"

import { useState, useEffect } from "react"
import { Phone, Smartphone, Mail, MapPin, Contact, Star, Loader2 } from "lucide-react"
import { contactosApi } from "@/lib/api/services/contactos"
import type { Contacto } from "@/lib/types"

// ── Constantes ────────────────────────────────────────────────────────────────

type TipoContacto = Contacto["tipo_contacto"]

const TIPO_META: Record<TipoContacto, { label: string; Icon: React.ElementType; href?: (v: string) => string }> = {
  telefono:  { label: "Teléfono",  Icon: Phone,       href: (v) => `tel:${v}` },
  celular:   { label: "Celular",   Icon: Smartphone,  href: (v) => `tel:${v}` },
  email:     { label: "Email",     Icon: Mail,        href: (v) => `mailto:${v}` },
  direccion: { label: "Dirección", Icon: MapPin },
  otro:      { label: "Otro",      Icon: Contact },
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ContactoListProps {
  personaId: number
  /**
   * Si se pasa el array directamente, no se hace fetch interno.
   * Útil cuando el padre ya tiene los contactos cargados (ej. página de perfil).
   */
  contactos?: Contacto[]
  /** Texto cuando no hay contactos */
  emptyMessage?: string
}

// ── Componente ────────────────────────────────────────────────────────────────

export function ContactoList({
  personaId,
  contactos: contactosProp,
  emptyMessage = "Sin contactos registrados.",
}: ContactoListProps) {
  const [contactos, setContactos] = useState<Contacto[]>(contactosProp ?? [])
  const [cargando, setCargando]   = useState(!contactosProp)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    // Si el padre pasó los datos directamente, no hacer fetch
    if (contactosProp) {
      setContactos(contactosProp)
      return
    }

    async function cargar() {
      try {
        const res = await contactosApi.getByPersona(personaId)
        setContactos((res.data ?? []) as Contacto[])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar contactos")
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [personaId, contactosProp])

  // ── Estados de carga / error ───────────────────────────────────────────────

  if (cargando) {
    return (
      <div className="flex items-center gap-2 py-3 text-slate-400 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando contactos...
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-destructive py-2">{error}</p>
  }

  if (contactos.length === 0) {
    return <p className="text-sm text-slate-400 py-2">{emptyMessage}</p>
  }

  // ── Render ────────────────────────────────────────────────────────────────
  /**
   * Orden visual: el principal siempre arriba (el backend ya lo ordena así,
   * pero lo garantizamos también en el cliente).
   */
  const ordenados = [...contactos].sort((a, b) => (b.es_principal ? 1 : 0) - (a.es_principal ? 1 : 0))

  return (
    <ul className="space-y-2">
      {ordenados.map((c) => {
        const meta  = TIPO_META[c.tipo_contacto] ?? TIPO_META["otro"]
        const { Icon } = meta
        const enlace   = meta.href?.(c.valor)

        return (
          <li
            key={c.contacto_id}
            className="flex items-center gap-3 text-sm"
          >
            {/* Icono del tipo */}
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Icon className="h-3.5 w-3.5" />
            </span>

            {/* Valor — clickeable si tiene href (tel:, mailto:) */}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400 leading-none mb-0.5">{meta.label}</p>
              {enlace ? (
                <a
                  href={enlace}
                  className="text-slate-800 hover:text-blue-600 hover:underline transition-colors truncate block"
                >
                  {c.valor}
                </a>
              ) : (
                <span className="text-slate-800 truncate block">{c.valor}</span>
              )}
            </div>

            {/* Badge de principal */}
            {c.es_principal && (
              <span className="flex items-center gap-1 shrink-0 text-xs text-amber-600 font-medium">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                Principal
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
