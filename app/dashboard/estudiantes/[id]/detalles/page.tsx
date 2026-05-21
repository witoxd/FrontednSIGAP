"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect, useCallback, useRef } from "react"
import {
  ArrowLeft, Loader2, ShieldAlert, Ban, GraduationCap,
  RotateCcw, Trash2, X, ChevronRight, Settings2,
} from "lucide-react"
import { estudiantesApi }      from "@/lib/api/services/estudiantes"
import { expedienteApi }       from "@/lib/api/services/expediente"
import { PersonaView }         from "@/components/personas/PersonaView"
import { StatusBadge }         from "@/components/shared/status-badge"
import FichaEstudianteView     from "@/components/forms/ficha/ficheroEstudiante/FichaEstudianteView"
import ViviendaEstudianteView  from "@/components/forms/ficha/vidiendaEstudiante/ViviendaEstudianteView"
import ColegioAnteriorList     from "@/components/forms/ficha/colegiosAnteriores/ColegioAnteriorList"
import { SeccionAcudientes }   from "@/components/acudientes/SeccionAcudientes"
import { SeccionMatriculas }   from "@/components/matriculas/SeccionMatriculas"
import { useAuth }             from "@/lib/auth/auth-context"
import { toast }               from "sonner"
import type { EstudianteWithPersonaDocumento, ExpedienteResponse, Suspension } from "@/lib/types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFecha(iso?: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit", month: "long", year: "numeric",
  })
}

function DatoFila({ label, valor }: { label: string; valor?: React.ReactNode }) {
  if (!valor) return null
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{valor}</dd>
    </div>
  )
}

// ── Modal genérico ────────────────────────────────────────────────────────────

