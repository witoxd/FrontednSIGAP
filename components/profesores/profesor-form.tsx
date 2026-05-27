"use client"

import { useState, useEffect } from "react"
import { Loader2, Users, Briefcase, GraduationCap, Phone, AlertCircle, Plus, Trash2 } from "lucide-react"
import { PersonaForm, type PersonaFormData } from "@/components/personas/persona-form"
import { ContactoManager } from "@/components/shared/contactos/contacto-manager"
import { profesoresApi }   from "@/lib/api/services/profesores"
import { profesorContactoEmergenciaApi } from "@/lib/api/services/profesorContactoEmergencia"
import { jornadasApi } from "@/lib/api/services/jornadas"
import { decretosApi } from "@/lib/api/services/decretos"
import { gradosEscalafonApi } from "@/lib/api/services/gradosEscalafon"
import type { ProfesorWitchPersonaDocumento, Persona, Jornada, Decreto, GradoEscalafon } from "@/lib/types"
import { toast } from "sonner"

// ── Tipos internos ────────────────────────────────────────────────────────────

interface ProfesorFormData {
  decreto_id:         number
  grado_escalafon_id: number
  sede:               string
  jornada_id:         number
  tipo_contrato:      string
  area:               string
  fecha_nombramiento: string
  numero_resolucion:  string
  titulo:             string
  posgrado:           string
  perfil_profesional: string
}

interface ContactoData {
  tipo_contacto: "telefono" | "celular" | "email" | "direccion" | "otro"
  valor: string
  es_principal: boolean
}

