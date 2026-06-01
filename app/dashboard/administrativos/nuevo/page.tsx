"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AdministrativoStepper } from "@/components/administrativos/administrativo-stepper"

export default function NuevoAdministrativoPage() {
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/administrativos"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver
        </Link>
        <h1 className="text-2xl font-bold">Nuevo Administrativo</h1>
      </div>

      <AdministrativoStepper modo="crear" />
    </div>
  )
}
