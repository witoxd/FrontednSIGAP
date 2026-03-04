"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { estudiantesApi } from "@/lib/api/services/estudiantes"
import { tiposDocumentoApi } from "@/lib/api/services/tipos-documento"
import { ArchivoUploader } from "@/components/shared/archivo-uploader"
import type { CreateEstudianteInput, EstudianteWithPersonaDocumento, TipoDocumento } from "@/lib/types"
import { toast } from "sonner"

export default function EditarEstudiantePage() {
  const router = useRouter()
  const params = useParams()
  const estudianteId = parseInt(params.id as string)

  // ── Estado principal ───────────────────────────────────────────────────────
  const [estudiante, setEstudiante] = useState<EstudianteWithPersonaDocumento | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Tipos de documento ─────────────────────────────────────────────────────
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([])

  // ── Carga inicial de datos ─────────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        // Cargamos en paralelo para mayor eficiencia
        const [estudianteRes, tiposDocRes] = await Promise.all([
          estudiantesApi.getById(estudianteId),
          tiposDocumentoApi.getAll(),
        ])
        setEstudiante(estudianteRes.data)
        setTiposDocumento(tiposDocRes.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar los datos")
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [estudianteId])

  // ── Submit del formulario ──────────────────────────────────────────────────
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
          tipo_documento_id: Number(formData.get("tipo_documento_id")),
          numero_documento: formData.get("numero_documento") as string,
          fecha_nacimiento: formData.get("fecha_nacimiento") as string,
          genero: formData.get("genero") as "Masculino" | "Femenino" | "Otro",
        },
        estudiante: {
          estado: formData.get("estado") as "activo" | "inactivo" | "graduado" | "suspendido" | "expulsado",
          fecha_ingreso: formData.get("fecha_ingreso") as string,
        },
      }

      await estudiantesApi.update(estudianteId, input)
      toast.success("Estudiante actualizado correctamente")

      router.push("/dashboard/estudiantes")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el estudiante")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Clases reutilizables ───────────────────────────────────────────────────
  const inputClass =
    "w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"

  // ── Estados de carga / error ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!estudiante) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="text-center">
          <p className="text-muted-foreground">Estudiante no encontrado</p>
          <Link href="/dashboard/estudiantes" className="text-primary hover:underline mt-4 inline-block">
            Volver a la lista
          </Link>
        </div>
      </div>
    )
  }

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
        <h1 className="text-3xl font-bold">Editar Estudiante</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

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
                defaultValue={estudiante.persona.nombres}
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
                defaultValue={estudiante.persona.apellido_paterno}
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
                defaultValue={estudiante.persona.apellido_materno}
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
                defaultValue={estudiante.persona.tipo_documento.tipo_documento_id}
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
                defaultValue={estudiante.persona.numero_documento}
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
                defaultValue={estudiante.persona.fecha_nacimiento?.split("T")[0]}
                disabled={isSubmitting}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="genero" className="block text-sm font-medium mb-2">
                Género
              </label>
              <select
                id="genero"
                name="genero"
                defaultValue={estudiante.persona.genero}
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
                defaultValue={estudiante.estudiante.estado}
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
                Fecha de Ingreso <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                id="fecha_ingreso"
                name="fecha_ingreso"
                required
                defaultValue={estudiante.estudiante.fecha_ingreso?.split("T")[0]}
                disabled={isSubmitting}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* ── Botones del formulario de datos ── */}
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
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>

      {/*
       * ── Documentos del Estudiante ──────────────────────────────────────────
       *
       * En edición, ya tenemos el persona_id desde el inicio, así que el
       * ArchivoUploader se muestra siempre al final del formulario.
       *
       * Separamos visualmente este bloque del <form> con un <section> para
       * dejar claro que es una acción independiente (no depende del submit
       * del formulario principal).
       */}
      <section className="mt-8">
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-1">Documentos del Estudiante</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Sube o agrega nuevos documentos al expediente. Cada archivo requiere
            que selecciones su tipo (cédula, certificado, foto, etc.).
          </p>

          {/*
           * Reutilizamos ArchivoUploader directamente.
           * - persona_id: ya disponible desde la carga inicial
           * - maxFiles / maxFileSize: configuración razonable para expedientes
           * - onSuccess / onError: notificaciones via toast, sin redirección
           *   (en edición queremos que el usuario pueda seguir en la página)
           */}
          <ArchivoUploader
            persona_id={estudiante.persona.persona_id}
            maxFiles={10}
            maxFileSize={10}
            onSuccess={() => toast.success("Documentos subidos correctamente")}
            onError={(err) => toast.error(err)}
          />
        </div>
      </section>
    </div>
  )
}