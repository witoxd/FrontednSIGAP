"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { UserCog, ShieldCheck } from "lucide-react"

export default function UsuariosPage() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Gestion de usuarios del sistema
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-8 flex flex-col items-center gap-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-accent">
          <UserCog className="w-8 h-8 text-accent-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          Modulo de usuarios
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          La gestion avanzada de usuarios (busqueda, asignacion de roles,
          activacion/desactivacion) esta disponible a traves de la API del
          backend. Proximamente se integrara completamente en esta interfaz.
        </p>

        {user && (
          <div className="mt-4 rounded-lg border border-border bg-muted/50 p-4 w-full max-w-sm">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Tu perfil actual
            </h4>
            <div className="mt-2 flex flex-col gap-1 text-sm">
              <p className="text-muted-foreground">
                <span className="text-foreground font-medium">Email:</span>{" "}
                {user.email}
              </p>
              <p className="text-muted-foreground">
                <span className="text-foreground font-medium">Roles:</span>{" "}
                {user.roles.join(", ")}
              </p>
              <p className="text-muted-foreground">
                <span className="text-foreground font-medium">ID:</span>{" "}
                {user.id}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
