"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ProfesorStepper } from "@/components/profesores/profesor-stepper"

export default function EditarProfesorPage() {
  const params     = useParams()
  const profesorId = parseInt(params.id as string)

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/dashboard/profesores/${profesorId}/detalles`}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver al perfil
        </Link>
        <h1 className="text-2xl font-bold">Editar Profesor</h1>
      </div>

      <ProfesorStepper modo="editar" profesorId={profesorId} />
    </div>
  )
}
