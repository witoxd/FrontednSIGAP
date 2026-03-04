"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { estudiantesApi } from "@/lib/api/services/estudiantes"
import { tiposArchivosApi } from "@/lib/api/services/tipos-archivos"
import { tiposDocumentoApi } from "@/lib/api/services/tipos-documento"
import { ArchivoUploader } from "@/components/shared/archivo-uploader"
import type { CreateEstudianteInput, TipoDocumento } from "@/lib/types"
import { toast } from "sonner"

export default function NuevoEstudiantePage() {
  const router = useRouter()

  // ── Estado del formulario ──────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Estado de tipos de documento ───────────────────────────────────────────
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([])

  /**
   * personaId: null  → aún no se ha creado el estudiante
   * personaId: number → estudiante creado, mostramos el uploader de documentos
   *
   * Analogía: es como recibir el número de expediente DESPUÉS de entregar
   * el formulario en papel — sin ese número no podemos anexar los documentos.
   */
  const [personaId, setPersonaId] = useState<number | null>(null)

  // ── Carga de catálogos ─────────────────────────────────────────────────────
  useEffect(() => {
    async function loadTiposDocumento() {
      try {
        const response = await tiposDocumentoApi.getAll()
        setTiposDocumento(response.data)
      } catch (err) {
        console.error("Error al cargar tipos de documento:", err)
      }
    }
    loadTiposDocumento()
  }, [])

  // ── Submit del formulario principal ────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)

      const input: CreateEstudianteInput = {
        persona: {
          nombres: formData.get("nombres") as string,
          apellido_paterno: formData.get("apellido_paterno") as string,
          apellido_materno: formData.get("apellido_materno") as string,
          tipo_documento_id: parseInt(formData.get("tipo_documento_id") as string),
          numero_documento: formData.get("numero_documento") as string,
          fecha_nacimiento: formData.get("fecha_nacimiento") as string,
          genero: formData.get("genero") as "Masculino" | "Femenino" | "Otro",
        },
        estudiante: {
           estado: formData.get("estado") as "activo" | "inactivo" | "graduado" | "suspendido" | "expulsado",
          fecha_ingreso: formData.get("fecha_ingreso") as string,
        },
      }

      const response = await estudiantesApi.create(input)

      // Guardamos el persona_id para habilitar el uploader de documentos
      const nuevaPersonaId = response.data.estudiante.persona_id
      if (!nuevaPersonaId) throw new Error("No se recibió el persona_id del servidor")

      setPersonaId(nuevaPersonaId)
      toast.success("Estudiante creado. Ahora puedes subir sus documentos.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el estudiante")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Callbacks del ArchivoUploader ──────────────────────────────────────────
  const handleDocumentosSuccess = () => {
    toast.success("Documentos subidos correctamente")
    router.push("/dashboard/estudiantes")
    router.refresh()
  }

  const handleOmitirDocumentos = () => {
    router.push("/dashboard/estudiantes")
    router.refresh()
  }

  // ── Clases reutilizables ───────────────────────────────────────────────────
  const inputClass =
    "w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/estudiantes"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver
        </Link>
        <h1 className="text-3xl font-bold">Nuevo Estudiante</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/*
       * FASE 1 — Formulario de datos personales y académicos
       * Se oculta una vez que el estudiante fue creado (personaId !== null)
       */}
      {personaId === null && (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ── Información Personal ── */}
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Información Personal</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nombres" className="block text-sm font-medium mb-2">
                  Nombres <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  id="nombres"
                  name="nombres"
                  required
                  disabled={isSubmitting}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="apellido_paterno" className="block text-sm font-medium mb-2">
                  Apellido Paterno <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  id="apellido_paterno"
                  name="apellido_paterno"
                  required
                  disabled={isSubmitting}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="apellido_materno" className="block text-sm font-medium mb-2">
                  Apellido Materno <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  id="apellido_materno"
                  name="apellido_materno"
                  required
                  disabled={isSubmitting}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="tipo_documento_id" className="block text-sm font-medium mb-2">
                  Tipo de Documento <span className="text-destructive">*</span>
                </label>
                <select
                  id="tipo_documento_id"
                  name="tipo_documento_id"
                  required
                  disabled={isSubmitting}
                  className={inputClass}
                >
                  <option value="">Seleccionar</option>
                  {tiposDocumento.map((tipo) => (
                    <option key={tipo.tipo_documento_id} value={tipo.tipo_documento_id}>
                      {tipo.nombre_documento}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="numero_documento" className="block text-sm font-medium mb-2">
                  Número de Documento <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  id="numero_documento"
                  name="numero_documento"
                  required
                  disabled={isSubmitting}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="fecha_nacimiento" className="block text-sm font-medium mb-2">
                  Fecha de Nacimiento <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  id="fecha_nacimiento"
                  name="fecha_nacimiento"
                  required
                  disabled={isSubmitting}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="genero" className="block text-sm font-medium mb-2">
                  Género <span className="text-destructive">*</span>
                </label>
                <select
                  id="genero"
                  name="genero"
                  required
                  disabled={isSubmitting}
                  className={inputClass}
                >
                  <option value="">Seleccionar</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Información Académica ── */}
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Información Académica</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="estado" className="block text-sm font-medium mb-2">
                  Estado <span className="text-destructive">*</span>
                </label>
                <select
                  id="estado"
                  name="estado"
                  required
                  disabled={isSubmitting}
                  className={inputClass}
                >
                  <option value="">Seleccionar</option>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="graduado">Graduado</option>
                  <option value="suspendido">Suspendido</option>
                  <option value="expulsado">Expulsado</option>
                </select>
              </div>

              <div>
                <label htmlFor="fecha_ingreso" className="block text-sm font-medium mb-2">
                  Fecha de Ingreso
                </label>
                <input
                  type="date"
                  id="fecha_ingreso"
                  name="fecha_ingreso"
                  disabled={isSubmitting}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* ── Botones ── */}
          <div className="flex gap-4 justify-end">
            <Link
              href="/dashboard/estudiantes"
              className="px-6 py-2 border border-input rounded-md hover:bg-accent transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar y Continuar
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/*
       * FASE 2 — Carga de documentos
       * Solo se muestra una vez que el estudiante fue creado y tenemos el persona_id.
       * Reutiliza ArchivoUploader de components/shared sin modificar su lógica.
       */}
      {personaId !== null && (
        <div className="space-y-6">
          {/* Indicador de éxito de la fase 1 */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              ✓ Estudiante registrado correctamente
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Puedes subir los documentos del estudiante ahora. Cada archivo requiere
              que selecciones su tipo antes de enviarlo.
            </p>
          </div>

          {/* Uploader multi-documento — reutiliza componente existente */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-1">Documentos del Estudiante</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Puedes subir múltiples archivos (PDF, imágenes, documentos Word).
              Selecciona el tipo de cada documento antes de enviar.
            </p>

            <ArchivoUploader
              persona_id={personaId}
              maxFiles={10}
              maxFileSize={10}
              onSuccess={handleDocumentosSuccess}
              onError={(err) => toast.error(err)}
            />
          </div>

          {/* Opción de omitir */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Puedes agregar documentos más tarde desde el perfil del estudiante.
            </p>
            <button
              onClick={handleOmitirDocumentos}
              className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Omitir y finalizar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}