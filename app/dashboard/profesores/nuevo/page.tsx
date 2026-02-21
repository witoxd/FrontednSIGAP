"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { ProfilePhotoUploader } from "@/components/shared/profile-photo-uploader"
import { profesoresApi } from "@/lib/api/services/profesores"
import { tiposArchivosApi } from "@/lib/api/services/tipos-archivos"
import type { CreateProfesorInput } from "@/lib/types"

export default function NuevoProfesorPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [fotoPerfilTipoId, setFotoPerfilTipoId] = useState<number>(1)

  useEffect(() => {
    async function loadTipoArchivo() {
      try {
        const response = await tiposArchivosApi.getAll(50, 0)
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

      const input: CreateProfesorInput = {
        persona: {
          nombres: formData.get("nombres") as string,
          apellido_paterno: formData.get("apellido_paterno") as string,
          apellido_materno: formData.get("apellido_materno") as string,
          tipo_documento: formData.get("tipo_documento") as string,
          numero_documento: formData.get("numero_documento") as string,
          fecha_nacimiento: formData.get("fecha_nacimiento") as string,
          genero: formData.get("genero") as string,
          direccion: formData.get("direccion") as string || undefined,
          telefono: formData.get("telefono") as string || undefined,
          email: formData.get("email") as string || undefined,
        },
        especialidad: formData.get("especialidad") as string,
        fecha_contratacion: formData.get("fecha_contratacion") as string,
      }

      const response = await profesoresApi.create(input)
      const nuevaPersonaId = response.data.persona_id

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

      router.push("/dashboard/profesores")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el profesor")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/profesores"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver
        </Link>
        <h1 className="text-3xl font-bold">Nuevo Profesor</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Foto de Perfil</h2>
          <ProfilePhotoUploader
            tipoArchivoId={fotoPerfilTipoId}
            onPhotoChange={setPhotoFile}
            disabled={isSubmitting}
          />
        </div>

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
              <label htmlFor="tipo_documento" className="block text-sm font-medium mb-2">
                Tipo de Documento <span className="text-destructive">*</span>
              </label>
              <select
                id="tipo_documento"
                name="tipo_documento"
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                <option value="">Seleccionar</option>
                <option value="DNI">DNI</option>
                <option value="CE">Carnet de Extranjería</option>
                <option value="PASAPORTE">Pasaporte</option>
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
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            <div>
              <label htmlFor="telefono" className="block text-sm font-medium mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="direccion" className="block text-sm font-medium mb-2">
                Dirección
              </label>
              <textarea
                id="direccion"
                name="direccion"
                rows={3}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Información Profesional</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="especialidad" className="block text-sm font-medium mb-2">
                Especialidad <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                id="especialidad"
                name="especialidad"
                required
                disabled={isSubmitting}
                placeholder="Ej: Matemáticas, Lengua, etc."
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="fecha_contratacion" className="block text-sm font-medium mb-2">
                Fecha de Contratación <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                id="fecha_contratacion"
                name="fecha_contratacion"
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-end">
          <Link
            href="/dashboard/profesores"
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
                Guardar Profesor
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
