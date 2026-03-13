"use client"

import useSWR from "swr"
import { swrFetcher } from "@/lib/api/fetcher"
import type { PaginatedApiResponse, TipoDocumento, Persona } from "@/lib/types"

export interface PersonaFormData extends Persona {}

interface PersonaFormProps {
  data: Persona
  onChange: (data: Persona) => void
  disabled?: boolean
}

// Grupos sanguíneos como constante — si el backend los amplía, solo cambia aquí
const GRUPOS_SANGUINEOS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const

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
    <div className="flex flex-col gap-6">

      {/* ── Datos obligatorios ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Nombres <span className="text-destructive">*</span>
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
            Tipo de documento <span className="text-destructive">*</span>
          </label>
          <select
            required
            disabled={disabled}
            value={data.tipo_documento_id}
            onChange={(e) => handleChange("tipo_documento_id", Number(e.target.value))}
            className={inputClass}
          >
            <option value={0} disabled>Seleccionar...</option>
            {tiposDoc?.data?.map((td) => (
              <option key={td.tipo_documento_id} value={td.tipo_documento_id}>
                {td.nombre_documento}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Número de documento <span className="text-destructive">*</span>
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
            Expedida en
          </label>
          <input
            disabled={disabled}
            value={data.expedida_en ?? ""}
            onChange={(e) => handleChange("expedida_en", e.target.value)}
            placeholder="Ciudad donde fue expedida"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Fecha de nacimiento <span className="text-destructive">*</span>
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
            Lugar de nacimiento
          </label>
          <input
            disabled={disabled}
            value={data.lugar_nacimiento ?? ""}
            onChange={(e) => handleChange("lugar_nacimiento", e.target.value)}
            placeholder="Ciudad o municipio"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Género <span className="text-destructive">*</span>
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

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Grupo sanguíneo <span className="text-destructive">*</span>
          </label>
          <select
            required
            disabled={disabled}
            value={data.grupo_sanguineo ?? ""}
            onChange={(e) => handleChange("grupo_sanguineo", e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>Seleccionar...</option>
            {GRUPOS_SANGUINEOS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

      </div>

      {/* ── Datos complementarios ──────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Datos complementarios
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Serial registro civil
            </label>
            <input
              disabled={disabled}
              value={data.serial_registro_civil ?? ""}
              onChange={(e) => handleChange("serial_registro_civil", e.target.value)}
              placeholder="Serial del registro civil"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Grupo étnico
            </label>
            <input
              disabled={disabled}
              value={data.grupo_etnico ?? ""}
              onChange={(e) => handleChange("grupo_etnico", e.target.value)}
              placeholder="Ej: Wayuu, Zenú, Ninguno"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Credo religioso
            </label>
            <input
              disabled={disabled}
              value={data.credo_religioso ?? ""}
              onChange={(e) => handleChange("credo_religioso", e.target.value)}
              placeholder="Ej: Católico, Cristiano, Ninguno"
              className={inputClass}
            />
          </div>

        </div>
      </div>

    </div>
  )
}