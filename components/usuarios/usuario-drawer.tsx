"use client"

import { useState, useEffect } from "react"
import { X, UserSearch, UserPlus, ChevronRight, ChevronLeft, Loader2 } from "lucide-react"
import useSWR from "swr"
import { toast } from "sonner"
import { swrFetcher } from "@/lib/api/fetcher"
import { usersApi, type CreateUserInput, type CreateUserWithPersonaInput } from "@/lib/api/services/users"
import { PersonaSearchModal } from "@/components/personas/persona-search-modal"
import { UsuarioAvatar } from "./usuario-avatar"
import type { PersonaWithTipoDocumento, TipoDocumento, Persona } from "@/lib/types"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Modo = "A" | "B"
type PasoB = 1 | 2

const ROLES = ["admin", "profesor", "administrativo", "estudiante"] as const
type RolValue = typeof ROLES[number]

const ROL_LABELS: Record<RolValue, string> = {
  admin:          "Administrador",
  profesor:       "Profesor",
  administrativo: "Administrativo",
  estudiante:     "Estudiante",
}

const GENEROS = ["Masculino", "Femenino", "Otro"] as const

interface CredencialesForm {
  username:   string
  email:      string
  contraseña: string
  rol:        RolValue | ""
}

const credencialesVacias: CredencialesForm = {
  username:   "",
  email:      "",
  contraseña: "",
  rol:        "",
}

interface PersonaSimpleForm {
  nombres:           string
  apellido_paterno:  string
  apellido_materno:  string
  tipo_documento_id: number | ""
  numero_documento:  string
  fecha_nacimiento:  string
  genero:            string
}

