"use client"

/**
 * EJEMPLO PRÁCTICO: Formulario de Estudiante con Carga de Archivos
 * 
 * Este componente demuestra cómo integrar el ArchivoUploader
 * en un flujo de inscripción de estudiante en 2 pasos:
 * 
 * PASO 1: Crear estudiante (datos personales + datos académicos)
 * PASO 2: Subir documentos requeridos (opcional u obligatorio)
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react"
import { PersonaForm, type PersonaFormData } from "@/components/forms/persona-form"
import { ArchivoUploader } from "@/components/shared/archivo-uploader"
import { estudiantesApi } from "@/lib/api/services/estudiantes"
import type { CreateEstudianteInput } from "@/lib/types"

interface EstudianteFormConArchivosProps {
  onSuccess?: () => void
  onCancel?: () => void
  documentosObligatorios?: boolean // Si true, requiere documentos para completar
  tiposRequeridos?: number[] // IDs de tipos de archivo requeridos
}

type Paso = "datos" | "documentos" | "completado"

export function EstudianteFormConArchivos({
  onSuccess,
  onCancel,
  documentosObligatorios = false,
  tiposRequeridos = [],
}: EstudianteFormConArchivosProps) {
  const router = useRouter()
  
  // Estado del formulario
  const [paso, setPaso] = useState<Paso>("datos")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Datos del estudiante
  const [personaData, setPersonaData] = useState<PersonaFormData>({
    nombres: "",
    apellido_paterno: "",
    apellido_materno: "",
    tipo_documento_id: 0,
    numero_documento: "",
    fecha_nacimiento: "",
    genero: "Masculino",
  })
  const [estado, setEstado] = useState("activo")
  const [fechaIngreso, setFechaIngreso] = useState("")
  
  // ID de la persona creada (para el uploader)
  const [personaId, setPersonaId] = useState<number | null>(null)
  const [estudianteNombre, setEstudianteNombre] = useState("")

  // ============================================================================
  // PASO 1: Guardar datos del estudiante
  // ============================================================================

  const handleSubmitDatos = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const datosEstudiante: CreateEstudianteInput = {
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
      }

      console.log("[v0] Creando estudiante:", datosEstudiante)
      const response = await estudiantesApi.create(datosEstudiante)
      console.log("[v0] Estudiante creado:", response)

      // Guardar el persona_id para el siguiente paso
      // Asumiendo que el backend devuelve el persona_id en la respuesta
      const nuevoPersonaId = response.data?.persona_id
      
      if (!nuevoPersonaId) {
        throw new Error("No se recibió el persona_id del servidor")
      }

      setPersonaId(nuevoPersonaId)
      setEstudianteNombre(`${personaData.nombres} ${personaData.apellido_paterno || ""}`)
      
      // Ir al paso de documentos
      setPaso("documentos")
    } catch (err) {
      console.error("[v0] Error al crear estudiante:", err)
      setError(err instanceof Error ? err.message : "Error al crear el estudiante")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============================================================================
  // PASO 2: Subir documentos
  // ============================================================================

  const handleDocumentosSuccess = (archivos: unknown[]) => {
    console.log("[v0] Documentos subidos:", archivos)
    setPaso("completado")
    
    // Opcional: redirigir después de un delay
    setTimeout(() => {
      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/dashboard/estudiantes")
      }
    }, 2000)
  }

  const handleDocumentosError = (errorMsg: string) => {
    console.error("[v0] Error al subir documentos:", errorMsg)
    setError(errorMsg)
  }

  const omitirDocumentos = () => {
    if (documentosObligatorios) {
      setError("Los documentos son obligatorios para completar la inscripción")
      return
    }
    
    setPaso("completado")
    setTimeout(() => {
      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/dashboard/estudiantes")
      }
    }, 1500)
  }

  // ============================================================================
  // Estilos reutilizables
  // ============================================================================

  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

  // ============================================================================
  // RENDERIZADO POR PASO
  // ============================================================================

  // PASO 1: Formulario de datos
  if (paso === "datos") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Inscribir Nuevo Estudiante
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Paso 1 de 2: Datos personales y académicos
            </p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmitDatos} className="flex flex-col gap-6">
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
              Datos Académicos
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Estado
                </label>
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
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Continuar"
              )}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // PASO 2: Subir documentos
  if (paso === "documentos") {
    return (
      <div className="flex flex-col gap-6">
        {/* Header con progreso */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setPaso("datos")}
              className="p-1 hover:bg-muted rounded transition-colors"
              title="Volver a editar datos"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-2xl font-bold text-foreground">
              Documentos del Estudiante
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Paso 2 de 2: {estudianteNombre}
          </p>
        </div>

        {/* Alerta de éxito al crear estudiante */}
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Estudiante registrado exitosamente
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {documentosObligatorios
                  ? "Ahora debes subir los documentos requeridos para completar la inscripción"
                  : "Puedes subir los documentos ahora o hacerlo más tarde desde el perfil del estudiante"}
              </p>
            </div>
          </div>
        </div>

        {/* Información de documentos requeridos */}
        {tiposRequeridos.length > 0 && (
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-sm font-medium text-foreground mb-2">
              Documentos requeridos:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Certificado de estudios previos</li>
              <li>Fotografía reciente del estudiante</li>
              <li>Documento de identidad</li>
            </ul>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Componente de carga de archivos */}
        {personaId && (
          <ArchivoUploader
            persona_id={personaId}
            tiposRequeridos={tiposRequeridos}
            maxFiles={10}
            maxFileSize={10}
            onSuccess={handleDocumentosSuccess}
            onError={handleDocumentosError}
          />
        )}

        {/* Opción de omitir (solo si no es obligatorio) */}
        {!documentosObligatorios && (
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Puedes agregar documentos más tarde desde el perfil
            </p>
            <button
              onClick={omitirDocumentos}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Omitir este paso
            </button>
          </div>
        )}
      </div>
    )
  }

  // PASO 3: Completado
  if (paso === "completado") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            ¡Inscripción Completada!
          </h2>
          <p className="text-muted-foreground">
            {estudianteNombre} ha sido inscrito exitosamente
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <p className="text-sm text-muted-foreground">
            Redirigiendo...
          </p>
        </div>
      </div>
    )
  }

  return null
}
