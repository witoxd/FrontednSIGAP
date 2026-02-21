"use client"

import { useState, useRef } from "react"
import useSWR from "swr"
import { Loader2, Upload, X, FileText, Image as ImageIcon, File, CheckCircle2, AlertCircle } from "lucide-react"
import { swrFetcher } from "@/lib/api/fetcher"
import type { PaginatedApiResponse } from "@/lib/types"

// ============================================================================
// Tipos
// ============================================================================

interface TipoArchivo {
  tipo_archivo_id: number
  nombre: string
  descripcion?: string
  extensiones_permitidas?: string[]
  activo?: boolean
}

interface ArchivoItem {
  id: string
  file: File
  tipo_archivo_id: number | null
  descripcion: string
  preview: string | null
  status: "pending" | "uploading" | "success" | "error"
  error?: string
}

interface ArchivoUploaderProps {
  persona_id: number
  onSuccess?: (archivos: unknown[]) => void
  onError?: (error: string) => void
  maxFiles?: number
  maxFileSize?: number // en MB
  tiposRequeridos?: number[] // IDs de tipos de archivo requeridos
  className?: string
}

// ============================================================================
// Componente Principal
// ============================================================================

export function ArchivoUploader({
  persona_id,
  onSuccess,
  onError,
  maxFiles = 20,
  maxFileSize = 10, // 10MB por defecto
  tiposRequeridos = [],
  className = "",
}: ArchivoUploaderProps) {
  const [archivos, setArchivos] = useState<ArchivoItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar tipos de archivo disponibles
  const { data: tiposArchivos, isLoading: loadingTipos } = useSWR<
    PaginatedApiResponse<TipoArchivo>
  >("/tipos-archivos/getAll?limit=100&offset=0", swrFetcher)

  // ============================================================================
  // Funciones de validación
  // ============================================================================

  const validarArchivo = (file: File): string | null => {
    // Validar tamaño
    const maxBytes = maxFileSize * 1024 * 1024
    if (file.size > maxBytes) {
      return `El archivo ${file.name} excede el tamaño máximo de ${maxFileSize}MB`
    }

    // Validar tipo MIME básico
    const tiposPermitidos = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (!tiposPermitidos.includes(file.type)) {
      return `El tipo de archivo ${file.type} no está permitido`
    }

    return null
  }

  const validarFormulario = (): string[] => {
    const errores: string[] = []

    if (archivos.length === 0) {
      errores.push("Debe seleccionar al menos un archivo")
      return errores
    }

    if (archivos.length > maxFiles) {
      errores.push(`Máximo ${maxFiles} archivos permitidos`)
    }

    // Validar que todos tengan tipo asignado
    const sinTipo = archivos.filter((a) => !a.tipo_archivo_id)
    if (sinTipo.length > 0) {
      errores.push(`${sinTipo.length} archivo(s) sin tipo asignado`)
    }

    // Validar tipos requeridos si se especificaron
    if (tiposRequeridos.length > 0) {
      const tiposPresentes = archivos
        .map((a) => a.tipo_archivo_id)
        .filter((id): id is number => id !== null)
      const tiposFaltantes = tiposRequeridos.filter(
        (req) => !tiposPresentes.includes(req)
      )

      if (tiposFaltantes.length > 0) {
        const nombresFaltantes = tiposFaltantes
          .map((id) => {
            const tipo = tiposArchivos?.data?.find(
              (t) => t.tipo_archivo_id === id
            )
            return tipo?.nombre || `ID ${id}`
          })
          .join(", ")
        errores.push(`Faltan archivos requeridos: ${nombresFaltantes}`)
      }
    }

    return errores
  }

  // ============================================================================
  // Funciones de manejo de archivos
  // ============================================================================

  const agregarArchivos = (files: File[]) => {
    const nuevosErrores: string[] = []

    const nuevosArchivos = files
      .map((file) => {
        const error = validarArchivo(file)
        if (error) {
          nuevosErrores.push(error)
          return null
        }

        return {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          tipo_archivo_id: null,
          descripcion: "",
          preview: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : null,
          status: "pending" as const,
        }
      })
      .filter((a): a is ArchivoItem => a !== null)

    if (nuevosErrores.length > 0) {
      setErrors(nuevosErrores)
    } else {
      setErrors([])
    }

    setArchivos((prev) => {
      const combined = [...prev, ...nuevosArchivos]
      if (combined.length > maxFiles) {
        setErrors([`Máximo ${maxFiles} archivos permitidos`])
        return combined.slice(0, maxFiles)
      }
      return combined
    })
  }

  const removerArchivo = (id: string) => {
    setArchivos((prev) => {
      const archivo = prev.find((a) => a.id === id)
      if (archivo?.preview) {
        URL.revokeObjectURL(archivo.preview)
      }
      return prev.filter((a) => a.id !== id)
    })
    setErrors([])
  }

  const actualizarArchivo = (
    id: string,
    campo: keyof ArchivoItem,
    valor: unknown
  ) => {
    setArchivos((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [campo]: valor } : a))
    )
    setErrors([])
  }

  // ============================================================================
  // Drag & Drop
  // ============================================================================

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    agregarArchivos(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      agregarArchivos(files)
    }
  }

  // ============================================================================
  // Subir archivos
  // ============================================================================

  const handleSubmit = async () => {
    // Validar formulario
    const erroresValidacion = validarFormulario()
    if (erroresValidacion.length > 0) {
      setErrors(erroresValidacion)
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)
    setErrors([])

    try {
      const formData = new FormData()
      formData.append("persona_id", String(persona_id))

      // Construir metadata en el orden de los archivos
      const metadata: Array<{
        tipo_archivo_id: number
        descripcion: string
      }> = []

      archivos.forEach((archivo) => {
        formData.append("archivos", archivo.file)
        metadata.push({
          tipo_archivo_id: archivo.tipo_archivo_id!,
          descripcion: archivo.descripcion || archivo.file.name,
        })
      })

      formData.append("metadata", JSON.stringify(metadata))

      // Obtener token
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("sigap_token")
          : null

      if (!token) {
        throw new Error("No se encontró el token de autenticación")
      }

      // Enviar con XMLHttpRequest para trackear progreso
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const porcentaje = Math.round((e.loaded * 100) / e.total)
          setUploadProgress(porcentaje)
        }
      })

      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

      await new Promise((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText)
            console.log("[v0] Archivos subidos exitosamente:", response)
            resolve(response)
          } else {
            const error = JSON.parse(xhr.responseText)
            reject(new Error(error.message || "Error al subir archivos"))
          }
        })

        xhr.addEventListener("error", () => {
          reject(new Error("Error de red al subir archivos"))
        })

        xhr.open("POST", `${API_BASE_URL}/archivos/bulkCreate`)
        xhr.setRequestHeader("Authorization", `Bearer ${token}`)
        xhr.send(formData)
      })

      // Éxito
      if (onSuccess) {
        onSuccess(archivos)
      }

      // Limpiar formulario
      setArchivos([])
      setUploadProgress(0)
    } catch (error) {
      console.error("[v0] Error al subir archivos:", error)
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido"
      setErrors([errorMessage])
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  // ============================================================================
  // Helpers de renderizado
  // ============================================================================

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return ImageIcon
    if (file.type.includes("pdf")) return FileText
    return File
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // ============================================================================
  // Renderizado
  // ============================================================================

  const inputClass =
    "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

  if (loadingTipos) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Zona de Drop */}
      <div
        className={`
          relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-all cursor-pointer
          ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          }
          ${isSubmitting ? "pointer-events-none opacity-50" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx"
          disabled={isSubmitting}
        />

        <Upload className="w-10 h-10 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            Arrastra archivos aquí o haz clic para seleccionar
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Máximo {maxFiles} archivos de {maxFileSize}MB cada uno (PDF, JPG,
            PNG, DOC)
          </p>
        </div>
      </div>

      {/* Mensajes de error */}
      {errors.length > 0 && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">
                Errores de validación
              </p>
              <ul className="mt-1 text-sm text-destructive/90 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Lista de archivos */}
      {archivos.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">
              Archivos seleccionados ({archivos.length}/{maxFiles})
            </h4>
            {archivos.length > 0 && !isSubmitting && (
              <button
                onClick={() => {
                  archivos.forEach((a) => {
                    if (a.preview) URL.revokeObjectURL(a.preview)
                  })
                  setArchivos([])
                  setErrors([])
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Limpiar todo
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
            {archivos.map((archivo) => {
              const Icon = getFileIcon(archivo.file)
              return (
                <div
                  key={archivo.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-background p-3"
                >
                  {/* Preview o icono */}
                  <div className="flex-shrink-0">
                    {archivo.preview ? (
                      <img
                        src={archivo.preview}
                        alt={archivo.file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <Icon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Información y controles */}
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground truncate">
                        {archivo.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(archivo.file.size)}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={archivo.tipo_archivo_id ?? ""}
                        onChange={(e) =>
                          actualizarArchivo(
                            archivo.id,
                            "tipo_archivo_id",
                            Number(e.target.value)
                          )
                        }
                        className={inputClass}
                        disabled={isSubmitting}
                        required
                      >
                        <option value="">Seleccionar tipo *</option>
                        {tiposArchivos?.data
                          ?.filter((t) => t.activo !== false)
                          .map((tipo) => (
                            <option
                              key={tipo.tipo_archivo_id}
                              value={tipo.tipo_archivo_id}
                            >
                              {tipo.nombre}
                            </option>
                          ))}
                      </select>

                      <input
                        type="text"
                        placeholder="Descripción (opcional)"
                        value={archivo.descripcion}
                        onChange={(e) =>
                          actualizarArchivo(
                            archivo.id,
                            "descripcion",
                            e.target.value
                          )
                        }
                        className={inputClass}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Botón eliminar */}
                  {!isSubmitting && (
                    <button
                      onClick={() => removerArchivo(archivo.id)}
                      className="flex-shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Eliminar archivo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Barra de progreso */}
          {isSubmitting && uploadProgress > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subiendo archivos...</span>
                <span className="font-medium text-foreground">{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Botón de envío */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || archivos.length === 0}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Subir {archivos.length} archivo{archivos.length !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