const personaVacia: PersonaSimpleForm = {
  nombres:           "",
  apellido_paterno:  "",
  apellido_materno:  "",
  tipo_documento_id: "",
  numero_documento:  "",
  fecha_nacimiento:  "",
  genero:            "",
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface UsuarioDrawerProps {
  open:      boolean
  onClose:   () => void
  onSuccess: () => void
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function UsuarioDrawer({ open, onClose, onSuccess }: UsuarioDrawerProps) {
  const [modo, setModo]             = useState<Modo>("A")
  const [paso, setPaso]             = useState<PasoB>(1)
  const [guardando, setGuardando]   = useState(false)

  // Modo A — persona existente
  const [personaSeleccionada, setPersonaSeleccionada] = useState<PersonaWithTipoDocumento | null>(null)
  const [mostrarBuscador, setMostrarBuscador]         = useState(false)
  const [credsA, setCredsA]                           = useState<CredencialesForm>(credencialesVacias)

  // Modo B — nueva persona + usuario
  const [personaB, setPersonaB] = useState<PersonaSimpleForm>(personaVacia)
  const [credsB, setCredsB]     = useState<CredencialesForm>(credencialesVacias)

  // Tipos de documento para el select del paso 1 de Modo B
  const { data: tiposDocData } = useSWR<{ success: boolean; data: TipoDocumento[] }>(
    "/tipos-documento",
    swrFetcher,
  )
  const tiposDoc = tiposDocData?.data ?? []

  // Cierra con Escape y bloquea scroll
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    if (open) {
      document.addEventListener("keydown", onKey)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  // Resetea el estado al cerrar
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setModo("A")
        setPaso(1)
        setPersonaSeleccionada(null)
        setMostrarBuscador(false)
        setCredsA(credencialesVacias)
        setPersonaB(personaVacia)
        setCredsB(credencialesVacias)
      }, 300)
    }
  }, [open])

  // ── Modo A: submit ─────────────────────────────────────────────────────────
  async function handleSubmitA() {
    if (!personaSeleccionada || !credsA.rol) return
    setGuardando(true)
    try {
      await usersApi.createUser(personaSeleccionada.persona_id!, {
        user: {
          username:   credsA.username,
          email:      credsA.email,
          contraseña: credsA.contraseña,
          persona_id: personaSeleccionada.persona_id!,
        },
        role: credsA.rol,
      } as CreateUserInput)
      toast.success("Usuario creado exitosamente")
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear usuario")
    } finally {
      setGuardando(false)
    }
  }

  // ── Modo B: submit ─────────────────────────────────────────────────────────
  async function handleSubmitB() {
    if (!credsB.rol || !personaB.tipo_documento_id) return
    setGuardando(true)
    try {
      const payload: CreateUserWithPersonaInput = {
        persona: {
          nombres:           personaB.nombres,
          apellido_paterno:  personaB.apellido_paterno,
          apellido_materno:  personaB.apellido_materno,
          tipo_documento_id: Number(personaB.tipo_documento_id),
          numero_documento:  personaB.numero_documento,
          fecha_nacimiento:  personaB.fecha_nacimiento,
          genero:            personaB.genero as Persona["genero"],
          grupo_sanguineo:   "",
          grupo_etnico:      "",
          credo_religioso:   "",
          lugar_nacimiento:  "",
          serial_registro_civil: "",
          expedida_en:       "",
        },
        user: {
          username:   credsB.username,
          email:      credsB.email,
          contraseña: credsB.contraseña,
          persona_id: 0,
        },
        role: credsB.rol,
      }
      await usersApi.createUserWithPersona(payload)
      toast.success("Persona y usuario creados exitosamente")
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear usuario")
    } finally {
      setGuardando(false)
    }
  }

  // ── Validaciones ───────────────────────────────────────────────────────────
  const canSubmitA =
    !!personaSeleccionada &&
    credsA.username.trim() &&
    credsA.email.trim() &&
    credsA.contraseña.trim() &&
    !!credsA.rol

  const canAdvanceB =
    personaB.nombres.trim() &&
    personaB.apellido_paterno.trim() &&
    personaB.tipo_documento_id !== "" &&
    personaB.numero_documento.trim() &&
    personaB.fecha_nacimiento &&
    personaB.genero

  const canSubmitB =
    credsB.username.trim() &&
    credsB.email.trim() &&
    credsB.contraseña.trim() &&
    !!credsB.rol

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] flex-col bg-background shadow-2xl border-l border-border transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Crear usuario"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold text-foreground">Nuevo usuario</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Asigna credenciales de acceso al sistema
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Selector de modo ── */}
        <div className="flex gap-1 mx-6 mt-5 rounded-lg bg-muted p-1 shrink-0">
          <button
            onClick={() => setModo("A")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-colors ${
              modo === "A"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserSearch className="w-3.5 h-3.5" />
            Persona existente
          </button>
          <button
            onClick={() => { setModo("B"); setPaso(1) }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-colors ${
              modo === "B"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Persona nueva
          </button>
        </div>

        {/* ── Contenido scrollable ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ════ MODO A ════ */}
          {modo === "A" && (
            <div className="flex flex-col gap-5">

              {/* Buscar persona */}
              {!personaSeleccionada ? (
                <button
                  type="button"
                  onClick={() => setMostrarBuscador(true)}
                  className="flex items-center gap-3 w-full rounded-xl border-2 border-dashed border-border px-4 py-5 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-muted/30 transition-all"
                >
                  <UserSearch className="w-5 h-5 shrink-0" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">Buscar persona registrada</p>
                    <p className="text-xs">Por nombre o número de documento</p>
                  </div>
                </button>
              ) : (
                /* Persona seleccionada */
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
                  <UsuarioAvatar
                    nombres={personaSeleccionada.nombres}
                    apellidoPaterno={personaSeleccionada.apellido_paterno}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {[personaSeleccionada.nombres, personaSeleccionada.apellido_paterno, personaSeleccionada.apellido_materno]
                        .filter(Boolean).join(" ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {personaSeleccionada.tipo_documento?.nombre_documento} · {personaSeleccionada.numero_documento}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPersonaSeleccionada(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                    aria-label="Cambiar persona"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Credenciales */}
              <CredencialesFields
                values={credsA}
                onChange={setCredsA}
                disabled={!personaSeleccionada}
              />
            </div>
          )}

          {/* ════ MODO B ════ */}
          {modo === "B" && (
            <div className="flex flex-col gap-5">

              {/* Stepper indicator */}
              <div className="flex items-center gap-2">
                <StepIndicator n={1} label="Datos personales" active={paso === 1} done={paso > 1} />
                <div className="flex-1 h-px bg-border" />
                <StepIndicator n={2} label="Credenciales"    active={paso === 2} done={false} />
              </div>

              {/* Paso 1 — datos de persona */}
              {paso === 1 && (
                <div className="flex flex-col gap-4">
                  <Field label="Nombres *">
                    <input
                      value={personaB.nombres}
                      onChange={e => setPersonaB(p => ({ ...p, nombres: e.target.value }))}
                      className={inputCls}
                      placeholder="Nombres completos"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Apellido paterno *">
                      <input
                        value={personaB.apellido_paterno}
                        onChange={e => setPersonaB(p => ({ ...p, apellido_paterno: e.target.value }))}
                        className={inputCls}
                        placeholder="Apellido paterno"
                      />
                    </Field>
                    <Field label="Apellido materno">
                      <input
                        value={personaB.apellido_materno}
                        onChange={e => setPersonaB(p => ({ ...p, apellido_materno: e.target.value }))}
                        className={inputCls}
                        placeholder="Apellido materno"
                      />
                    </Field>
                  </div>

                  <Field label="Tipo de documento *">
                    <select
                      value={personaB.tipo_documento_id}
                      onChange={e => setPersonaB(p => ({ ...p, tipo_documento_id: Number(e.target.value) || "" }))}
                      className={inputCls}
                    >
                      <option value="">Seleccionar...</option>
                      {tiposDoc.map(td => (
                        <option key={td.tipo_documento_id} value={td.tipo_documento_id}>
                          {td.nombre_documento ?? td.tipo_documento}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Número de documento *">
                    <input
                      value={personaB.numero_documento}
                      onChange={e => setPersonaB(p => ({ ...p, numero_documento: e.target.value }))}
                      className={inputCls}
                      placeholder="Ej: 1020304050"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Fecha de nacimiento *">
                      <input
                        type="date"
                        value={personaB.fecha_nacimiento}
                        onChange={e => setPersonaB(p => ({ ...p, fecha_nacimiento: e.target.value }))}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Género *">
                      <select
                        value={personaB.genero}
                        onChange={e => setPersonaB(p => ({ ...p, genero: e.target.value }))}
                        className={inputCls}
                      >
                        <option value="">Seleccionar...</option>
                        {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </Field>
                  </div>
                </div>
              )}

              {/* Paso 2 — credenciales */}
              {paso === 2 && (
                <CredencialesFields values={credsB} onChange={setCredsB} />
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-border px-6 py-4">
          {modo === "A" && (
            <button
              onClick={handleSubmitA}
              disabled={!canSubmitA || guardando}
              className="flex w-full items-center justify-center gap-2 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Crear usuario
            </button>
          )}

          {modo === "B" && paso === 1 && (
            <button
              onClick={() => setPaso(2)}
              disabled={!canAdvanceB}
              className="flex w-full items-center justify-center gap-2 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {modo === "B" && paso === 2 && (
            <div className="flex gap-2">
              <button
                onClick={() => setPaso(1)}
                className="flex items-center gap-1.5 h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Atrás
              </button>
              <button
                onClick={handleSubmitB}
                disabled={!canSubmitB || guardando}
                className="flex flex-1 items-center justify-center gap-2 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Crear usuario
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Modal de búsqueda de persona (Modo A) */}
      {mostrarBuscador && (
        <PersonaSearchModal
          titulo="Buscar persona para asignar usuario"
          onSeleccionar={(persona) => {
            setPersonaSeleccionada(persona)
            setMostrarBuscador(false)
          }}
          onCerrar={() => setMostrarBuscador(false)}
        />
      )}
    </>
  )
}

// ─── Sub-componentes internos ─────────────────────────────────────────────────

const inputCls =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

function StepIndicator({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
        done   ? "bg-emerald-500 text-white" :
        active ? "bg-primary text-primary-foreground" :
                 "bg-muted text-muted-foreground"
      }`}>
        {n}
      </div>
      <span className={`text-xs font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>
        {label}
      </span>
    </div>
  )
}

interface CredencialesFieldsProps {
  values:   CredencialesForm
  onChange: (v: CredencialesForm) => void
  disabled?: boolean
}

function CredencialesFields({ values, onChange, disabled = false }: CredencialesFieldsProps) {
  const set = (key: keyof CredencialesForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...values, [key]: e.target.value })

  return (
    <div className={`flex flex-col gap-4 ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      {disabled && (
        <p className="text-xs text-muted-foreground text-center italic">
          Selecciona una persona primero
        </p>
      )}

      <Field label="Nombre de usuario *">
        <input
          value={values.username}
          onChange={set("username")}
          className={inputCls}
          placeholder="Ej: jperez"
          autoComplete="off"
        />
      </Field>

      <Field label="Correo electrónico *">
        <input
          type="email"
          value={values.email}
          onChange={set("email")}
          className={inputCls}
          placeholder="correo@ejemplo.com"
          autoComplete="off"
        />
      </Field>

      <Field label="Contraseña inicial *">
        <input
          type="password"
          value={values.contraseña}
          onChange={set("contraseña")}
          className={inputCls}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
        />
      </Field>

      <Field label="Rol del sistema *">
        <select value={values.rol} onChange={set("rol")} className={inputCls}>
          <option value="">Seleccionar rol...</option>
          {ROLES.map(r => (
            <option key={r} value={r}>{ROL_LABELS[r]}</option>
          ))}
        </select>
      </Field>
    </div>
  )
}
