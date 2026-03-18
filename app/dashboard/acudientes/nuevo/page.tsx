"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AcudienteForm } from "@/components/acudientes/acudiente-form"

export default function NuevoAcudientePage() {
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/acudientes"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver
        </Link>
        <h1 className="text-2xl font-bold">Nuevo Acudiente</h1>
      </div>

      <AcudienteForm modo="crear" />
    </div>
  )
}
