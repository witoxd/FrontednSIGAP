"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { ProfilePhotoUploader } from "@/components/shared/profile-photo-uploader"
import { estudiantesApi } from "@/lib/api/services/estudiantes"
import { tiposArchivosApi } from "@/lib/api/services/tipos-archivos"
import type { CreateEstudianteInput } from "@/lib/types"
import type { TipoDocumento } from "@/lib/types"
import { tiposDocumentoApi } from "@/lib/api/services/tipos-documento"
import { toast } from "sonner"

export default function NuevoEstudiantePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [personaId, setPersonaId] = useState<number | null>(null)
  const [fotoPerfilTipoId, setFotoPerfilTipoId] = useState<number>(1) // Default 1
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([])

  // Cargar el tipo de archivo para foto de perfil
  useEffect(() => {
    async function loadTipoArchivo() {
      try {
        const response = await tiposArchivosApi.getAll()
        // Buscar el tipo de archivo "Foto de Perfil" o similar
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)

      // Crear objeto de entrada
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
        estudiante:{
        estado: formData.get("estado") as string,
        fecha_ingreso: formData.get("fecha_ingreso") as string,
        }
      }

      // Crear estudiante
      const response = await estudiantesApi.create(input)

      const nuevaPersonaId = response.data.persona_id

      // Si hay foto, subirla
      if (photoFile && nuevaPersonaId) {
        const photoFormData = new FormData()
        photoFormData.append("archivos", photoFile)
        photoFormData.append("persona_id", nuevaPersonaId.toString())
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
      setError(err instanceof Error ? err.message : "Error al crear el estudiante")
    } finally {
      setIsSubmitting(false)
    }
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
        <h1 className="text-3xl font-bold">Nuevo Estudiante</h1>
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
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
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
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                <option value="">Seleccionar</option>
                {tiposDocumento.map((tipo) => (
                  <option key={tipo.tipo_documento_id} value={tipo.tipo_documento_id}>
                    {tipo.nombre_documento}
                  </option>
                ))}
              </select>

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
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
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
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                <option value="">Seleccionar</option>
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
            <div>
              <label htmlFor="estado" className="block text-sm font-medium mb-2">
                estado <span className="text-destructive">*</span>
              </label>
              <select
                id="estado"
                name="estado"
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                <option value="">Seleccionar sección</option>
                <option value="activo">Activo</option>
                <option value="inactivo">inactivo</option>
                <option value="graduado">graduado</option>
                <option value="suspendido">suspendido</option>
                <option value="expulsado">expulsado</option>
              </select>
            </div>

            <div>
              <label htmlFor="feha_ingreso" className="block text-sm font-medium mb-2">
                Fecha de Ingreso 
              </label>
              <input
                type="date"
                id="fecha_ingreso"
                name="fecha_ingreso"
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
                Guardar Estudiante
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
