"use client"

import { useState, useRef, useEffect } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { Check, Minus, Loader2, ShieldAlert, Plus, Lock, Trash2, X } from "lucide-react"
import { swrFetcher } from "@/lib/api/fetcher"
import { rolesApi } from "@/lib/api/services/roles"
import { permisosApi } from "@/lib/api/services/permisos"
import { useAuth } from "@/lib/auth/auth-context"
import { toast } from "sonner"
import type { Role, Permiso } from "@/lib/types"

const ACCIONES: Permiso["accion"][] = ["create", "read", "update", "delete", "manage"]

const LABEL_ACCION: Record<Permiso["accion"], string> = {
  create:  "Crear",
  read:    "Leer",
  update:  "Editar",
  delete:  "Eliminar",
  manage:  "Total",
}

const LABEL_ROL: Record<string, string> = {
  admin:          "Administrador",
  profesor:       "Profesor",
  administrativo: "Administrativo",
  estudiante:     "Estudiante",
}

const COLOR_ROL: Record<string, string> = {
  admin:          "text-red-500",
  profesor:       "text-blue-500",
  administrativo: "text-amber-500",
  estudiante:     "text-emerald-500",
}

const ROLES_SISTEMA = new Set(["admin", "profesor", "estudiante", "administrativo"])

