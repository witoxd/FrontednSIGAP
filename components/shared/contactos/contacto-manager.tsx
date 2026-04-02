"use client"

import { useState, useEffect } from "react"
import { Phone, Smartphone, Mail, MapPin, Contact, Star, Loader2, Pencil, Trash2, Check, X, Plus } from "lucide-react"
import { toast } from "sonner"
import { contactosApi } from "@/lib/api/services/contactos"
import type { Contacto, ContactoCreationAttributes } from "@/lib/types"

// ── Constantes ────────────────────────────────────────────────────────────────

type TipoContacto = Contacto["tipo_contacto"]

const TIPOS: { value: TipoContacto; label: string; Icon: React.ElementType }[] = [
  { value: "telefono",  label: "Teléfono",   Icon: Phone      },
  { value: "celular",   label: "Celular",     Icon: Smartphone },
  { value: "email",     label: "Email",       Icon: Mail       },
  { value: "direccion", label: "Dirección",   Icon: MapPin     },
  { value: "otro",      label: "Otro",        Icon: Contact    },
]

const TIPO_MAP = Object.fromEntries(TIPOS.map((t) => [t.value, t])) as Record<
  TipoContacto,
  { value: TipoContacto; label: string; Icon: React.ElementType }
>

// Estado de una fila que aún no existe en el backend
interface FilaNueva {
  _tempId: string
  tipo_contacto: TipoContacto
  valor: string
  es_principal: boolean
  estado: "nueva" | "guardando"
}

// Estado de una fila que ya existe en el backend
interface FilaExistente extends Contacto {
  estado: "guardado" | "editando" | "guardando" | "eliminando"
  // Valores en edición (solo relevantes cuando estado === "editando")
  _editTipo?: TipoContacto
  _editValor?: string
}

type Fila = FilaExistente | FilaNueva

// ── Props ─────────────────────────────────────────────────────────────────────

