"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import useSWR from "swr"
import { swrFetcher } from "@/lib/api/fetcher"
import type { PaginatedApiResponse, TipoDocumento, CreatePersonaInput } from "@/lib/types"

interface PersonaFormProps {
  initialData?: {
    persona?: Partial<CreatePersonaInput>
  }
  onSubmit: (data: {
    persona: CreatePersonaInput
  }) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

export function PersonaForm({
  initialData,
  onSubmit,
}: PersonaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [nombres, setNombres] = useState(initialData?.persona?.nombres ?? "")
  const [apellidoPaterno, setApellidoPaterno] = useState(
    initialData?.persona?.apellido_paterno ?? ""
  )
  const [apellidoMaterno, setApellidoMaterno] = useState(
    initialData?.persona?.apellido_materno ?? ""
  )
  const [tipoDocumentoId, setTipoDocumentoId] = useState(
    initialData?.persona?.tipo_documento_id ?? 0
  )
  const [numeroDocumento, setNumeroDocumento] = useState(
    initialData?.persona?.numero_documento ?? ""
  )
  const [fechaNacimiento, setFechaNacimiento] = useState(
    initialData?.persona?.fecha_nacimiento ?? ""
  )
  const [genero, setGenero] = useState<"Masculino" | "Femenino" | "Otro">(
    initialData?.persona?.genero ?? "Masculino"
  )


  useEffect(() => {
  if (initialData?.persona?.fecha_nacimiento) {
    const fechaISO = initialData?.persona?.fecha_nacimiento
    const fechaFormateada = fechaISO.split("T")[0]
    setFechaNacimiento(fechaFormateada)
  }
}, [initialData?.persona?.fecha_nacimiento])


  const { data: tiposDoc } = useSWR<PaginatedApiResponse<TipoDocumento>>(
    "/tipos-documento/getAll?limit=50&offset=0",
    swrFetcher
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      
      await onSubmit({
        persona: {
          nombres,
          apellido_paterno: apellidoPaterno || undefined,
          apellido_materno: apellidoMaterno || undefined,
          tipo_documento_id: tipoDocumentoId,
          numero_documento: numeroDocumento,
          fecha_nacimiento: fechaNacimiento,
          genero,
        }
      }
    )
    setTipoDocumentoId(tipoDocumentoId)
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Nombres *
          </label>
          <input
            required
            value={nombres}
            onChange={(e) => setNombres(e.target.value)}
            placeholder="Nombres completos"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Apellido paterno
          </label>
          <input
            value={apellidoPaterno}
            onChange={(e) => setApellidoPaterno(e.target.value)}
            placeholder="Apellido paterno"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Apellido materno
          </label>
          <input
            value={apellidoMaterno}
            onChange={(e) => setApellidoMaterno(e.target.value)}
            placeholder="Apellido materno"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Tipo de documento *
          </label>
          <select
            value={tipoDocumentoId}
            onChange={(e) => setTipoDocumentoId(Number(e.target.value))}
            className={inputClass}
          >
            <option value={tipoDocumentoId} disabled>
              Seleccionar...
            </option>
            {tiposDoc?.data?.map((td) => (
              <option key={td.tipo_documento_id} value={td.tipo_documento_id}>
                {td.nombre_documento}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Numero de documento *
          </label>
          <input
             required={isSubmitting} 
            value={numeroDocumento}
            onChange={(e) => setNumeroDocumento(e.target.value)}
            placeholder="Numero de documento"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Fecha de nacimiento *
          </label>
          <input
             required={isSubmitting}
            type="date"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Genero *
          </label>
          <select
            required
            value={genero}
            onChange={(e) =>
              setGenero(e.target.value as "Masculino" | "Femenino" | "Otro")
            }
            className={inputClass}
          >
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
      </div>
    </form>
  )
}
