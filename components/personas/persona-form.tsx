"use client"

import { useState } from "react"
import useSWR from "swr"
import { Search, X, BadgeCheck } from "lucide-react"
import { swrFetcher } from "@/lib/api/fetcher"
import { PersonaSearchModal } from "@/components/personas/persona-search-modal"
import type { PaginatedApiResponse, TipoDocumento, Persona, PersonaWithTipoDocumento } from "@/lib/types"
import { toast } from "sonner"

export interface PersonaFormData extends Persona {}

interface PersonaFormProps {
  data: Persona
  onChange: (data: Persona) => void
  disabled?: boolean
  /**
   * Cuando es true, muestra un botón "Buscar persona existente" encima del form.
   * Al seleccionar una persona, precarga los campos y emite onPersonaExistenteSeleccionada.
   *
   * Uso: ProfesorForm, AdministrativoForm — donde una persona puede ya existir con otro rol.
   * NO usar en EstudianteStepper (un estudiante no puede ser profesor previo).
   *
   * @default false
   */
  allowSearch?: boolean
  /**
   * Callback opcional — emite el persona_id de la persona ya existente
   * para que el padre pueda usarlo en el PUT en lugar de crear una nueva.
   */
  onPersonaExistenteSeleccionada?: (personaId: number) => void
  /**
   * Título del modal de búsqueda.
   * @default "Buscar persona existente"
   */
  searchModalTitulo?: string
}

// Grupos sanguíneos como constante — si el backend los amplía, solo cambia aquí
const GRUPOS_SANGUINEOS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const

export function PersonaForm({
  data,
  onChange,
  disabled = false,
  allowSearch = false,
  onPersonaExistenteSeleccionada,
  searchModalTitulo,
}: PersonaFormProps) {
  const { data: tiposDoc } = useSWR<PaginatedApiResponse<TipoDocumento>>(
    "/tipos-documento/getAll?limit=50&offset=0",
    swrFetcher
  )

  // ── Estado del modal y persona precargada ─────────────────────────────────
  const [modalAbierto, setModalAbierto]             = useState(false)
  const [personaPreseleccionada, setPersonaPreseleccionada] =
    useState<PersonaWithTipoDocumento | null>(null)

  /**
   * Cuando el usuario confirma una persona en el modal:
   * 1. Precargamos todos los campos del form con sus datos.
   * 2. Guardamos la persona para mostrar el badge.
   * 3. Notificamos al padre con el persona_id.
   */
  function handlePersonaSeleccionada(persona: PersonaWithTipoDocumento) {
    const nuevaData: Persona = {
      persona_id:           persona.persona_id,
      nombres:              persona.nombres ?? "",
      apellido_paterno:     persona.apellido_paterno  ?? "",
      apellido_materno:     persona.apellido_materno  ?? "",
      tipo_documento_id:    persona.tipo_documento.tipo_documento_id,
      numero_documento:     persona.numero_documento,
      fecha_nacimiento:     persona.fecha_nacimiento?.split("T")[0] ?? "",
      genero:               persona.genero,
      grupo_sanguineo:      persona.grupo_sanguineo,
      grupo_etnico:         persona.grupo_etnico,
      credo_religioso:      persona.credo_religioso,
      lugar_nacimiento:     persona.lugar_nacimiento,
      serial_registro_civil: persona.serial_registro_civil,
      expedida_en:          persona.expedida_en,
    }

    onChange(nuevaData)
    setPersonaPreseleccionada(persona)
    onPersonaExistenteSeleccionada?.(persona.persona_id)
  }

  function handleLimpiarPersona() {
    setPersonaPreseleccionada(null)
    onPersonaExistenteSeleccionada?.(0) // 0 = sin persona preseleccionada
  }

  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

  /**
   * Cuando hay una persona preseleccionada, bloqueamos los campos de identidad
   * (nombres, documento, fecha de nacimiento) para evitar modificar datos
   * que afectarían a TODOS sus roles en el sistema.
   *
   * Los campos complementarios (grupo étnico, credo, etc.) sí se pueden editar
   * ya que son datos enriquecidos, no identificadores.
   */
  const camposIdentidadBloqueados = disabled || personaPreseleccionada !== null

  const handleChange = (field: keyof PersonaFormData, value: string | number) => {
    onChange({ ...data, [field]: value })
  }
  

  return (
    <div className="flex flex-col gap-6">

      {/* ── Sección de búsqueda (solo si allowSearch = true) ─────────────── */}
      {allowSearch && (
        <div>
          {personaPreseleccionada ? (
            /* Badge de persona ya seleccionada */
            <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
              <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  Persona existente seleccionada
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {[
                    personaPreseleccionada.nombres,
                    personaPreseleccionada.apellido_paterno,
                    personaPreseleccionada.apellido_materno,
                  ].filter(Boolean).join(" ")}
                  {" · "}
                  {personaPreseleccionada.tipo_documento.nombre_documento} {personaPreseleccionada.numero_documento}
                  {" · ID #"}{personaPreseleccionada.persona_id}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLimpiarPersona}
                title="Desvincular y llenar manualmente"
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            /* Botón para abrir el modal */
            <button
              type="button"
              onClick={() => setModalAbierto(true)}
              disabled={disabled}
              className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-muted/50 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span>Buscar persona ya registrada en el sistema...</span>
              <span className="ml-auto text-xs text-muted-foreground/60">opcional</span>
            </button>
          )}
        </div>
      )}

      {/* ── Aviso cuando los campos de identidad están bloqueados ─────────── */}
      {personaPreseleccionada && (
        <p className="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
          Los campos de identificación están bloqueados porque esta persona ya existe en el sistema.
          Puedes editar los datos complementarios (grupo étnico, credo, etc.) si es necesario.
        </p>
      )}

      {/* ── Datos obligatorios ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Nombres <span className="text-destructive">*</span>
          </label>
          <input
            required
            disabled={camposIdentidadBloqueados}
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
            disabled={camposIdentidadBloqueados}
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
            disabled={camposIdentidadBloqueados}
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
            disabled={camposIdentidadBloqueados}
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
            disabled={camposIdentidadBloqueados}
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
            disabled={camposIdentidadBloqueados}
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
            disabled={camposIdentidadBloqueados}
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
            disabled={camposIdentidadBloqueados}
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
            disabled={camposIdentidadBloqueados}
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
            disabled={camposIdentidadBloqueados}
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

      {/* ── Modal de búsqueda ── */}
      {modalAbierto && (
        <PersonaSearchModal
          titulo={searchModalTitulo}
          onSeleccionar={handlePersonaSeleccionada}
          onCerrar={() => setModalAbierto(false)}
        />
      )}

    </div>
  )
}