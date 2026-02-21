"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { ProfilePhotoUploader } from "@/components/shared/profile-photo-uploader"
import { estudiantesService } from "@/lib/api/services/estudiantes"
import { TIPO_ARCHIVO_IDS } from "@/lib/constants/archivo-tipos"
import type { CreateEstudianteInput } from "@/lib/types"

export default function NuevoEstudiantePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [personaId, setPersonaId] = useState<number | null>(null)

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
          tipo_documento: formData.get("tipo_documento") as string,
          numero_documento: formData.get("numero_documento") as string,
          fecha_nacimiento: formData.get("fecha_nacimiento") as string,
          genero: formData.get("genero") as string,
          direccion: formData.get("direccion") as string || undefined,
          telefono: formData.get("telefono") as string || undefined,
          email: formData.get("email") as string || undefined,
        },
        grado_id: parseInt(formData.get("grado_id") as string),
        seccion_id: parseInt(formData.get("seccion_id") as string),
        fecha_ingreso: formData.get("fecha_ingreso") as string,
      }

      // Crear estudiante
      const response = await estudiantesService.create(input)
      const nuevoEstudianteId = response.data.estudiante_id
      const nuevaPersonaId = response.data.persona_id

      // Si hay foto, subirla
      if (photoFile && nuevaPersonaId) {
        const photoFormData = new FormData()
        photoFormData.append("archivos", photoFile)
        photoFormData.append("persona_id", nuevaPersonaId.toString())
        photoFormData.append("tipo_archivo_id", TIPO_ARCHIVO_IDS.FOTO_PERFIL.toString())
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

        {/* Información Académica */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Información Académica</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="grado_id" className="block text-sm font-medium mb-2">
                Grado <span className="text-destructive">*</span>
              </label>
              <select
                id="grado_id"
                name="grado_id"
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                <option value="">Seleccionar grado</option>
                {/* Aquí deberías cargar los grados desde la API */}
                <option value="1">1° Primaria</option>
                <option value="2">2° Primaria</option>
                <option value="3">3° Primaria</option>
              </select>
            </div>

            <div>
              <label htmlFor="seccion_id" className="block text-sm font-medium mb-2">
                Sección <span className="text-destructive">*</span>
              </label>
              <select
                id="seccion_id"
                name="seccion_id"
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                <option value="">Seleccionar sección</option>
                {/* Aquí deberías cargar las secciones desde la API */}
                <option value="1">A</option>
                <option value="2">B</option>
                <option value="3">C</option>
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
