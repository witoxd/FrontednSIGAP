"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, X, User, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// Configuración de foto de perfil
const FOTO_PERFIL_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
  acceptedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
}

interface ProfilePhotoUploaderProps {
  personaId?: number
  tipoArchivoId: number // ID del tipo de archivo para foto de perfil (dinámico desde API)
  currentPhotoUrl?: string
  onPhotoChange?: (file: File | null) => void
  className?: string
  disabled?: boolean
  showUploadButton?: boolean
}

export function ProfilePhotoUploader({
  personaId,
  tipoArchivoId,
  currentPhotoUrl,
  onPhotoChange,
  className,
  disabled = false,
  showUploadButton = false,
}: ProfilePhotoUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (!FOTO_PERFIL_CONFIG.acceptedTypes.includes(file.type)) {
      return `Tipo de archivo no permitido. Solo se aceptan: ${FOTO_PERFIL_CONFIG.acceptedExtensions.join(", ")}`
    }

    if (file.size > FOTO_PERFIL_CONFIG.maxSize) {
      return `El archivo es muy grande. Tamaño máximo: ${FOTO_PERFIL_CONFIG.maxSize / 1024 / 1024}MB`
    }

    return null
  }

  const handleFileSelect = useCallback(
    (file: File) => {
      setError(null)
      setUploadSuccess(false)

      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      setSelectedFile(file)

      // Crear preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Notificar al componente padre
      onPhotoChange?.(file)
    },
    [onPhotoChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)

      if (disabled) return

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0 && files[0]) {
        handleFileSelect(files[0])
      }
    },
    [disabled, handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0 && files[0]) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect]
  )

  const handleRemovePhoto = useCallback(() => {
    setPreview(null)
    setSelectedFile(null)
    setError(null)
    setUploadSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onPhotoChange?.(null)
  }, [onPhotoChange])

  const handleUploadToServer = async () => {
    if (!selectedFile || !personaId) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("archivos", selectedFile)
      formData.append("persona_id", personaId.toString())
      formData.append("tipo_archivo_id", tipoArchivoId.toString())
      formData.append("descripcion", "Foto de perfil")

      const response = await fetch("/api/archivos/bulkCreate", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al subir la foto")
      }

      setUploadSuccess(true)
      setTimeout(() => setUploadSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir la foto")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
          isDragging && "border-primary bg-primary/5",
          !isDragging && "border-border",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer hover:border-primary/50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={FOTO_PERFIL_CONFIG.acceptedExtensions.join(",")}
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
          aria-label="Subir foto de perfil"
        />

        {preview ? (
          <div className="relative w-full aspect-square max-w-xs">
            <img
              src={preview}
              alt="Vista previa de foto de perfil"
              className="w-full h-full object-cover rounded-lg"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                aria-label="Eliminar foto"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {uploadSuccess && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                  <span className="font-medium">Subida exitosa</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex flex-col items-center justify-center p-8 w-full"
          >
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <User className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Upload className="h-5 w-5" />
              <span className="font-medium">Subir foto de perfil</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Arrastra una imagen o haz clic para seleccionar
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              JPG, PNG o WebP (máx. 5MB)
            </p>
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {showUploadButton && selectedFile && personaId && !uploadSuccess && (
        <button
          type="button"
          onClick={handleUploadToServer}
          disabled={isUploading || disabled}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Subir foto al servidor
            </>
          )}
        </button>
      )}

      {selectedFile && !showUploadButton && (
        <p className="text-xs text-muted-foreground text-center">
          La foto se subirá cuando guardes el formulario
        </p>
      )}
    </div>
  )
}
