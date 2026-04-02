"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { PersonaForm, type PersonaFormData } from "@/components/personas/persona-form"
import type { CreatePersonaInput } from "@/lib/types"

interface EstudianteFormProps {
  initialData?: {
    persona?: Partial<CreatePersonaInput>
    estudiante?: { estado?: string; fecha_ingreso?: string }
  }
  onSubmit: (data: {
    persona: CreatePersonaInput
    estudiante: { estado?: string; fecha_ingreso?: string }
  }) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

export function EstudianteForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: EstudianteFormProps) {
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
  const [estado, setEstado] = useState(
    initialData?.estudiante?.estado ?? "activo"
  )
  const [fechaIngreso, setFechaIngreso] = useState(
    initialData?.estudiante?.fecha_ingreso ?? ""
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
        estudiante: {
          estado,
          fecha_ingreso: fechaIngreso || undefined,
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

      {/* Sección de Datos del Estudiante */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
          Datos del Estudiante
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className={inputClass}
              disabled={isSubmitting}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="graduado">Graduado</option>
              <option value="suspendido">Suspendido</option>
              <option value="expulsado">Expulsado</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Fecha de ingreso
            </label>
            <input
              type="date"
              value={fechaIngreso}
              onChange={(e) => setFechaIngreso(e.target.value)}
              className={inputClass}
              disabled={isSubmitting}
            />
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
