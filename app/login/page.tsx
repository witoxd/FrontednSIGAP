"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AuthProvider, useAuth } from "@/lib/auth/auth-context"
import { Eye, EyeOff, Loader2 } from "lucide-react"

function CompassRose({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="95" stroke="currentColor" strokeWidth="0.4" strokeDasharray="2 5" />
      <circle cx="100" cy="100" r="72" stroke="currentColor" strokeWidth="0.4" />
      <circle cx="100" cy="100" r="48" stroke="currentColor" strokeWidth="0.4" />
      <circle cx="100" cy="100" r="24" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1 3" />
      {/* North — gold, prominent */}
      <polygon points="100,6 96.5,97 103.5,97" fill="currentColor" opacity="0.9" />
      {/* South */}
      <polygon points="100,194 96.5,103 103.5,103" fill="currentColor" opacity="0.45" />
      {/* East */}
      <polygon points="194,100 103,96.5 103,103.5" fill="currentColor" opacity="0.45" />
      {/* West */}
      <polygon points="6,100 97,96.5 97,103.5" fill="currentColor" opacity="0.45" />
      {/* NE / SW diagonal */}
      <polygon points="152,48 103.5,96.5 96.5,103.5 48,152 96.5,103.5 103.5,96.5" fill="currentColor" opacity="0.22" />
      {/* NW / SE diagonal */}
      <polygon points="48,48 96.5,96.5 103.5,103.5 152,152 103.5,103.5 96.5,96.5" fill="currentColor" opacity="0.22" />
      {/* Center jewel */}
      <circle cx="100" cy="100" r="9" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.6" />
      <circle cx="100" cy="100" r="4" fill="currentColor" opacity="0.9" />
      {/* Tick marks */}
      {Array.from({ length: 32 }).map((_, i) => {
        const angle = (i * 360) / 32
        const rad = (angle * Math.PI) / 180
        const r1 = 75, r2 = i % 4 === 0 ? 80 : 77
        const x1 = 100 + r1 * Math.sin(rad)
        const y1 = 100 - r1 * Math.cos(rad)
        const x2 = 100 + r2 * Math.sin(rad)
        const y2 = 100 - r2 * Math.cos(rad)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
      })}
    </svg>
  )
}

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
      toast.error("Ingresa tu correo y contraseña")
      return
    }
    setIsSubmitting(true)
    try {
      await login(email, password)
      toast.success("Sesión iniciada correctamente")
      router.push("/dashboard")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#060e1f" }}
    >
      {/* Photo background */}
      <img
        src="/Foto_Frontal_Liceo_Almirante_Padilla.webp"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ filter: "grayscale(30%) brightness(0.35) saturate(0.6)" }}
      />

      {/* Navy overlay — adds the deep naval tint over the photo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(160deg, rgba(4,10,28,0.72) 0%, rgba(6,14,31,0.60) 50%, rgba(2,8,20,0.78) 100%)",
        }}
      />

      {/* Nautical chart grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40 H80 M40 0 V80' stroke='%23243d6e' stroke-width='0.5'/%3E%3C/svg%3E")`,
          opacity: 0.3,
        }}
      />

      {/* Parallel lines (latitude feel) */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.04 }}>
        {[12, 28, 50, 72, 88].map((pct) => (
          <div
            key={pct}
            className="absolute w-full"
            style={{
              top: `${pct}%`,
              height: 1,
              background: "linear-gradient(90deg, transparent 0%, #4a8fe8 30%, #4a8fe8 70%, transparent 100%)",
            }}
          />
        ))}
      </div>

      {/* Large compass rose — right side, background */}
      <div
        className="absolute pointer-events-none animate-compass"
        style={{
          right: "-6%", top: "50%",
          transform: "translateY(-50%)",
          width: 580, height: 580,
          opacity: 0.045,
          color: "#c9a84c",
        }}
      >
        <CompassRose className="w-full h-full" />
      </div>

      {/* Small compass rose — top left, counter-rotating */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: "-4%", top: "-4%",
          width: 280, height: 280,
          opacity: 0.03,
          color: "#4a8fe8",
          animation: "compass-rotate 80s linear infinite reverse",
        }}
      >
        <CompassRose className="w-full h-full" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[420px] px-4 py-8">
        {/* Card body */}
        <div
          style={{
            background: "rgba(6, 14, 31, 0.82)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16,
            backdropFilter: "blur(20px)",
            boxShadow:
              "0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
            padding: "40px 40px 36px",
          }}
        >
          {/* Header */}
          <div className="flex flex-col items-center" style={{ marginBottom: 32 }}>
            <img
              src="/escudo_liceo.ico"
              alt="Escudo IEAP"
              style={{
                width: 68,
                height: 68,
                objectFit: "contain",
                marginBottom: 18,
                filter: "drop-shadow(0 0 14px rgba(201,168,76,0.35)) drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
              }}
            />
            <h1
              style={{
                fontFamily: "var(--font-cormorant), Georgia, serif",
                fontSize: 46,
                fontWeight: 600,
                letterSpacing: "0.28em",
                lineHeight: 1,
                background: "linear-gradient(180deg, #edd97a 0%, #c9a84c 55%, #9a7020 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: 10,
              }}
            >
              SIGAP
            </h1>
            <p
              style={{
                color: "#3d5a80",
                fontSize: 10,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                textAlign: "center",
                lineHeight: 1.8,
              }}
            >
              Sistema de Información y Gestión
              <br />
              <span style={{ color: "#5577a0", letterSpacing: "0.22em" }}>Almirante Padilla</span>
            </p>

            {/* Decorative separator */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 22,
                width: "100%",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.28))",
                }}
              />
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 0L6.2 3.8L10 5L6.2 6.2L5 10L3.8 6.2L0 5L3.8 3.8Z" fill="rgba(201,168,76,0.5)" />
              </svg>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "linear-gradient(90deg, rgba(201,168,76,0.28), transparent)",
                }}
              />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <label
                htmlFor="email"
                style={{
                  color: "#3d5a80",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="usuario@ieap.edu.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(201,168,76,0.5)"
                  e.target.style.boxShadow = "0 0 0 3px rgba(201,168,76,0.07)"
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(50,80,130,0.35)"
                  e.target.style.boxShadow = "none"
                }}
                style={{
                  height: 44,
                  backgroundColor: "#030a18",
                  border: "1px solid rgba(50,80,130,0.35)",
                  borderRadius: 8,
                  padding: "0 16px",
                  fontSize: 14,
                  color: "#b8cce0",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              />
            </div>

            {/* Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <label
                htmlFor="password"
                style={{
                  color: "#3d5a80",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                Contraseña
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(201,168,76,0.5)"
                    e.target.style.boxShadow = "0 0 0 3px rgba(201,168,76,0.07)"
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(50,80,130,0.35)"
                    e.target.style.boxShadow = "none"
                  }}
                  style={{
                    height: 44,
                    width: "100%",
                    backgroundColor: "#030a18",
                    border: "1px solid rgba(50,80,130,0.35)",
                    borderRadius: 8,
                    padding: "0 44px 0 16px",
                    fontSize: 14,
                    color: "#b8cce0",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 13,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#3d5a80",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                  }}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: 6,
                height: 46,
                background: isSubmitting
                  ? "rgba(201,168,76,0.35)"
                  : "linear-gradient(135deg, #b8902a 0%, #e8c76d 45%, #c9a84c 75%, #a87d28 100%)",
                border: "none",
                borderRadius: 8,
                color: "#060e1f",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "opacity 0.2s, transform 0.1s, box-shadow 0.2s",
                boxShadow: "0 4px 24px rgba(201,168,76,0.22), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 6px 32px rgba(201,168,76,0.35), inset 0 1px 0 rgba(255,255,255,0.15)"
                  ;(e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"
                }
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 4px 24px rgba(201,168,76,0.22), inset 0 1px 0 rgba(255,255,255,0.15)"
                ;(e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"
              }}
            >
              {isSubmitting ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                "Ingresar al Sistema"
              )}
            </button>
          </form>

          {/* Footer */}
          <p
            style={{
              marginTop: 30,
              textAlign: "center",
              color: "#1e2e45",
              fontSize: 11,
              letterSpacing: "0.06em",
            }}
          >
            © {new Date().getFullYear()} I.E. Almirante Padilla &mdash; Colombia
          </p>
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
