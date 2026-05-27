"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, RefreshCw, ServerOff, Wifi } from "lucide-react"

const HEALTH_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
).replace(/\/api\/?$/, "") + "/health"

type BackendStatus = "checking" | "up" | "down"

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: Props) {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking")
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    checkBackend()
  }, [])

  async function checkBackend() {
    setBackendStatus("checking")
    try {
      const res = await fetch(HEALTH_URL, {
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      })
      setBackendStatus(res.ok ? "up" : "down")
    } catch {
      setBackendStatus("down")
    }
  }

  async function handleRetry() {
    setIsRetrying(true)
    await checkBackend()
    reset()
    setIsRetrying(false)
  }

  const isBackendDown = backendStatus === "down"

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#060e1f" }}
    >
      {/* Fondo con líneas sutiles igual que el login */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.04 }}>
        {[15, 35, 55, 75, 90].map((pct) => (
          <div
            key={pct}
            className="absolute w-full"
            style={{
              top: `${pct}%`,
              height: 1,
              background:
                "linear-gradient(90deg, transparent 0%, #4a8fe8 30%, #4a8fe8 70%, transparent 100%)",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div
          style={{
            background: "rgba(6, 14, 31, 0.88)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16,
            backdropFilter: "blur(20px)",
            boxShadow:
              "0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
            padding: "48px 40px 40px",
            textAlign: "center",
          }}
        >
          {/* Ícono según el tipo de error */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: "50%",
              marginBottom: 24,
              background: isBackendDown
                ? "rgba(239,68,68,0.1)"
                : "rgba(251,191,36,0.1)",
              border: isBackendDown
                ? "1px solid rgba(239,68,68,0.25)"
                : "1px solid rgba(251,191,36,0.25)",
            }}
          >
            {backendStatus === "checking" ? (
              <Wifi
                size={28}
                style={{ color: "#4a8fe8", opacity: 0.8 }}
                className="animate-pulse"
              />
            ) : isBackendDown ? (
              <ServerOff size={28} style={{ color: "#ef4444" }} />
            ) : (
              <AlertTriangle size={28} style={{ color: "#fbbf24" }} />
            )}
          </div>

          {/* Título */}
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "0.04em",
              marginBottom: 10,
              color: isBackendDown ? "#fca5a5" : "#fde68a",
            }}
          >
            {backendStatus === "checking"
              ? "Verificando conexión…"
              : isBackendDown
              ? "Servidor no disponible"
              : "Ocurrió un error inesperado"}
          </h1>

          {/* Descripción */}
          <p
            style={{
              color: "#3d5a80",
              fontSize: 13,
              lineHeight: 1.7,
              marginBottom: 32,
            }}
          >
            {backendStatus === "checking" ? (
              "Comprobando el estado del servidor…"
            ) : isBackendDown ? (
              <>
                El servidor de SIGAP no responde en este momento.
                <br />
                Contacta al administrador del sistema o intenta más tarde.
              </>
            ) : (
              <>
                Algo salió mal al cargar esta sección.
                <br />
                Puedes intentar recargar o regresar al inicio.
              </>
            )}
          </p>

          {/* Separador decorativo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                flex: 1,
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, rgba(201,168,76,0.2))",
              }}
            />
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
              <path
                d="M5 0L6.2 3.8L10 5L6.2 6.2L5 10L3.8 6.2L0 5L3.8 3.8Z"
                fill="rgba(201,168,76,0.4)"
              />
            </svg>
            <div
              style={{
                flex: 1,
                height: 1,
                background:
                  "linear-gradient(90deg, rgba(201,168,76,0.2), transparent)",
              }}
            />
          </div>

          {/* Botones */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={handleRetry}
              disabled={isRetrying || backendStatus === "checking"}
              style={{
                height: 44,
                background:
                  isRetrying || backendStatus === "checking"
                    ? "rgba(201,168,76,0.25)"
                    : "linear-gradient(135deg, #b8902a 0%, #e8c76d 45%, #c9a84c 75%, #a87d28 100%)",
                border: "none",
                borderRadius: 8,
                color: "#060e1f",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                cursor:
                  isRetrying || backendStatus === "checking"
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "opacity 0.2s, box-shadow 0.2s",
                boxShadow: "0 4px 20px rgba(201,168,76,0.18)",
              }}
            >
              <RefreshCw
                size={14}
                className={isRetrying ? "animate-spin" : ""}
              />
              {isRetrying ? "Verificando…" : "Reintentar"}
            </button>

            <a
              href="/dashboard"
              style={{
                height: 44,
                background: "transparent",
                border: "1px solid rgba(50,80,130,0.35)",
                borderRadius: 8,
                color: "#3d5a80",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                transition: "border-color 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(201,168,76,0.35)"
                e.currentTarget.style.color = "#c9a84c"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(50,80,130,0.35)"
                e.currentTarget.style.color = "#3d5a80"
              }}
            >
              Ir al inicio
            </a>
          </div>

          {/* Código de error técnico (solo en dev) */}
          {process.env.NODE_ENV === "development" && error?.message && (
            <p
              style={{
                marginTop: 24,
                padding: "10px 14px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 6,
                color: "#1e3a5f",
                fontSize: 11,
                fontFamily: "monospace",
                textAlign: "left",
                wordBreak: "break-all",
              }}
            >
              {error.message}
            </p>
          )}

          <p
            style={{
              marginTop: 20,
              color: "#1a2e45",
              fontSize: 11,
              letterSpacing: "0.06em",
            }}
          >
            © {new Date().getFullYear()} I.E. Almirante Padilla
          </p>
        </div>
      </div>
    </div>
  )
}
