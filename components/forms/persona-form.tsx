"use client"

import useSWR from "swr"
import { swrFetcher } from "@/lib/api/fetcher"
import type { PaginatedApiResponse, TipoDocumento, CreatePersonaInput } from "@/lib/types"

export interface PersonaFormData {
  nombres: string
  apellido_paterno?: string
  apellido_materno?: string
  tipo_documento_id: number
  numero_documento: string
  fecha_nacimiento: string
  genero: "Masculino" | "Femenino" | "Otro"
}

interface PersonaFormProps {
  data: PersonaFormData
  onChange: (data: PersonaFormData) => void
  disabled?: boolean
}

export function PersonaForm({ data, onChange, disabled = false }: PersonaFormProps) {
  const { data: tiposDoc } = useSWR<PaginatedApiResponse<TipoDocumento>>(
    "/tipos-documento/getAll?limit=50&offset=0",
    swrFetcher
  )

  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

  const handleChange = (field: keyof PersonaFormData, value: string | number) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">
          Nombres *
        </label>
        <input
          required
          disabled={disabled}
          value={data.nombres}
          onChange={(e) => handleChange("nombres", e.target.value)}
          placeholder="Nombres completos"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">
          Apellido paterno
        </label>
        <input
          disabled={disabled}
          value={data.apellido_paterno ?? ""}
          onChange={(e) => handleChange("apellido_paterno", e.target.value)}
          placeholder="Apellido paterno"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">
          Apellido materno
        </label>
        <input
          disabled={disabled}
          value={data.apellido_materno ?? ""}
          onChange={(e) => handleChange("apellido_materno", e.target.value)}
          placeholder="Apellido materno"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">
          Tipo de documento *
        </label>
        <select
          required
          disabled={disabled}
          value={data.tipo_documento_id}
          onChange={(e) => handleChange("tipo_documento_id", Number(e.target.value))}
          className={inputClass}
        >
          <option value={0} disabled>
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
          Número de documento *
        </label>
        <input
          required
          disabled={disabled}
          value={data.numero_documento}
          onChange={(e) => handleChange("numero_documento", e.target.value)}
          placeholder="Número de documento"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">
          Fecha de nacimiento *
        </label>
        <input
          required
          disabled={disabled}
          type="date"
          value={data.fecha_nacimiento}
          onChange={(e) => handleChange("fecha_nacimiento", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">
          Género *
        </label>
        <select
          required
          disabled={disabled}
          value={data.genero}
          onChange={(e) =>
            handleChange("genero", e.target.value as "Masculino" | "Femenino" | "Otro")
          }
          className={inputClass}
        >
          <option value="Masculino">Masculino</option>
          <option value="Femenino">Femenino</option>
          <option value="Otro">Otro</option>
        </select>
      </div>
    </div>
  )
}
