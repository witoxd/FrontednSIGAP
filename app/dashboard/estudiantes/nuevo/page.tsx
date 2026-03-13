"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { EstudianteStepper } from "@/components/estudiantes/estudiante-stepper"

export default function NuevoEstudiantePage() {
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/estudiantes"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver
        </Link>
        <h1 className="text-3xl font-bold">Nuevo Estudiante</h1>
      </div>

      <EstudianteStepper modo="crear" />
    </div>
  )
}