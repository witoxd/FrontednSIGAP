"use client"

import useSWR from "swr"
import { swrFetcher } from "@/lib/api/fetcher"
import { StatCard } from "@/components/dashboard/stat-card"
import { Users, GraduationCap, BookOpen, ClipboardList, Loader2 } from "lucide-react"
import type { PaginatedApiResponse, EstudianteConPersona, ProfesorConPersona, Curso, MatriculaConRelaciones } from "@/lib/types"

export default function DashboardPage() {
  const { data: estudiantesData, isLoading: loadingEst } = useSWR<PaginatedApiResponse<EstudianteConPersona>>(
    "/estudiantes/getAll?limit=1&offset=0",
    swrFetcher
  )
  const { data: profesoresData, isLoading: loadingProf } = useSWR<PaginatedApiResponse<ProfesorConPersona>>(
    "/profesores/getAll?limit=1&offset=0",
    swrFetcher
  )
  const { data: cursosData, isLoading: loadingCursos } = useSWR<PaginatedApiResponse<Curso>>(
    "/cursos/getAll?limit=1&offset=0",
    swrFetcher
  )
  const { data: matriculasData, isLoading: loadingMat } = useSWR<PaginatedApiResponse<MatriculaConRelaciones>>(
    "/matriculas/getAll?limit=5&offset=0",
    swrFetcher
  )

  const isLoading = loadingEst || loadingProf || loadingCursos || loadingMat

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground text-balance">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Resumen general del sistema
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Estudiantes"
          value={isLoading ? "..." : estudiantesData?.pagination?.total ?? 0}
          icon={Users}
          description="Total registrados"
        />
        <StatCard
          title="Profesores"
          value={isLoading ? "..." : profesoresData?.pagination?.total ?? 0}
          icon={GraduationCap}
          description="Total activos"
        />
        <StatCard
          title="Cursos"
          value={isLoading ? "..." : cursosData?.pagination?.total ?? 0}
          icon={BookOpen}
          description="Cursos disponibles"
        />
        <StatCard
          title="Matriculas"
          value={isLoading ? "..." : matriculasData?.pagination?.total ?? 0}
          icon={ClipboardList}
          description="Total matriculas"
        />
      </div>

      {/* Recent table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">
            Ultimas matriculas
          </h3>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : matriculasData?.data && matriculasData.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-3 font-medium text-muted-foreground">
                    ID
                  </th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">
                    Estudiante
                  </th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">
                    Curso
                  </th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">
                    Estado
                  </th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody>
                {matriculasData.data.map((m) => (
                  <tr
                    key={m.matricula_id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-6 py-3 text-foreground">
                      {m.matricula_id}
                    </td>
                    <td className="px-6 py-3 text-foreground">
                      {m.estudiante_nombre || `Est. #${m.estudiante_id}`}
                    </td>
                    <td className="px-6 py-3 text-foreground">
                      {m.curso_nombre || `Curso #${m.curso_id}`}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          m.estado === "activa"
                            ? "bg-success/10 text-success"
                            : m.estado === "finalizada"
                            ? "bg-accent text-accent-foreground"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {m.estado}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {m.fecha_matricula
                        ? new Date(m.fecha_matricula).toLocaleDateString("es-CO")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ClipboardList className="w-10 h-10 mb-2" />
            <p className="text-sm">No hay matriculas registradas</p>
          </div>
        )}
      </div>
    </div>
  )
}