interface ContactoManagerProps {
  personaId: number
  disabled?: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded border border-border px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"

const selectCls =
  "rounded border border-border px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"

function esNueva(f: Fila): f is FilaNueva {
  return "_tempId" in f
}

// ── Componente ────────────────────────────────────────────────────────────────

export function ContactoManager({ personaId, disabled = false }: ContactoManagerProps) {
  const [filas, setFilas] = useState<Fila[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  // ── Carga inicial ──────────────────────────────────────────────────────────
  /**
   * Analogía: es como abrir la agenda de contactos de una persona específica.
   * Traemos todos sus contactos activos, ordenados: el principal siempre primero.
   */
  useEffect(() => {
    async function cargar() {
      try {
        const res = await contactosApi.getByPersona(personaId)
        const contactos = (res.data ?? []) as Contacto[]
        setFilas(
          contactos.map((c) => ({ ...c, estado: "guardado" as const }))
        )
      } catch (err) {
        setErrorCarga(err instanceof Error ? err.message : "Error al cargar contactos")
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [personaId])

  // ── Helpers de actualización de filas ─────────────────────────────────────

  function actualizarFila(id: string | number, cambios: Partial<FilaExistente>) {
    setFilas((prev) =>
      prev.map((f) =>
        !esNueva(f) && f.contacto_id === id
          ? { ...f, ...cambios }
          : f
      )
    )
  }

  function actualizarFilaNueva(tempId: string, cambios: Partial<FilaNueva>) {
    setFilas((prev) =>
      prev.map((f) =>
        esNueva(f) && f._tempId === tempId ? { ...f, ...cambios } : f
      )
    )
  }

  // ── Agregar fila nueva ─────────────────────────────────────────────────────

  function handleAgregarFila() {
    const nueva: FilaNueva = {
      _tempId:       crypto.randomUUID(),
      tipo_contacto: "celular",
      valor:         "",
      es_principal:  filas.length === 0, // primer contacto es principal por defecto
      estado:        "nueva",
    }
    setFilas((prev) => [...prev, nueva])
  }

  // ── Guardar fila nueva (POST /create) ──────────────────────────────────────

  async function handleGuardarNueva(tempId: string) {
    const fila = filas.find((f) => esNueva(f) && (f as FilaNueva)._tempId === tempId) as FilaNueva | undefined
    if (!fila) return

    if (!fila.valor.trim()) {
      toast.error("El valor del contacto no puede estar vacío")
      return
    }

    actualizarFilaNueva(tempId, { estado: "guardando" })

    try {
      const dto: ContactoCreationAttributes = {
        contacto: {
          persona_id:    personaId,
          tipo_contacto: fila.tipo_contacto,
          valor:         fila.valor.trim(),
          es_principal:  fila.es_principal || false,
        }
      }

      const res = await contactosApi.create(dto)
      const nuevo = res.data as Contacto

      // Reemplazar la fila temporal por la real del backend
      setFilas((prev) =>
        prev.map((f) =>
          esNueva(f) && (f as FilaNueva)._tempId === tempId
            ? { ...nuevo, estado: "guardado" as const }
            : f
        )
      )
      toast.success("Contacto guardado")
    } catch (err) {
      actualizarFilaNueva(tempId, { estado: "nueva" })
      toast.error(err instanceof Error ? err.message : "Error al guardar")
    }
  }

  // ── Cancelar fila nueva ────────────────────────────────────────────────────

  function handleCancelarNueva(tempId: string) {
    setFilas((prev) => prev.filter((f) => !(esNueva(f) && (f as FilaNueva)._tempId === tempId)))
  }

  // ── Iniciar edición ────────────────────────────────────────────────────────

  function handleIniciarEdicion(contactoId: number) {
    const fila = filas.find((f) => !esNueva(f) && (f as FilaExistente).contacto_id === contactoId) as FilaExistente | undefined
    if (!fila) return
    actualizarFila(contactoId, {
      estado:      "editando",
      _editTipo:   fila.tipo_contacto,
      _editValor:  fila.valor,
    })
  }

  // ── Cancelar edición ───────────────────────────────────────────────────────

  function handleCancelarEdicion(contactoId: number) {
    actualizarFila(contactoId, { estado: "guardado", _editTipo: undefined, _editValor: undefined })
  }

  // ── Confirmar edición (PUT /update/:id) ────────────────────────────────────

  async function handleConfirmarEdicion(contactoId: number) {
    const fila = filas.find((f) => !esNueva(f) && (f as FilaExistente).contacto_id === contactoId) as FilaExistente | undefined
    if (!fila || !fila._editValor?.trim()) {
      toast.error("El valor no puede estar vacío")
      return
    }

    actualizarFila(contactoId, { estado: "guardando" })

    try {
      const res = await contactosApi.update(contactoId, {
        contacto: {
          tipo_contacto: fila._editTipo,
          valor:         fila._editValor.trim(),
        },
      })
      const actualizado = res.data as Contacto
      actualizarFila(contactoId, {
        ...actualizado,
        estado:     "guardado",
        _editTipo:  undefined,
        _editValor: undefined,
      })
      toast.success("Contacto actualizado")
    } catch (err) {
      actualizarFila(contactoId, { estado: "editando" })
      toast.error(err instanceof Error ? err.message : "Error al actualizar")
    }
  }

  // ── Marcar como principal (PATCH /setPrincipal/:id) ───────────────────────
  /**
   * El backend se encarga de desmarcar el principal anterior.
   * Solo necesitamos enviar el nuevo id — el backend hace el swap solo.
   */
  async function handleSetPrincipal(contactoId: number) {
    const fila = filas.find((f) => !esNueva(f) && (f as FilaExistente).contacto_id === contactoId) as FilaExistente | undefined
    if (!fila || fila.es_principal) return

    actualizarFila(contactoId, { estado: "guardando" })

    try {
      await contactosApi.setPrincipal(contactoId)
      // Actualizar el estado local: quitar principal de todos y poner en este
      setFilas((prev) =>
        prev.map((f) => {
          if (esNueva(f)) return f
          const fe = f as FilaExistente
          return {
            ...fe,
            es_principal: fe.contacto_id === contactoId,
            estado: fe.contacto_id === contactoId ? "guardado" : fe.estado,
          }
        })
      )
      toast.success("Contacto principal actualizado")
    } catch (err) {
      actualizarFila(contactoId, { estado: "guardado" })
      toast.error(err instanceof Error ? err.message : "Error al actualizar")
    }
  }

  // ── Eliminar Soft (DELETE /delete/:id) ──────────────────────────────────────────

  async function handleEliminar(contactoId: number) {
    actualizarFila(contactoId, { estado: "eliminando" })

    try {
      await contactosApi.delete(contactoId)
      setFilas((prev) => prev.filter((f) => !((!esNueva(f)) && (f as FilaExistente).contacto_id === contactoId)))
      toast.success("Contacto eliminado")
    } catch (err) {
      actualizarFila(contactoId, { estado: "guardado" })
      toast.error(err instanceof Error ? err.message : "Error al eliminar")
    }
  }

  // ── Render: cargando ───────────────────────────────────────────────────────

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    )
  }

  if (errorCarga) {
    return (
      <p className="text-sm text-destructive py-4">{errorCarga}</p>
    )
  }

  // ── Render principal ───────────────────────────────────────────────────────

  return (
    <div className="space-y-3">

      {/* ── Tabla de contactos ── */}
      {filas.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2 text-left font-medium w-8 text-muted-foreground">★</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Tipo</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Valor</th>
                <th className="px-3 py-2 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filas.map((fila) => {
                // ── Fila nueva (aún sin id del backend) ──────────────────────
                if (esNueva(fila)) {
                  const guardando = fila.estado === "guardando"
                  return (
                    <tr key={fila._tempId} className="bg-accent/20">
                      {/* Estrella — desactivada para filas nuevas */}
                      <td className="px-3 py-2 text-center">
                        <Star className="h-4 w-4 text-muted mx-auto" />
                      </td>

                      {/* Select de tipo */}
                      <td className="px-3 py-2">
                        <select
                          disabled={guardando || disabled}
                          value={fila.tipo_contacto}
                          onChange={(e) =>
                            actualizarFilaNueva(fila._tempId, {
                              tipo_contacto: e.target.value as TipoContacto,
                            })
                          }
                          className={selectCls}
                        >
                          {TIPOS.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </td>

                      {/* Input de valor */}
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          disabled={guardando || disabled}
                          value={fila.valor}
                          onChange={(e) =>
                            actualizarFilaNueva(fila._tempId, { valor: e.target.value })
                          }
                          placeholder={fila.tipo_contacto === "email" ? "correo@ejemplo.com" : "Valor del contacto"}
                          className={inputCls}
                          autoFocus
                        />
                      </td>

                      {/* Acciones: confirmar / cancelar */}
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          {guardando ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleGuardarNueva(fila._tempId)}
                                disabled={disabled}
                                title="Confirmar"
                                className="p-1 rounded text-success hover:text-success hover:bg-success/10 transition-colors disabled:opacity-50"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancelarNueva(fila._tempId)}
                                disabled={disabled}
                                title="Cancelar"
                                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                }

                // ── Fila existente (ya tiene id del backend) ──────────────────
                const fe = fila as FilaExistente
                const enEdicion   = fe.estado === "editando"
                const guardando   = fe.estado === "guardando"
                const eliminando  = fe.estado === "eliminando"
                const ocupado     = guardando || eliminando
                const { Icon }    = TIPO_MAP[fe.tipo_contacto] ?? TIPO_MAP["otro"]

                return (
                  <tr
                    key={fe.contacto_id}
                    className={`transition-colors ${
                      eliminando ? "opacity-40" :
                      enEdicion  ? "bg-warning/10" :
                      "bg-card hover:bg-secondary/30"
                    }`}
                  >
                    {/* Estrella de principal */}
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        disabled={ocupado || disabled || fe.es_principal}
                        onClick={() => handleSetPrincipal(fe.contacto_id)}
                        title={fe.es_principal ? "Contacto principal" : "Marcar como principal"}
                        className="mx-auto block disabled:cursor-default"
                      >
                        <Star
                          className={`h-4 w-4 transition-colors ${
                            fe.es_principal
                              ? "text-warning fill-warning"
                              : "text-muted hover:text-warning"
                          }`}
                        />
                      </button>
                    </td>

                    {/* Tipo */}
                    <td className="px-3 py-2">
                      {enEdicion ? (
                        <select
                          disabled={ocupado || disabled}
                          value={fe._editTipo ?? fe.tipo_contacto}
                          onChange={(e) =>
                            actualizarFila(fe.contacto_id, { _editTipo: e.target.value as TipoContacto })
                          }
                          className={selectCls}
                        >
                          {TIPOS.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-1.5 text-foreground">
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span>{TIPO_MAP[fe.tipo_contacto]?.label ?? fe.tipo_contacto}</span>
                        </div>
                      )}
                    </td>

                    {/* Valor */}
                    <td className="px-3 py-2">
                      {enEdicion ? (
                        <input
                          type="text"
                          disabled={ocupado || disabled}
                          value={fe._editValor ?? fe.valor}
                          onChange={(e) =>
                            actualizarFila(fe.contacto_id, { _editValor: e.target.value })
                          }
                          className={inputCls}
                          autoFocus
                        />
                      ) : (
                        <span className="text-foreground">{fe.valor}</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        {ocupado ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : enEdicion ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleConfirmarEdicion(fe.contacto_id)}
                              disabled={disabled}
                              title="Guardar cambios"
                              className="p-1 rounded text-success hover:text-success hover:bg-success/10 transition-colors"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelarEdicion(fe.contacto_id)}
                              disabled={disabled}
                              title="Cancelar edición"
                              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleIniciarEdicion(fe.contacto_id)}
                              disabled={disabled}
                              title="Editar"
                              className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-accent/30 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEliminar(fe.contacto_id)}
                              disabled={disabled}
                              title="Eliminar"
                              className="p-1 rounded text-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Agregar contacto ── */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleAgregarFila}
        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        Agregar contacto
      </button>

      {filas.length === 0 && (
        <p className="text-xs text-muted-foreground mt-1">
          Sin contactos registrados. Agrega al menos uno para facilitar la comunicación.
        </p>
      )}
    </div>
  )
}
