"use client"

import { useState } from "react"
import { X, Loader2, Eye, EyeOff, KeyRound } from "lucide-react"
import { toast } from "sonner"
import { authApi } from "@/lib/api/services/auth"

interface ChangePasswordModalProps {
  open: boolean
  onClose: () => void
}

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const [actual,    setActual]    = useState("")
  const [nueva,     setNueva]     = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  // Visibilidad de cada campo
  const [verActual,    setVerActual]    = useState(false)
  const [verNueva,     setVerNueva]     = useState(false)
  const [verConfirmar, setVerConfirmar] = useState(false)

  function resetForm() {
    setActual(""); setNueva(""); setConfirmar("")
    setError(null)
    setVerActual(false); setVerNueva(false); setVerConfirmar(false)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validación client-side
    if (nueva.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.")
      return
    }
    if (nueva !== confirmar) {
      setError("La nueva contraseña y su confirmación no coinciden.")
      return
    }
    if (actual === nueva) {
      setError("La nueva contraseña debe ser diferente a la actual.")
      return
    }

    setGuardando(true)
    try {
      await authApi.changePassword(actual, nueva)
      toast.success("Contraseña actualizada correctamente")
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar la contraseña")
    } finally {
      setGuardando(false)
    }
  }

  if (!open) return null

  const inputBase =
    "h-10 w-full rounded-lg border border-input bg-background px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-lg">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Cambiar contraseña</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">

          {/* Contraseña actual */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Contraseña actual
            </label>
            <div className="relative">
              <input
                required
                type={verActual ? "text" : "password"}
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                placeholder="Tu contraseña actual"
                disabled={guardando}
                className={inputBase}
              />
              <button
                type="button"
                onClick={() => setVerActual(!verActual)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {verActual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Nueva contraseña */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                required
                type={verNueva ? "text" : "password"}
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                disabled={guardando}
                className={inputBase}
              />
              <button
                type="button"
                onClick={() => setVerNueva(!verNueva)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {verNueva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar nueva */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Confirmar nueva contraseña
            </label>
            <div className="relative">
              <input
                required
                type={verConfirmar ? "text" : "password"}
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Repite la nueva contraseña"
                disabled={guardando}
                className={inputBase}
              />
              <button
                type="button"
                onClick={() => setVerConfirmar(!verConfirmar)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {verConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Botones */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={guardando}
              className="h-9 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {guardando
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                : "Actualizar"
              }
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
