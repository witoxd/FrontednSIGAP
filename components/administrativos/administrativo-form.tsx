"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { PersonaForm, type PersonaFormData } from "@/components/personas/persona-form"
import type { Persona } from "@/lib/types"

interface AdministrativoData {
  cargo?:         string
  sede?:          string
  jornada_id?:    number
  tipo_contrato?: string
}

interface AdministrativoFormProps {
  initialData?: {
    persona?:        Partial<PersonaFormData>
    administrativo?: AdministrativoData
  }
  onSubmit: (data: {
    persona:        PersonaFormData
    administrativo: AdministrativoData
  }) => Promise<void>
  onCancel:      () => void
  submitLabel?:  string
}

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"

const TIPOS_CONTRATO = ["Provisional", "En propiedad", "OPS", "Hora cátedra", "Otro"]

export function AdministrativoForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: AdministrativoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [personaData, setPersonaData] = useState<PersonaFormData>({
    nombres:               initialData?.persona?.nombres               ?? "",
    apellido_paterno:      initialData?.persona?.apellido_paterno      ?? "",
    apellido_materno:      initialData?.persona?.apellido_materno      ?? "",
    tipo_documento_id:     initialData?.persona?.tipo_documento_id     ?? 0,
    numero_documento:      initialData?.persona?.numero_documento      ?? "",
    fecha_nacimiento:      initialData?.persona?.fecha_nacimiento      ?? "",
    genero:                initialData?.persona?.genero                ?? "Masculino",
    grupo_sanguineo:       initialData?.persona?.grupo_sanguineo,
    grupo_etnico:          initialData?.persona?.grupo_etnico,
    credo_religioso:       initialData?.persona?.credo_religioso,
    lugar_nacimiento:      initialData?.persona?.lugar_nacimiento,
    expedida_en:           initialData?.persona?.expedida_en,
    serial_registro_civil: initialData?.persona?.serial_registro_civil,
  })

  const [adminData, setAdminData] = useState<AdministrativoData>({
    cargo:         initialData?.administrativo?.cargo         ?? "",
    sede:          initialData?.administrativo?.sede          ?? "",
    tipo_contrato: initialData?.administrativo?.tipo_contrato ?? "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({ persona: personaData, administrativo: adminData })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
          Datos Personales
        </h3>
        <PersonaForm data={personaData} onChange={setPersonaData} disabled={isSubmitting} />
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
          Datos del Administrativo
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Cargo *</label>
            <input
              required value={adminData.cargo ?? ""} disabled={isSubmitting}
              onChange={(e) => setAdminData((d) => ({ ...d, cargo: e.target.value }))}
              placeholder="Cargo del administrativo"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Sede</label>
            <input
              value={adminData.sede ?? ""} disabled={isSubmitting}
              onChange={(e) => setAdminData((d) => ({ ...d, sede: e.target.value }))}
              placeholder="Ej: Sede principal"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Tipo de contrato</label>
            <select
              value={adminData.tipo_contrato ?? ""} disabled={isSubmitting}
              onChange={(e) => setAdminData((d) => ({ ...d, tipo_contrato: e.target.value }))}
              className={inputClass}
            >
              <option value="">Seleccionar…</option>
              {TIPOS_CONTRATO.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button" onClick={onCancel} disabled={isSubmitting}
          className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit" disabled={isSubmitting}
          className="flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : submitLabel}
        </button>
      </div>
    </form>
  )
}
