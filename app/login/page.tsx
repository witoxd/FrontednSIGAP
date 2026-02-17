"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AuthProvider, useAuth } from "@/lib/auth/auth-context"
import { GraduationCap, Eye, EyeOff, Loader2 } from "lucide-react"

function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Ingresa tu correo y contrasena")
      return
    }
    setIsSubmitting(true)
    try {
      await login(email, password)
      toast.success("Sesion iniciada correctamente")
      router.push("/dashboard")
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al iniciar sesion"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-sidebar text-sidebar-foreground p-12">
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-primary">
            <GraduationCap className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-sidebar-accent-foreground">
            SIGAP
          </h1>
          <p className="text-lg leading-relaxed text-sidebar-foreground">
            Sistema de Gestion Academica y de Personal. Administra
            estudiantes, profesores, cursos y matriculas de manera eficiente.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-sidebar-accent-foreground">
                100%
              </p>
              <p className="text-sm text-sidebar-foreground">Digital</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-sidebar-accent-foreground">
                Seguro
              </p>
              <p className="text-sm text-sidebar-foreground">Encriptado</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-sidebar-accent-foreground">
                Rapido
              </p>
              <p className="text-sm text-sidebar-foreground">Eficiente</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-2 lg:hidden">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">SIGAP</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground">Iniciar sesion</h2>
          <p className="mt-1 text-muted-foreground">
            Ingresa tus credenciales para acceder al panel
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Correo electronico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="usuario@institucion.edu.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-lg border border-input bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Contrasena
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Ingresa tu contrasena"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-lg border border-input bg-card px-4 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={
                    showPassword ? "Ocultar contrasena" : "Mostrar contrasena"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex h-11 items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Iniciar sesion"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  )
}