export function SeccionRolesPermisos() {
  const { user } = useAuth()
  const [rolSeleccionado, setRolSeleccionado] = useState<Role | null>(null)
  const [enProgreso, setEnProgreso] = useState<Set<number>>(new Set())

  // Estado para modal de crear rol
  const [modalCrear, setModalCrear] = useState(false)
  const [nombreNuevoRol, setNombreNuevoRol] = useState("")
  const [descripcionNuevoRol, setDescripcionNuevoRol] = useState("")
  const [creando, setCreando] = useState(false)

  // Estado para confirmación de eliminar
  const [rolAEliminar, setRolAEliminar] = useState<Role | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (modalCrear) setTimeout(() => inputRef.current?.focus(), 50) }, [modalCrear])

  const { data: rolesData, isLoading: cargandoRoles } =
    useSWR<{ success: boolean; data: Role[] }>("/roles", swrFetcher)

  const { data: todosPermisos, isLoading: cargandoPermisos } =
    useSWR<{ success: boolean; data: Permiso[] }>("/permisos", swrFetcher)

  const keyPermisoRol = rolSeleccionado ? `/permisos/role/${rolSeleccionado.role_id}` : null
  const { data: permisosRol } =
    useSWR<{ success: boolean; data: Permiso[] }>(keyPermisoRol, swrFetcher)

  const roles   = rolesData?.data ?? []
  const todos   = todosPermisos?.data ?? []
  const activos = new Set((permisosRol?.data ?? []).map(p => p.permiso_id))

  // Agrupar todos los permisos por recurso
  const porRecurso = todos.reduce<Record<string, Record<string, Permiso>>>((acc, p) => {
    if (!acc[p.recurso]) acc[p.recurso] = {}
    acc[p.recurso][p.accion] = p
    return acc
  }, {})
  const recursos = Object.keys(porRecurso).sort()

  const esRolPropio = rolSeleccionado
    ? (user as any)?.roles?.includes(rolSeleccionado.nombre)
    : false

  const togglePermiso = async (permiso: Permiso) => {
    if (!rolSeleccionado || esRolPropio) return

    const estaActivo = activos.has(permiso.permiso_id)

    setEnProgreso(prev => new Set(prev).add(permiso.permiso_id))
    try {
      if (estaActivo) {
        await permisosApi.removeFromRole(rolSeleccionado.role_id, permiso.permiso_id)
        toast.success("Permiso removido")
      } else {
        await permisosApi.assignToRole(rolSeleccionado.role_id, permiso.permiso_id)
        toast.success("Permiso asignado")
      }
      await globalMutate(keyPermisoRol)
    } catch {
      toast.error("Error al actualizar el permiso")
    } finally {
      setEnProgreso(prev => {
        const next = new Set(prev)
        next.delete(permiso.permiso_id)
        return next
      })
    }
  }

  const crearRol = async () => {
    const nombre = nombreNuevoRol.trim().toLowerCase().replace(/\s+/g, "_")
    if (!nombre) return
    setCreando(true)
    try {
      await rolesApi.create({ nombre, descripcion: descripcionNuevoRol.trim() || undefined })
      toast.success(`Rol "${nombre}" creado exitosamente`)
      await globalMutate("/roles")
      setModalCrear(false)
      setNombreNuevoRol("")
      setDescripcionNuevoRol("")
    } catch {
      toast.error("No se pudo crear el rol")
    } finally {
      setCreando(false)
    }
  }

  const eliminarRol = async () => {
    if (!rolAEliminar) return
    setEliminando(true)
    try {
      await rolesApi.delete(rolAEliminar.role_id)
      toast.success(`Rol "${rolAEliminar.nombre}" eliminado`)
      if (rolSeleccionado?.role_id === rolAEliminar.role_id) setRolSeleccionado(null)
      await globalMutate("/roles")
      setRolAEliminar(null)
    } catch {
      toast.error("No se pudo eliminar el rol")
    } finally {
      setEliminando(false)
    }
  }

  if (cargandoRoles) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Cargando roles...</span>
      </div>
    )
  }

  return (
    <>
    <div className="flex gap-0 min-h-[480px]">

      {/* Panel izquierdo — lista de roles */}
      <div className="w-56 flex-shrink-0 border-r border-border flex flex-col gap-1 p-3">
        <div className="flex items-center justify-between px-2 mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Roles
          </p>
          <button
            onClick={() => setModalCrear(true)}
            title="Crear nuevo rol"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Nuevo
          </button>
        </div>
        {roles.map(rol => {
          const activo = rolSeleccionado?.role_id === rol.role_id
          const esSistema = ROLES_SISTEMA.has(rol.nombre)
          return (
            <div
              key={rol.role_id}
              className={`group relative flex items-center rounded-lg border transition-colors ${
                activo
                  ? "bg-zinc-900 border-zinc-700 dark:bg-zinc-800 dark:border-zinc-600"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <button
                onClick={() => setRolSeleccionado(rol)}
                className="flex-1 text-left px-3 py-2.5 text-sm font-medium"
              >
                <span className={`flex items-center gap-1 text-xs font-semibold mb-0.5 ${activo ? "text-zinc-400" : COLOR_ROL[rol.nombre] ?? "text-purple-500"}`}>
                  {esSistema && <Lock className="w-2.5 h-2.5" />}
                  {rol.nombre}
                </span>
                <span className={activo ? "text-white" : "text-foreground"}>
                  {LABEL_ROL[rol.nombre] ?? rol.nombre}
                </span>
              </button>
              {!esSistema && (
                <button
                  onClick={(e) => { e.stopPropagation(); setRolAEliminar(rol) }}
                  title="Eliminar rol"
                  className="opacity-0 group-hover:opacity-100 mr-2 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Panel derecho — matriz */}
      <div className="flex-1 min-w-0 flex flex-col">
        {!rolSeleccionado ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground py-16">
            <ShieldAlert className="w-8 h-8 opacity-30" />
            <p className="text-sm">Selecciona un rol para ver sus permisos</p>
          </div>
        ) : (
          <>
            {/* Banner de advertencia si es el rol propio */}
            {esRolPropio && (
              <div className="flex items-center gap-2 mx-4 mt-4 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                Estás viendo tu propio rol. Los cambios aquí afectarían tu propio acceso — edición deshabilitada.
              </div>
            )}

            {cargandoPermisos ? (
              <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide w-40">
                        Recurso
                      </th>
                      {ACCIONES.map(accion => (
                        <th key={accion} className="px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide w-24">
                          {LABEL_ACCION[accion]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recursos.map(recurso => (
                      <tr key={recurso} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-2.5">
                          <span className="text-xs font-mono text-foreground">{recurso}</span>
                        </td>
                        {ACCIONES.map(accion => {
                          const permiso = porRecurso[recurso]?.[accion]
                          if (!permiso) {
                            return <td key={accion} className="px-3 py-2.5 text-center">
                              <span className="text-muted-foreground/30 text-xs">—</span>
                            </td>
                          }
                          const estaActivo  = activos.has(permiso.permiso_id)
                          const cargando    = enProgreso.has(permiso.permiso_id)
                          const deshabilitado = esRolPropio

                          return (
                            <td key={accion} className="px-3 py-2.5 text-center">
                              <button
                                onClick={() => togglePermiso(permiso)}
                                disabled={deshabilitado || cargando}
                                title={permiso.nombre}
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-md border transition-all ${
                                  cargando
                                    ? "bg-muted/40 border-border animate-pulse cursor-wait"
                                    : estaActivo
                                      ? "bg-emerald-500/15 border-emerald-500/40 hover:bg-emerald-500/25"
                                      : deshabilitado
                                        ? "bg-transparent border-border opacity-40 cursor-not-allowed"
                                        : "bg-transparent border-border hover:bg-muted/40"
                                }`}
                              >
                                {cargando ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                                ) : estaActivo ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <Minus className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />
                                )}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>

      {/* Modal: Crear nuevo rol */}
      {modalCrear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">Crear nuevo rol</h3>
              <button onClick={() => { setModalCrear(false); setNombreNuevoRol(""); setDescripcionNuevoRol("") }} className="p-1 rounded hover:bg-muted/50 text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Nombre del rol <span className="text-destructive">*</span>
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={nombreNuevoRol}
                  onChange={e => setNombreNuevoRol(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") crearRol() }}
                  placeholder="ej: coordinador"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Se guardará en minúsculas. Los espacios se convierten en guiones bajos.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={descripcionNuevoRol}
                  onChange={e => setDescripcionNuevoRol(e.target.value)}
                  placeholder="ej: Coordina actividades académicas"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => { setModalCrear(false); setNombreNuevoRol(""); setDescripcionNuevoRol("") }}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={crearRol}
                disabled={!nombreNuevoRol.trim() || creando}
                className="flex-1 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {creando && <Loader2 className="w-4 h-4 animate-spin" />}
                Crear rol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar eliminación */}
      {rolAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Eliminar rol</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  ¿Estás seguro de que quieres eliminar el rol{" "}
                  <span className="font-semibold text-foreground">"{rolAEliminar.nombre}"</span>?
                  Los usuarios que tengan este rol lo perderán.
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setRolAEliminar(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarRol}
                disabled={eliminando}
                className="flex-1 px-4 py-2 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {eliminando && <Loader2 className="w-4 h-4 animate-spin" />}
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
