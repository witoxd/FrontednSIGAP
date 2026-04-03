"use client"

import { useState, useEffect } from "react"
import { Loader2, Users, Briefcase, Phone } from "lucide-react"
import { PersonaForm, type PersonaFormData } from "@/components/personas/persona-form"
import { ContactoManager } from "@/components/shared/contactos/contacto-manager"
import { profesoresApi } from "@/lib/api/services/profesores"
import type { ProfesorWitchPersonaDocumento } from "@/lib/types"

// ── Tipos internos ────────────────────────────────────────────────────────────

interface ProfesorFormData {
  fecha_contratacion: string
  estado: "activo" | "inactivo"
}

// ── Helpers ───────────────────────────────────────────────────────────────────



function personaFromApi(p: ProfesorWitchPersonaDocumento): PersonaFormData {
  const per = p.persona as any
  return {
    nombres:           per.nombres           ?? "",
    apellido_paterno:  per.apellido_paterno  ?? "",
    apellido_materno:  per.apellido_materno  ?? "",
    tipo_documento_id: per.tipo_documento?.tipo_documento_id ?? 0,
    numero_documento:  per.numero_documento  ?? "",
    fecha_nacimiento:  per.fecha_nacimiento?.split("T")[0] ?? "",
    genero:            per.genero            ?? "Masculino",
    grupo_sanguineo:   per.grupo_sanguineo,
    grupo_etnico:      per.grupo_etnico,
    credo_religioso:   per.credo_religioso,
    lugar_nacimiento:  per.lugar_nacimiento,
    expedida_en:       per.expedida_en,
    serial_registro_civil: per.serial_registro_civil,
  }
}

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"

// ── Props — misma firma que el ProfesorForm original del proyecto ─────────────

interface ProfesorFormProps {
  /**
   * Si se pasa profesorId, el componente carga los datos del profesor
   * y opera en modo editar. Sin él, opera en modo crear.
   */
  profesorId?: number
  onCancel?: () => void
}

// ── Componente ────────────────────────────────────────────────────────────────

export function ProfesorForm({ profesorId, onCancel }: ProfesorFormProps) {
  const modo = profesorId ? "editar" : "crear"

  // ── IDs — necesarios para desbloquear ContactoManager ─────────────────────
  const [idPersona,  setIdPersona]  = useState<number | null>(null)
  const [idProfesor, setIdProfesor] = useState<number | null>(profesorId ?? null)
  const seccionesDesbloqueadas = idPersona !== null

  // ── Estado de UI ──────────────────────────────────────────────────────────
  const [cargandoInicial, setCargandoInicial] = useState(modo === "editar")
  const [guardando,       setGuardando]       = useState(false)
  const [error,           setError]           = useState<string | null>(null)

  // ── Datos de formulario ───────────────────────────────────────────────────
  const [personaData,  setPersonaData]  = useState<PersonaFormData>()
  const [profesorData, setProfesorData] = useState<ProfesorFormData>({
    fecha_contratacion: "",
    estado:             "activo",
  })

  // ── Carga inicial (modo editar) ───────────────────────────────────────────
  useEffect(() => {
    if (modo !== "editar" || !profesorId) return

    async function cargar() {
      try {
        const res  = await profesoresApi.getById(profesorId!)
        const data = res.data as ProfesorWitchPersonaDocumento
        setPersonaData(personaFromApi(data))
        setProfesorData({
          fecha_contratacion: data.profesor.fecha_contratacion?.split?.("T")[0] ?? "",
          estado:             data.profesor.estado ?? "activo",
        })
        setIdPersona((data.persona as any).persona_id)
        setIdProfesor(data.profesor.profesor_id ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar datos")
      } finally {
        setCargandoInicial(false)
      }
    }
    cargar()
  }, [modo, profesorId])

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)

    try {
      const dto = {
        persona:  { ...personaData } as any,
        profesor: {
          estado: profesorData.estado,
          ...(profesorData.fecha_contratacion && {
            fecha_contratacion: profesorData.fecha_contratacion,
          }),
        },
      }

      if (modo === "crear") {
        const res  = await profesoresApi.create(dto)
        const data = res.data as ProfesorWitchPersonaDocumento
        setIdPersona((data.persona as any).persona_id)
        setIdProfesor(data.profesor.profesor_id ?? null)
        // No redirigimos — el usuario puede agregar contactos antes de salir
      } else {
        await profesoresApi.update(idProfesor!, dto)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  // ── Render: carga inicial ─────────────────────────────────────────────────
  if (cargandoInicial) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ── Render principal ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">

      {/* ════════════════════════════════════════════════════════════════════
          § 1 + § 2 — Información Personal + Datos del Profesor
          Un solo form — se guardan juntos en la misma request.
      ════════════════════════════════════════════════════════════════════ */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Información personal */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-0">
              Datos Personales
            </h3>
            {seccionesDesbloqueadas && modo === "crear" && (
              <span className="ml-auto text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                Guardado ✓
              </span>
            )}
          </div>
          <PersonaForm
            data={personaData}
            onChange={setPersonaData}
            disabled={guardando}
            allowSearch = {true && modo === "crear"}
          />
        </div>

        {/* Datos del profesor */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Datos del Profesor
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Estado <span className="text-destructive">*</span>
              </label>
              <select
                required
                disabled={guardando}
                value={profesorData.estado}
                onChange={(e) =>
                  setProfesorData((prev) => ({
                    ...prev,
                    estado: e.target.value as "activo" | "inactivo",
                  }))
                }
                className={inputClass}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Fecha de contratación
              </label>
              <input
                type="date"
                disabled={guardando}
                value={profesorData.fecha_contratacion}
                onChange={(e) =>
                  setProfesorData((prev) => ({
                    ...prev,
                    fecha_contratacion: e.target.value,
                  }))
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Botones */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={guardando}
              className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={guardando}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {guardando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : modo === "crear" ? (
              "Guardar y continuar"
            ) : (
              "Guardar cambios"
            )}
          </button>
        </div>
      </form>

      {/* ════════════════════════════════════════════════════════════════════
          § 3 — Contactos
          Bloqueado hasta tener personaId del primer guardado.
      ════════════════════════════════════════════════════════════════════ */}
      <div className={`rounded-xl border border-border bg-card p-6 transition-opacity ${
        seccionesDesbloqueadas ? "" : "opacity-50 pointer-events-none"
      }`}>
        <div className="flex items-center gap-2 mb-5">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Contactos</h3>
          {!seccionesDesbloqueadas && (
            <span className="ml-2 text-xs text-muted-foreground">
              — Guarda primero la información personal
            </span>
          )}
        </div>

        {seccionesDesbloqueadas ? (
          <ContactoManager personaId={idPersona!} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Los contactos estarán disponibles después de guardar.
          </p>
        )}
      </div>

    </div>
  )
}