interface ContactoEmergenciaData {
  nombre: string
  parentesco: string
  telefono: string
  celular: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"

const labelClass = "text-sm font-medium text-foreground"

function Campo({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelClass}>
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function SeccionHeader({ icon: Icon, title, locked, lockedMsg }: {
  icon: React.ElementType; title: string; locked?: boolean; lockedMsg?: string
}) {
  return (
    <div className="flex items-center gap-2 pb-1">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {locked && (
        <span className="ml-2 text-xs text-muted-foreground">— {lockedMsg}</span>
      )}
    </div>
  )
}

function personaFromApi(p: ProfesorWitchPersonaDocumento): PersonaFormData {
  const per = p.persona as any
  return {
    nombres:               per.nombres            ?? "",
    apellido_paterno:      per.apellido_paterno   ?? "",
    apellido_materno:      per.apellido_materno   ?? "",
    tipo_documento_id:     per.tipo_documento?.tipo_documento_id ?? 0,
    numero_documento:      per.numero_documento   ?? "",
    fecha_nacimiento:      per.fecha_nacimiento?.split("T")[0] ?? "",
    genero:                per.genero             ?? "Masculino",
    grupo_sanguineo:       per.grupo_sanguineo,
    grupo_etnico:          per.grupo_etnico,
    credo_religioso:       per.credo_religioso,
    lugar_nacimiento:      per.lugar_nacimiento,
    expedida_en:           per.expedida_en,
    serial_registro_civil: per.serial_registro_civil,
  }
}

function profesorFromApi(p: ProfesorWitchPersonaDocumento): ProfesorFormData {
  const d = p.docente as any
  return {
    decreto_id:         d.decreto_id         ?? 0,
    grado_escalafon_id: d.grado_escalafon_id ?? 0,
    sede:               d.sede               ?? "",
    jornada_id:         d.jornada_id         ?? 0,
    tipo_contrato:      d.tipo_contrato      ?? "",
    area:               d.area               ?? "",
    fecha_nombramiento: d.fecha_nombramiento?.split?.("T")[0] ?? "",
    numero_resolucion:  d.numero_resolucion  ?? "",
    titulo:             d.titulo             ?? "",
    posgrado:           d.posgrado           ?? "",
    perfil_profesional: d.perfil_profesional ?? "",
  }
}

const TIPOS_CONTRATO = ["Provisional", "En propiedad", "OPS", "Hora cátedra", "Otro"]
const TIPOS_CONTACTO = ["telefono", "celular", "email", "direccion", "otro"] as const

// ── Props ─────────────────────────────────────────────────────────────────────

interface ProfesorFormProps {
  profesorId?: number
  modo: "crear" | "editar"
  onCancel?: () => void
}

// ── Componente ────────────────────────────────────────────────────────────────

export function ProfesorForm({ profesorId, modo, onCancel }: ProfesorFormProps) {
  modo = profesorId ? "editar" : "crear"

  const [idPersona,  setIdPersona]  = useState<number | null>(null)
  const [idProfesor, setIdProfesor] = useState<number | null>(profesorId ?? null)
  const guardadoCreacion = idPersona !== null

  const [cargandoInicial, setCargandoInicial] = useState(modo === "editar")
  const [guardando,       setGuardando]       = useState(false)
  const [error,           setError]           = useState<string | null>(null)
  const [jornadas,        setJornadas]        = useState<Jornada[]>([])
  const [decretos,        setDecretos]        = useState<Decreto[]>([])
  const [gradosCatalogo,  setGradosCatalogo]  = useState<GradoEscalafon[]>([])
  const [gradosFiltrados, setGradosFiltrados] = useState<GradoEscalafon[]>([])

  useEffect(() => {
    jornadasApi.getAll(100).then((res) => setJornadas(res.data ?? []))
    decretosApi.getAll().then((res) => setDecretos((res.data as any)?.data ?? res.data ?? []))
    gradosEscalafonApi.getAll().then((res) => setGradosCatalogo((res.data as any)?.data ?? res.data ?? []))
  }, [])

  // ── Datos del formulario ─────────────────────────────────────────────────

  const [personaData, setPersonaData] = useState<PersonaFormData>({
    nombres: "", apellido_paterno: "", apellido_materno: "",
    tipo_documento_id: 0, numero_documento: "",
    fecha_nacimiento: "", genero: "Masculino",
    serial_registro_civil: "", grupo_sanguineo: "",
    grupo_etnico: "", credo_religioso: "", lugar_nacimiento: "", expedida_en: "",
  })

  const [profesorData, setProfesorData] = useState<ProfesorFormData>({
    decreto_id: 0, grado_escalafon_id: 0,
    fecha_nombramiento: "", numero_resolucion: "", jornada_id: 0, area: "",
    sede: "", tipo_contrato: "",
    titulo: "", posgrado: "", perfil_profesional: "",
  })

  // Contactos del profesor (solo en creación — en edición usa ContactoManager)
  const [contactos, setContactos] = useState<ContactoData[]>([
    { tipo_contacto: "celular", valor: "", es_principal: true },
  ])

  // Contacto de emergencia
  const [emergencia, setEmergencia] = useState<ContactoEmergenciaData>({
    nombre: "", parentesco: "", telefono: "", celular: "",
  })

  // ── Carga inicial (editar) ────────────────────────────────────────────────

  useEffect(() => {
    if (modo !== "editar" || !profesorId) return
    async function cargar() {
      try {
        const res = await profesoresApi.getById(profesorId!)
        const data = res.data as ProfesorWitchPersonaDocumento
        const pf = profesorFromApi(data)
        setPersonaData(personaFromApi(data))
        setProfesorData(pf)
        setIdPersona((data.persona as any).persona_id)
        setIdProfesor(data.profesor.profesor_id ?? null)
        // Poblar grados filtrados del decreto cargado
        if (pf.decreto_id) {
          gradosEscalafonApi.getByDecretoId(pf.decreto_id)
            .then((res) => setGradosFiltrados((res.data as any)?.data ?? res.data ?? []))
            .catch(() => {})
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar datos")
      } finally {
        setCargandoInicial(false)
      }
    }
    cargar()
  }, [modo, profesorId])

  // ── Contactos helpers ─────────────────────────────────────────────────────

  function agregarContacto() {
    setContactos((prev) => [
      ...prev,
      { tipo_contacto: "telefono", valor: "", es_principal: false },
    ])
  }

  function actualizarContacto(i: number, field: keyof ContactoData, value: any) {
    setContactos((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }

  function eliminarContacto(i: number) {
    setContactos((prev) => {
      const next = prev.filter((_, idx) => idx !== i)
      // si se eliminó el principal, marcar el primero como principal
      if (prev[i].es_principal && next.length > 0) next[0].es_principal = true
      return next
    })
  }

  function marcarPrincipal(i: number) {
    setContactos((prev) => prev.map((c, idx) => ({ ...c, es_principal: idx === i })))
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)

    try {
      if (modo === "crear") {
        // Validación mínima de contactos
        const contactosValidos = contactos.filter((c) => c.valor.trim())
        if (!contactosValidos.length) {
          setError("Agrega al menos un contacto con valor")
          return
        }
        if (!emergencia.nombre.trim() || !emergencia.parentesco.trim() || !emergencia.telefono.trim()) {
          setError("Completa los datos del contacto de emergencia")
          return
        }

        const res = await profesoresApi.create({
          persona:              personaData as Persona,
          profesor:             profesorData,
          contactos:            contactosValidos,
          contacto_emergencia:  {
            nombre:     emergencia.nombre,
            parentesco: emergencia.parentesco,
            telefono:   emergencia.telefono,
            celular:    emergencia.celular || null,
          },
        } as any)

        const data = res.data as any
        setIdPersona(data.persona?.persona_id ?? null)
        setIdProfesor(data.profesor?.profesor_id ?? null)
        toast.success("Profesor creado exitosamente")

      } else {
        await profesoresApi.update(idProfesor!, {
          persona:  personaData as Partial<Persona>,
          profesor: profesorData,
        } as any)
        toast.success("Datos actualizados")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  // ── Render: carga ─────────────────────────────────────────────────────────

  if (cargandoInicial) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ── Render principal ──────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">

      {/* ── § 1 Datos personales ── */}
      <section className="flex flex-col gap-4">
        <SeccionHeader icon={Users} title="Datos personales" />
        <PersonaForm
          data={personaData}
          onChange={setPersonaData}
          disabled={guardando}
          allowSearch={modo === "crear"}
        />
      </section>

      {/* ── § 2 Información laboral ── */}
      <section className="flex flex-col gap-4 border-t border-border pt-6">
        <SeccionHeader icon={Briefcase} title="Información laboral" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <Campo label="Área" required>
            <input required disabled={guardando} value={profesorData.area}
              onChange={(e) => setProfesorData((p) => ({ ...p, area: e.target.value }))}
              className={inputClass} placeholder="Ej: Matemáticas, Ciencias naturales" />
          </Campo>

          <Campo label="Sede" required>
            <input required disabled={guardando} value={profesorData.sede}
              onChange={(e) => setProfesorData((p) => ({ ...p, sede: e.target.value }))}
              className={inputClass} placeholder="Ej: Sede principal" />
          </Campo>

          <Campo label="Tipo de contrato" required>
            <select required disabled={guardando} value={profesorData.tipo_contrato}
              onChange={(e) => setProfesorData((p) => ({ ...p, tipo_contrato: e.target.value }))}
              className={inputClass}
            >
              <option value="">Seleccionar…</option>
              {TIPOS_CONTRATO.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Campo>

          <Campo label="Decreto" required>
            <select
              required disabled={guardando}
              value={profesorData.decreto_id || ""}
              onChange={(e) => {
                const decretoId = Number(e.target.value)
                const filtrados = gradosCatalogo.filter(g => g.decreto_id === decretoId)
                setGradosFiltrados(filtrados)
                setProfesorData((p) => ({ ...p, decreto_id: decretoId, grado_escalafon_id: 0 }))
              }}
              className={inputClass}
            >
              <option value="">Seleccionar decreto…</option>
              {decretos.map((d) => (
                <option key={d.decreto_id} value={d.decreto_id}>{d.nombre}</option>
              ))}
            </select>
          </Campo>

          <Campo label="Grado de escalafón" required>
            <select
              required disabled={guardando || !profesorData.decreto_id}
              value={profesorData.grado_escalafon_id || ""}
              onChange={(e) => setProfesorData((p) => ({ ...p, grado_escalafon_id: Number(e.target.value) }))}
              className={inputClass}
            >
              <option value="">
                {profesorData.decreto_id ? "Seleccionar grado…" : "Primero seleccione un decreto"}
              </option>
              {gradosFiltrados.map((g) => (
                <option key={g.grado_id} value={g.grado_id}>{g.codigo}{g.descripcion ? ` — ${g.descripcion}` : ""}</option>
              ))}
            </select>
          </Campo>

          <Campo label="N° de resolución" required>
            <input required disabled={guardando} value={profesorData.numero_resolucion}
              onChange={(e) => setProfesorData((p) => ({ ...p, numero_resolucion: e.target.value }))}
              className={inputClass} placeholder="N° de resolución de nombramiento" />
          </Campo>

          <Campo label="Jornada" required>
            <select
              required
              disabled={guardando}
              value={profesorData.jornada_id || ""}
              onChange={(e) => setProfesorData((p) => ({ ...p, jornada_id: Number(e.target.value) }))}
              className={inputClass}
            >
              <option value="">Seleccionar jornada…</option>
              {jornadas.map((j) => (
                <option key={j.jornada_id} value={j.jornada_id}>{j.nombre}</option>
              ))}
            </select>
          </Campo>

          <Campo label="Fecha de nombramiento" required>
            <input required type="date" disabled={guardando} value={profesorData.fecha_nombramiento}
              onChange={(e) => setProfesorData((p) => ({ ...p, fecha_nombramiento: e.target.value }))}
              className={inputClass} />
          </Campo>
        </div>
      </section>

      {/* ── § 3 Formación académica ── */}
      <section className="flex flex-col gap-4 border-t border-border pt-6">
        <SeccionHeader icon={GraduationCap} title="Formación académica" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Título profesional">
            <input disabled={guardando} value={profesorData.titulo ?? ""}
              onChange={(e) => setProfesorData((p) => ({ ...p, titulo: e.target.value }))}
              className={inputClass} placeholder="Ej: Licenciado en Matemáticas" />
          </Campo>
          <Campo label="Posgrado">
            <input disabled={guardando} value={profesorData.posgrado ?? ""}
              onChange={(e) => setProfesorData((p) => ({ ...p, posgrado: e.target.value }))}
              className={inputClass} placeholder="Especialización, Maestría, etc." />
          </Campo>
          <div className="sm:col-span-2">
            <Campo label="Perfil profesional">
              <textarea
                disabled={guardando} rows={3}
                value={profesorData.perfil_profesional ?? ""}
                onChange={(e) => setProfesorData((p) => ({ ...p, perfil_profesional: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 resize-none"
                placeholder="Breve descripción del perfil docente…"
              />
            </Campo>
          </div>
        </div>
      </section>

      {/* ── § 4 Contactos (solo en creación) ── */}
      {modo === "crear" && (
        <section className="flex flex-col gap-4 border-t border-border pt-6">
          <SeccionHeader icon={Phone} title="Contactos" />
          <div className="flex flex-col gap-3">
            {contactos.map((c, i) => (
              <div key={i} className="grid grid-cols-[1fr_2fr_auto_auto] gap-2 items-end">
                <Campo label={i === 0 ? "Tipo" : ""}>
                  <select
                    value={c.tipo_contacto} disabled={guardando}
                    onChange={(e) => actualizarContacto(i, "tipo_contacto", e.target.value)}
                    className={inputClass}
                  >
                    {TIPOS_CONTACTO.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Campo>
                <Campo label={i === 0 ? "Valor" : ""}>
                  <input
                    required value={c.valor} disabled={guardando}
                    onChange={(e) => actualizarContacto(i, "valor", e.target.value)}
                    className={inputClass} placeholder="Número / correo / dirección…" />
                </Campo>
                <div className="flex flex-col gap-1.5">
                  {i === 0 && <span className={labelClass}>Principal</span>}
                  <div className="h-10 flex items-center justify-center">
                    <input
                      type="checkbox" checked={c.es_principal} disabled={guardando}
                      onChange={() => marcarPrincipal(i)}
                      className="h-4 w-4 rounded border-input"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  {i === 0 && <span className={labelClass}>&nbsp;</span>}
                  <button type="button" disabled={contactos.length === 1 || guardando}
                    onClick={() => eliminarContacto(i)}
                    className="h-10 w-10 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <button type="button" disabled={guardando} onClick={agregarContacto}
              className="flex items-center gap-1.5 self-start rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar otro contacto
            </button>
          </div>
        </section>
      )}

      {/* Contactos en modo editar — gestión independiente */}
      {modo === "editar" && guardadoCreacion && (
        <section className="flex flex-col gap-4 border-t border-border pt-6">
          <SeccionHeader icon={Phone} title="Contactos" />
          <ContactoManager personaId={idPersona!} />
        </section>
      )}

      {/* ── § 5 Contacto de emergencia (solo en creación) ── */}
      {modo === "crear" && (
        <section className="flex flex-col gap-4 border-t border-border pt-6">
          <SeccionHeader icon={AlertCircle} title="Contacto de emergencia" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo label="Nombre completo" required>
              <input required disabled={guardando} value={emergencia.nombre}
                onChange={(e) => setEmergencia((p) => ({ ...p, nombre: e.target.value }))}
                className={inputClass} placeholder="Nombre del familiar" />
            </Campo>
            <Campo label="Parentesco" required>
              <input required disabled={guardando} value={emergencia.parentesco}
                onChange={(e) => setEmergencia((p) => ({ ...p, parentesco: e.target.value }))}
                className={inputClass} placeholder="Madre, padre, cónyuge…" />
            </Campo>
            <Campo label="Teléfono" required>
              <input required disabled={guardando} value={emergencia.telefono}
                onChange={(e) => setEmergencia((p) => ({ ...p, telefono: e.target.value }))}
                className={inputClass} placeholder="Número de teléfono" />
            </Campo>
            <Campo label="Celular">
              <input disabled={guardando} value={emergencia.celular}
                onChange={(e) => setEmergencia((p) => ({ ...p, celular: e.target.value }))}
                className={inputClass} placeholder="Número de celular (opcional)" />
            </Campo>
          </div>
        </section>
      )}

      {/* Contacto emergencia en editar — gestor separado */}
      {modo === "editar" && idProfesor && (
        <ContactoEmergenciaEditar profesorId={idProfesor} />
      )}

      {/* ── Error + botones ── */}
      {error && (
        <p className="text-sm text-destructive rounded-lg bg-destructive/5 border border-destructive/15 px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={guardando}
            className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
        <button type="submit" disabled={guardando}
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : modo === "crear" ? "Guardar todo" : "Guardar cambios"}
        </button>
      </div>
    </form>
  )
}

// ── Sub-componente: gestión de contactos de emergencia en modo editar ─────────

function ContactoEmergenciaEditar({ profesorId }: { profesorId: number }) {
  const [contactos, setContactos] = useState<any[]>([])
  const [cargando,  setCargando]  = useState(true)
  const [editando,  setEditando]  = useState<number | null>(null)
  const [creando,   setCreando]   = useState(false)
  const [form, setForm] = useState({ nombre: "", parentesco: "", telefono: "", celular: "" })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    profesorContactoEmergenciaApi
      .getByProfesor(profesorId)
      .then((r) => setContactos(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error("Error al cargar contactos de emergencia"))
      .finally(() => setCargando(false))
  }, [profesorId])

  function abrirCrear() {
    setForm({ nombre: "", parentesco: "", telefono: "", celular: "" })
    setCreando(true)
    setEditando(null)
  }

  function abrirEditar(c: any) {
    setForm({ nombre: c.nombre, parentesco: c.parentesco, telefono: c.telefono, celular: c.celular ?? "" })
    setEditando(c.contacto_emergencia_id)
    setCreando(false)
  }

  async function guardar() {
    if (!form.nombre.trim() || !form.parentesco.trim() || !form.telefono.trim()) {
      toast.error("Nombre, parentesco y teléfono son obligatorios")
      return
    }
    setGuardando(true)
    try {
      const payload = { ...form, celular: form.celular || null }
      if (creando) {
        const r = await profesorContactoEmergenciaApi.create(profesorId, payload as any)
        setContactos((prev) => [...prev, r.data])
      } else if (editando) {
        const r = await profesorContactoEmergenciaApi.update(profesorId, editando, payload as any)
        setContactos((prev) => prev.map((c) => c.contacto_emergencia_id === editando ? r.data : c))
      }
      setCreando(false)
      setEditando(null)
      toast.success("Guardado")
    } catch {
      toast.error("Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(id: number) {
    try {
      await profesorContactoEmergenciaApi.delete(profesorId, id)
      setContactos((prev) => prev.filter((c) => c.contacto_emergencia_id !== id))
      toast.success("Contacto eliminado")
    } catch {
      toast.error("Error al eliminar")
    }
  }

  const inputCls = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"

  return (
    <section className="flex flex-col gap-4 border-t border-border pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Contactos de emergencia</h3>
        </div>
        {!creando && !editando && (
          <button type="button" onClick={abrirCrear}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Agregar
          </button>
        )}
      </div>

      {cargando ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <>
          {contactos.map((c) => (
            editando === c.contacto_emergencia_id ? (
              <FormEmergencia key={c.contacto_emergencia_id} form={form} setForm={setForm}
                guardando={guardando} onGuardar={guardar}
                onCancelar={() => setEditando(null)} inputCls={inputCls} />
            ) : (
              <div key={c.contacto_emergencia_id}
                className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{c.nombre}</p>
                  <p className="text-xs text-muted-foreground">{c.parentesco} · {c.telefono}{c.celular ? ` · ${c.celular}` : ""}</p>
                </div>
                <button type="button" onClick={() => abrirEditar(c)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors">Editar</button>
                <button type="button" onClick={() => eliminar(c.contacto_emergencia_id)}
                  className="text-xs text-destructive hover:text-destructive/80 transition-colors">Eliminar</button>
              </div>
            )
          ))}

          {creando && (
            <FormEmergencia form={form} setForm={setForm} guardando={guardando}
              onGuardar={guardar} onCancelar={() => setCreando(false)} inputCls={inputCls} />
          )}
        </>
      )}
    </section>
  )
}

function FormEmergencia({ form, setForm, guardando, onGuardar, onCancelar, inputCls }: any) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input placeholder="Nombre *" value={form.nombre} disabled={guardando}
          onChange={(e) => setForm((p: any) => ({ ...p, nombre: e.target.value }))}
          className={inputCls} />
        <input placeholder="Parentesco *" value={form.parentesco} disabled={guardando}
          onChange={(e) => setForm((p: any) => ({ ...p, parentesco: e.target.value }))}
          className={inputCls} />
        <input placeholder="Teléfono *" value={form.telefono} disabled={guardando}
          onChange={(e) => setForm((p: any) => ({ ...p, telefono: e.target.value }))}
          className={inputCls} />
        <input placeholder="Celular (opcional)" value={form.celular} disabled={guardando}
          onChange={(e) => setForm((p: any) => ({ ...p, celular: e.target.value }))}
          className={inputCls} />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancelar} disabled={guardando}
          className="h-8 rounded-lg border border-border px-3 text-xs text-foreground hover:bg-muted transition-colors disabled:opacity-50">
          Cancelar
        </button>
        <button type="button" onClick={onGuardar} disabled={guardando}
          className="h-8 flex items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {guardando ? <Loader2 className="h-3 w-3 animate-spin" /> : "Guardar"}
        </button>
      </div>
    </div>
  )
}
