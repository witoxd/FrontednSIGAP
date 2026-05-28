"use client"

import { useState, useEffect } from "react"
import { Search, Loader2 } from "lucide-react"
import { Modal } from "@/components/shared/modal"
import { profesoresApi } from "@/lib/api/services/profesores"
import { reemplazosApi } from "@/lib/api/services/reemplazos"
import type { ProfesorWitchPersonaDocumento } from "@/lib/types"
import { toast } from "sonner"

interface ReemplazoModalProps {
  open:               boolean
  profesorReemplazadoId: number
  onClose:            () => void
  onSuccess:          () => void
}

export function ReemplazoModal({
  open,
  profesorReemplazadoId,
  onClose,
  onSuccess,
}: ReemplazoModalProps) {
  const [query,        setQuery]        = useState("")
  const [buscando,     setBuscando]     = useState(false)
  const [resultados,   setResultados]   = useState<ProfesorWitchPersonaDocumento[]>([])
  const [seleccionado, setSeleccionado] = useState<ProfesorWitchPersonaDocumento | null>(null)
  const [fechaInicio,  setFechaInicio]  = useState(new Date().toISOString().split("T")[0])
  const [fechaFin,     setFechaFin]     = useState("")
  const [motivo,       setMotivo]       = useState("")
  const [guardando,    setGuardando]    = useState(false)

  useEffect(() => {
    if (!open) {
      setQuery(""); setResultados([]); setSeleccionado(null)
      setFechaFin(""); setMotivo(""); setGuardando(false)
    }
  }, [open])

  async function buscar() {
    if (!query.trim()) return
    setBuscando(true)
    try {
      const res = await profesoresApi.searchIndex(query)
      const lista = (res.data ?? []) as ProfesorWitchPersonaDocumento[]
      setResultados(lista.filter((p) => p.profesor.profesor_id !== profesorReemplazadoId))
    } catch {
      toast.error("Error al buscar profesores")
    } finally {
      setBuscando(false)
    }
  }

  async function confirmar() {
    if (!seleccionado) return
    setGuardando(true)
    try {
      await reemplazosApi.create({
        profesor_id:             seleccionado.profesor.profesor_id,
        reemplaza_a_profesor_id: profesorReemplazadoId,
        fecha_inicio:            fechaInicio,
        fecha_fin:               fechaFin,
        motivo:                  motivo || undefined,
      })
      toast.success("Reemplazo registrado")
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al registrar reemplazo")
    } finally {
      setGuardando(false)
    }
  }

  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"

  return (
    <Modal open={open} onClose={onClose} title="Asignar reemplazo">
      <div className="flex flex-col gap-5">

        {/* Buscar profesor reemplazante */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Buscar profesor reemplazante</label>
          <div className="flex gap-2">
            <input
              value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
              className={inputClass} placeholder="Nombre o documento…"
            />
            <button
              type="button" onClick={buscar} disabled={buscando}
              className="flex h-10 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>

          {resultados.length > 0 && !seleccionado && (
            <ul className="mt-1 rounded-lg border border-border divide-y divide-border max-h-48 overflow-y-auto">
              {resultados.map((p) => {
                const per = p.persona as any
                const nombre = `${per.nombres} ${per.apellido_paterno} ${per.apellido_materno ?? ""}`.trim()
                return (
                  <li key={p.profesor.profesor_id}>
                    <button
                      type="button"
                      onClick={() => { setSeleccionado(p); setResultados([]) }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors"
                    >
                      <span className="font-medium">{nombre}</span>
                      <span className="ml-2 text-muted-foreground">{per.numero_documento}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {seleccionado && (
            <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-2.5">
              <div>
                {(() => {
                  const per = seleccionado.persona as any
                  return (
                    <span className="text-sm font-medium">
                      {`${per.nombres} ${per.apellido_paterno} ${per.apellido_materno ?? ""}`.trim()}
                    </span>
                  )
                })()}
              </div>
              <button
                type="button" onClick={() => setSeleccionado(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cambiar
              </button>
            </div>
          )}
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Fecha de inicio *</label>
            <input
              type="date" value={fechaInicio} disabled={guardando}
              onChange={(e) => setFechaInicio(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Fecha de fin *</label>
            <input
              type="date" value={fechaFin} disabled={guardando}
              min={fechaInicio || undefined}
              onChange={(e) => setFechaFin(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Motivo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Motivo (opcional)</label>
          <textarea
            value={motivo} disabled={guardando} rows={2}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 resize-none"
            placeholder="Incapacidad, licencia, etc."
          />
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <button
            type="button" onClick={onClose} disabled={guardando}
            className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button" onClick={confirmar}
            disabled={!seleccionado || !fechaInicio || !fechaFin || guardando}
            className="flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar reemplazo"}
          </button>
        </div>
      </div>
    </Modal>
  )
}