function ModalConfirmar({
  titulo, descripcion, onConfirmar, onCancelar, cargando, variante = "destructive",
}: {
  titulo: string
  descripcion: React.ReactNode
  onConfirmar: () => void
  onCancelar: () => void
  cargando: boolean
  variante?: "destructive" | "warning"
}) {
  const btn = variante === "warning"
    ? "bg-yellow-600 hover:bg-yellow-700 text-white"
    : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="bg-card border border-border rounded-xl shadow-lg p-6 w-full max-w-sm mx-4 flex flex-col gap-4">
        <h2 className="text-base font-semibold">{titulo}</h2>
        <div className="text-sm text-muted-foreground">{descripcion}</div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancelar} disabled={cargando}
            className="px-3 py-1.5 rounded-md text-sm border border-border hover:bg-muted">
            Cancelar
          </button>
          <button onClick={onConfirmar} disabled={cargando}
            className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 ${btn}`}>
            {cargando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Drawer de gestión de estado ───────────────────────────────────────────────

type ModalActivo = "suspender" | "expulsar" | "reactivar" | "egresar" | null

function DrawerEstado({
  estudianteId,
  estadoEfectivo,
  esAdmin,
  onCerrar,
  onActualizar,
}: {
  estudianteId: number
  estadoEfectivo: string
  esAdmin: boolean
  onCerrar: () => void
  onActualizar: () => void
}) {
  const [suspensiones, setSuspensiones] = useState<Suspension[]>([])
  const [cargandoSusp, setCargandoSusp] = useState(true)
  const [modal, setModal]               = useState<ModalActivo>(null)
  const [motivo, setMotivo]             = useState("")
  const [fechaInicio, setFechaInicio]   = useState("")
  const [fechaFin, setFechaFin]         = useState("")
  const [cargando, setCargando]         = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  const cargarSusp = useCallback(async () => {
    setCargandoSusp(true)
    try {
      const res = await estudiantesApi.getSuspensiones(estudianteId)
      setSuspensiones(res.data ?? [])
    } finally {
      setCargandoSusp(false)
    }
  }, [estudianteId])

  useEffect(() => { cargarSusp() }, [cargarSusp])

  // Cerrar al hacer clic fuera del drawer (ignorar si hay modal abierto)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modal !== null) return
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onCerrar()
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onCerrar, modal])

  const cerrarModal = () => { setModal(null); setMotivo(""); setFechaInicio(""); setFechaFin("") }

  const accion = async (fn: () => Promise<unknown>, mensaje: string) => {
    setCargando(true)
    try {
      await fn()
      toast.success(mensaje)
      cerrarModal()
      onActualizar()
      cargarSusp()
    } catch (e: any) {
      toast.error(e?.message ?? "Error")
    } finally {
      setCargando(false)
    }
  }

  const confirmarSuspender = () => {
    if (!motivo.trim() || !fechaInicio || !fechaFin) { toast.error("Todos los campos son requeridos"); return }
    if (fechaFin <= fechaInicio) { toast.error("La fecha de fin debe ser posterior a la de inicio"); return }
    accion(
      () => estudiantesApi.suspender(estudianteId, { motivo, fecha_inicio: fechaInicio, fecha_fin: fechaFin }),
      "Suspensión registrada"
    )
  }

  const confirmarExpulsar = () => {
    if (!motivo.trim()) { toast.error("El motivo es requerido"); return }
    accion(() => estudiantesApi.expulsar(estudianteId, { motivo }), "Estudiante expulsado")
  }

  const confirmarReactivar = () =>
    accion(() => estudiantesApi.reactivar(estudianteId), "Expulsión revertida")

  const confirmarEgresar = () =>
    accion(() => estudiantesApi.egresar(estudianteId), "Estudiante egresado")

  const eliminarSuspension = async (id: number) => {
    try {
      await estudiantesApi.deleteSuspension(estudianteId, id)
      toast.success("Suspensión eliminada")
      cargarSusp()
    } catch { toast.error("Error al eliminar") }
  }

  const estado     = estadoEfectivo.toLowerCase()
  const esEgresado = estado === "egresado"
  const esExpulsado = estado === "expulsado"

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/30" />

      {/* Panel */}
      <div
        ref={drawerRef}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-card border-l border-border shadow-xl flex flex-col"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-base font-semibold">Gestión de estado</h2>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">

          {/* Estado actual */}
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Estado actual</p>
            <div className="mt-1">
              <StatusBadge status={estadoEfectivo} />
            </div>
          </div>

          {/* Acciones — solo si no egresado */}
          {!esEgresado && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Acciones</p>

              {!esExpulsado && (
                <button
                  onClick={() => setModal("suspender")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-yellow-400 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-950/20 text-sm font-medium transition-colors"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Registrar suspensión
                </button>
              )}

              {!esExpulsado && (
                <button
                  onClick={() => setModal("expulsar")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-destructive text-destructive hover:bg-destructive/5 text-sm font-medium transition-colors"
                >
                  <Ban className="h-4 w-4" />
                  Expulsar estudiante
                </button>
              )}

              {esExpulsado && esAdmin && (
                <button
                  onClick={() => setModal("reactivar")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border hover:bg-muted text-sm font-medium transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reactivar (revertir expulsión)
                </button>
              )}

              {!esExpulsado && (
                <button
                  onClick={() => setModal("egresar")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-blue-400 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-sm font-medium transition-colors"
                >
                  <GraduationCap className="h-4 w-4" />
                  Egresar estudiante
                </button>
              )}
            </div>
          )}

          {/* Historial de suspensiones */}
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Historial de suspensiones
            </p>

            {cargandoSusp ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : suspensiones.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin suspensiones registradas.</p>
            ) : (
              suspensiones.map((s) => (
                <div
                  key={s.suspension_id}
                  className={`rounded-lg border p-3 flex flex-col gap-1 ${
                    s.vigente ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm">{s.motivo}</p>
                    {esAdmin && (
                      <button
                        onClick={() => eliminarSuspension(s.suspension_id)}
                        className="text-muted-foreground hover:text-destructive flex-shrink-0"
                        title="Eliminar suspensión"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatFecha(s.fecha_inicio)} → {formatFecha(s.fecha_fin)}
                    {s.vigente && (
                      <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-medium">• Vigente</span>
                    )}
                  </p>
                  {s.creado_por_nombre && (
                    <p className="text-xs text-muted-foreground">Registrado por: {s.creado_por_nombre}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modales sobre el drawer */}

      {modal === "suspender" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded-xl shadow-lg p-6 w-full max-w-sm mx-4 flex flex-col gap-4">
            <h2 className="text-base font-semibold">Registrar suspensión</h2>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Motivo</label>
                <textarea
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none"
                  placeholder="Describe el motivo…"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs text-muted-foreground">Fecha inicio</label>
                  <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs text-muted-foreground">Fecha fin</label>
                  <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={cerrarModal} disabled={cargando}
                className="px-3 py-1.5 rounded-md text-sm border border-border hover:bg-muted">
                Cancelar
              </button>
              <button onClick={confirmarSuspender} disabled={cargando}
                className="px-3 py-1.5 rounded-md text-sm bg-yellow-600 hover:bg-yellow-700 text-white flex items-center gap-2">
                {cargando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "expulsar" && (
        <ModalConfirmar
          titulo="Expulsar estudiante"
          descripcion={
            <div className="flex flex-col gap-2">
              <p>Retirará la matrícula activa y bloqueará futuras matrículas. Solo un administrador puede revertirlo.</p>
              <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3}
                placeholder="Motivo de la expulsión…"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none mt-1" />
            </div>
          }
          onConfirmar={confirmarExpulsar}
          onCancelar={cerrarModal}
          cargando={cargando}
        />
      )}

      {modal === "reactivar" && (
        <ModalConfirmar
          titulo="Reactivar estudiante"
          descripcion="Se revertirá la expulsión y el estudiante podrá ser matriculado nuevamente."
          onConfirmar={confirmarReactivar}
          onCancelar={cerrarModal}
          cargando={cargando}
          variante="warning"
        />
      )}

      {modal === "egresar" && (
        <ModalConfirmar
          titulo="Egresar estudiante"
          descripcion="Se creará un registro de egresado y la matrícula activa será retirada. Esta acción no se puede deshacer."
          onConfirmar={confirmarEgresar}
          onCancelar={cerrarModal}
          cargando={cargando}
          variante="warning"
        />
      )}
    </>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function DetallesEstudiantePage() {
  const params       = useParams()
  const estudianteId = parseInt(params.id as string)
  const { hasRole }  = useAuth()
  const esAdmin      = hasRole("admin")

  const [est,          setEst]          = useState<EstudianteWithPersonaDocumento | null>(null)
  const [expediente,   setExpediente]   = useState<ExpedienteResponse | null>(null)
  const [cargando,     setCargando]     = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [drawerAbierto, setDrawerAbierto] = useState(false)

  const cargarEstudiante = useCallback(async () => {
    try {
      const [estRes, expRes] = await Promise.all([
        estudiantesApi.getById(estudianteId),
        expedienteApi.get(estudianteId),
      ])
      setEst(estRes.data as unknown as EstudianteWithPersonaDocumento)
      setExpediente(expRes.data ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar")
    } finally {
      setCargando(false)
    }
  }, [estudianteId])

  useEffect(() => { cargarEstudiante() }, [cargarEstudiante])

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !est) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-sm text-destructive">{error ?? "Estudiante no encontrado"}</p>
        <Link href="/dashboard/estudiantes" className="text-sm text-primary hover:underline">
          ← Volver a la lista
        </Link>
      </div>
    )
  }

  const estadoEfectivo = est.estudiante.estado_efectivo ?? est.estudiante.estado

  const rolContent = (
    <div className="flex flex-col gap-6">

      {/* Datos básicos + botón de gestión */}
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Estado</dt>
          <dd className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={estadoEfectivo} />
            {estadoEfectivo !== "egresado" && (
              <button
                onClick={() => setDrawerAbierto(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                title="Gestionar estado"
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span>Gestionar</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </dd>
        </div>
        <DatoFila label="Fecha de ingreso" valor={formatFecha(est.estudiante.fecha_ingreso as unknown as string)} />
      </dl>

      {/* Acudientes */}
      <div className="border-t border-border pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Acudientes</p>
        <SeccionAcudientes estudianteId={estudianteId} />
      </div>

      {/* Matrículas */}
      <div className="border-t border-border pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Matrículas</p>
        <SeccionMatriculas estudianteId={estudianteId} />
      </div>

      {/* Expediente académico */}
      {expediente && (
        <div className="border-t border-border pt-5 flex flex-col gap-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expediente académico</p>

          {expediente.ficha && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3">Ficha</p>
              <FichaEstudianteView estudianteId={estudianteId} fichaInicial={expediente.ficha} />
            </div>
          )}
          {expediente.vivienda && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3">Vivienda</p>
              <ViviendaEstudianteView estudianteId={estudianteId} viviendaInicial={expediente.vivienda} />
            </div>
          )}
          {expediente.colegios && expediente.colegios.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3">Colegios anteriores</p>
              <ColegioAnteriorList estudianteId={estudianteId} colegiosIniciales={expediente.colegios} />
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/estudiantes"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Perfil del estudiante</h1>
      </div>

      <PersonaView
        persona={est.persona}
        rolLabel="Estudiante"
        rolColor="blue"
        rolContent={rolContent}
        editHref={`/dashboard/estudiantes/${estudianteId}/editar`}
        archivosEditables
      />

      {drawerAbierto && (
        <DrawerEstado
          estudianteId={estudianteId}
          estadoEfectivo={estadoEfectivo}
          esAdmin={esAdmin}
          onCerrar={() => setDrawerAbierto(false)}
          onActualizar={cargarEstudiante}
        />
      )}
    </div>
  )
}
