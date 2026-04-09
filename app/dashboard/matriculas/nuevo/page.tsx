"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { MatriculaStepper } from "@/components/matriculas/MatriculaStepper"

export default function NuevaMatriculaPage() {
  return (
    <div className="container mx-auto py-6 max-w-3xl">

      {/* Cabecera */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/matriculas"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nueva Matrícula</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Completa los 4 pasos para registrar la matrícula
          </p>
        </div>
      </div>

      <MatriculaStepper />
    </div>
  )
}
