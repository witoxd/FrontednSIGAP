"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { ProfilePhotoUploader } from "@/components/shared/profile-photo-uploader"
import { estudiantesApi } from "@/lib/api/services/estudiantes"
import { tiposArchivosApi } from "@/lib/api/services/tipos-archivos"
import type { Estudiante, CreateEstudianteInput, EstudianteConPersona } from "@/lib/types"
import type { TipoDocumento } from "@/lib/types"
import { tiposDocumentoApi } from "@/lib/api/services/tipos-documento"

export default function EditarEstudiantePage() {
  const router = useRouter()
  const params = useParams()
  const estudianteId = parseInt(params.id as string)

  const [estudiante, setEstudiante] = useState<EstudianteConPersona | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [fotoPerfilTipoId, setFotoPerfilTipoId] = useState<number>(1)

  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([])

  useEffect(() => {
    async function loadTiposDocumento() {
      try {
        const response = await tiposDocumentoApi.getAll()
        setTiposDocumento(response.data) // PaginatedApiResponse usa .items
      } catch (err) {
        console.error("Error al cargar tipos de documento:", err)
      }
    }
    loadTiposDocumento()
  }, [])

  useEffect(() => {
    const fetchEstudiante = async () => {
      try {
        const response = await estudiantesApi.getById(estudianteId)
        setEstudiante(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar el estudiante")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEstudiante()
  }, [estudianteId])

  useEffect(() => {
    async function loadTipoArchivo() {
      try {
        const response = await tiposArchivosApi.getAll()
        const fotoPerfil = response.data.find((tipo: any) =>
          tipo.nombre?.toLowerCase().includes("foto") ||
          tipo.nombre?.toLowerCase().includes("perfil")
        )
        if (fotoPerfil) {
          setFotoPerfilTipoId(fotoPerfil.tipo_archivo_id)
        }
      } catch (err) {
        console.error("Error al cargar tipos de archivo:", err)
      }
    }
    loadTipoArchivo()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)

      // Crear objeto de actualización
      const input: CreateEstudianteInput = {
        persona: {
          nombres: formData.get("nombres") as string,
          apellido_paterno: formData.get("apellido_paterno") as string,
          apellido_materno: formData.get("apellido_materno") as string,
          tipo_documento_id: Number(formData.get("tipo_documento_id") as unknown),
          numero_documento: formData.get("numero_documento") as string,
          fecha_nacimiento: formData.get("fecha_nacimiento") as string,
          genero: formData.get("genero") as string,
        },
        estado: formData.get("estado") as string,
        fecha_ingreso: formData.get("fecha_ingreso") as string,
      }

      // Actualizar estudiante
      await estudiantesApi.update(estudianteId, input)

      // Si hay nueva foto, subirla
      if (photoFile && estudiante?.persona_id) {
        const photoFormData = new FormData()
        photoFormData.append("archivos", photoFile)
        photoFormData.append("persona_id", estudiante.persona_id.toString())
        photoFormData.append("tipo_archivo_id", fotoPerfilTipoId.toString())
        photoFormData.append("descripcion", "Foto de perfil")

        await fetch("/api/archivos/bulkCreate", {
          method: "POST",
          body: photoFormData,
        })
      }

      // Redirigir a la lista de estudiantes
      router.push("/dashboard/estudiantes")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el estudiante")
    } finally {
      setIsSubmitting(false)
    }
  }

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
          <Link
            href="/dashboard/estudiantes"
            className="text-primary hover:underline mt-4 inline-block"
          >
            Volver a la lista
          </Link>
        </div>
      </div>
    )
  }

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
        {/* Foto de Perfil */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Foto de Perfil</h2>
          <ProfilePhotoUploader
            personaId={estudiante.persona_id}
            tipoArchivoId={fotoPerfilTipoId}
            onPhotoChange={setPhotoFile}
            disabled={isSubmitting}
          />
        </div>

        {/* Información Personal */}
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
                defaultValue={estudiante.nombres}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
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
                defaultValue={estudiante.apellido_paterno}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
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
                defaultValue={estudiante.apellido_materno}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="tipo_documento" className="block text-sm font-medium mb-2">
                Tipo de Documento <span className="text-destructive">*</span>
              </label>
              <select
                id="tipo_documento_id"
                name="tipo_documento_id"
                required
                defaultValue={estudiante.tipo_documento_id}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                <option value="">Seleccionar</option>
                {tiposDocumento.map((tipo) => (
                  <option key={tipo.tipo_documento_id} value={tipo.tipo_documento}>
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
                defaultValue={estudiante.numero_documento}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
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
                defaultValue={estudiante.fecha_nacimiento?.split('T')[0]}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="genero" className="block text-sm font-medium mb-2">
                Género
              </label>
              <select
                id="genero"
                name="genero"
                defaultValue={estudiante.genero}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                <option value={estudiante.genero}>Seleccionar</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Información Académica */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Información Académica</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


            <div>
              <label htmlFor="estado" className="block text-sm font-medium mb-2">
                estado <span className="text-destructive">*</span>
              </label>
              <select
                id="estado"
                name="estado"
                required
                defaultValue={estudiante.estado}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                <option value={estudiante.estado}>Seleccionar sección</option>
                <option value="activo">Activo</option>
                <option value="inactivo">inactivo</option>
                <option value="graduado">graduado</option>
                <option value="suspendido">suspendido</option>
                <option value="expulsado">expulsado</option>

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
                defaultValue={estudiante.fecha_ingreso?.split('T')[0]}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Botones de acción */}
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
    </div>
  )
}
