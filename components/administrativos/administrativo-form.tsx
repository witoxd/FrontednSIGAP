"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { PersonaForm, type PersonaFormData } from "@/components/forms/persona-form"
import type { CreatePersonaInput } from "@/lib/types"

interface AdministrativoFormProps {
  initialData?: {
    persona?: Partial<CreatePersonaInput>
    administrativo?: { cargo?: string; fecha_contratacion?: string; estado?: boolean }
  }
  onSubmit: (data: {
    persona: CreatePersonaInput
    administrativo: { cargo: string; fecha_contratacion?: string; estado?: boolean }
  }) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

export function AdministrativoForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: AdministrativoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [personaData, setPersonaData] = useState<PersonaFormData>({
    nombres: initialData?.persona?.nombres ?? "",
    apellido_paterno: initialData?.persona?.apellido_paterno ?? "",
    apellido_materno: initialData?.persona?.apellido_materno ?? "",
    tipo_documento_id: initialData?.persona?.tipo_documento_id ?? 0,
    numero_documento: initialData?.persona?.numero_documento ?? "",
    fecha_nacimiento: initialData?.persona?.fecha_nacimiento ?? "",
    genero: initialData?.persona?.genero ?? "Masculino",
  })
  const [cargo, setCargo] = useState(
    initialData?.administrativo?.cargo ?? ""
  )
  const [fechaContratacion, setFechaContratacion] = useState(
    initialData?.administrativo?.fecha_contratacion ?? ""
  )
  const [estado, setEstado] = useState(
    initialData?.administrativo?.estado ?? true
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        persona: {
          nombres: personaData.nombres,
          apellido_paterno: personaData.apellido_paterno || undefined,
          apellido_materno: personaData.apellido_materno || undefined,
          tipo_documento_id: personaData.tipo_documento_id,
          numero_documento: personaData.numero_documento,
          fecha_nacimiento: personaData.fecha_nacimiento,
          genero: personaData.genero,
        },
        administrativo: {
          cargo,
          fecha_contratacion: fechaContratacion || undefined,
          estado,
        },
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Sección de Datos Personales */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
          Datos Personales
        </h3>
        <PersonaForm
          data={personaData}
          onChange={setPersonaData}
          disabled={isSubmitting}
        />
      </div>

      {/* Sección de Datos del Administrativo */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
          Datos del Administrativo
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Cargo *</label>
            <input
              required
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Cargo del administrativo"
              className={inputClass}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Fecha de contratación
            </label>
            <input
              type="date"
              value={fechaContratacion}
              onChange={(e) => setFechaContratacion(e.target.value)}
              className={inputClass}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Estado</label>
            <select
              value={estado ? "activo" : "inactivo"}
              onChange={(e) => setEstado(e.target.value === "activo")}
              className={inputClass}
              disabled={isSubmitting}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  )
}
