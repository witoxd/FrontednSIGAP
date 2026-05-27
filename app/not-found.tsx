import Link from "next/link"
import Image from "next/image"

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#060e1f" }}
    >
      <div className="relative z-10 w-full max-w-sm px-6 text-center">

        {/* Imagen — fade en los bordes para que pegue con el fondo oscuro */}
        <div
          style={{
            position: "relative",
            borderRadius: 16,
            overflow: "hidden",
            marginBottom: 24,
          }}
        >
          <Image
            src="/not-found-cat.png"
            alt="404 — Página no encontrada"
            width={480}
            height={600}
            style={{ width: "100%", height: "auto", display: "block" }}
            priority
          />
          {/* Gradiente inferior */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, transparent 55%, #060e1f 100%)",
              pointerEvents: "none",
            }}
          />
          {/* Gradiente laterales */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to right, #060e1f 0%, transparent 18%, transparent 82%, #060e1f 100%)",
              pointerEvents: "none",
            }}
          />
          {/* Gradiente superior */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, transparent 60%, #060e1f 100%)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Separador */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.22))" }} />
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
            <path d="M5 0L6.2 3.8L10 5L6.2 6.2L5 10L3.8 6.2L0 5L3.8 3.8Z" fill="rgba(201,168,76,0.4)" />
          </svg>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(201,168,76,0.22), transparent)" }} />
        </div>

        <Link
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: 44,
            padding: "0 36px",
            background: "linear-gradient(135deg, #b8902a 0%, #e8c76d 45%, #c9a84c 75%, #a87d28 100%)",
            borderRadius: 8,
            color: "#060e1f",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            textDecoration: "none",
            boxShadow: "0 4px 20px rgba(201,168,76,0.2)",
          }}
        >
          Volver al inicio
        </Link>

        <p style={{ marginTop: 22, color: "#1a2e45", fontSize: 11, letterSpacing: "0.06em" }}>
          © {new Date().getFullYear()} I.E. Almirante Padilla
        </p>
      </div>
    </div>
  )
}
