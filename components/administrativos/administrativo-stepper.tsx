"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Check, Users, Briefcase, GraduationCap, Phone, UserPlus, Search, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"

import { PersonaForm, type PersonaFormData } from "@/components/personas/persona-form"
import { ContactoManager } from "@/components/shared/contactos/contacto-manager"
import { ArchivoUploader } from "@/components/shared/archivos/archivo-uploader"
import { administrativosApi } from "@/lib/api/services/administrativos"
import { profesoresApi } from "@/lib/api/services/profesores"
import { jornadasApi } from "@/lib/api/services/jornadas"
import { decretosApi } from "@/lib/api/services/decretos"
import { gradosEscalafonApi } from "@/lib/api/services/gradosEscalafon"
import { swrFetcher } from "@/lib/api/fetcher"
import type { Jornada, Decreto, GradoEscalafon, AdministrativoWithPersonaDocumento } from "@/lib/types"

// ── Constantes ────────────────────────────────────────────────────────────────

type ModoPersona = "nueva" | "existente" | null
type Paso = 0 | 1 | 2 | 3 | 4

const PASOS = [
  { label: "Persona"         },
  { label: "Datos laborales" },
  { label: "Formación"       },
  { label: "Contactos"       },
  { label: "Finalizar"       },
]

const TIPOS_CONTRATO  = ["Provisional", "En propiedad", "OPS", "Hora cátedra", "Otro"]
const TIPOS_CONTACTO  = ["telefono", "celular", "email", "direccion", "otro"] as const

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface AdminLaboralData {
  cargo:               string
  area:                string
  sede:                string
  jornada_id:          number
  tipo_contrato:       string
  decreto_id:          number
  grado_escalafon_id:  number
  fecha_nombramiento:  string
  numero_resolucion:   string
}

interface AdminFormacionData {
  titulo:             string
  posgrado:           string
  perfil_profesional: string
}

interface ContactoData {
  tipo_contacto: "telefono" | "celular" | "email" | "direccion" | "otro"
  valor:         string
  es_principal:  boolean
}

// ── Helpers de UI ─────────────────────────────────────────────────────────────

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"

function Campo({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function formatFechaCorta(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

// ── Helpers de datos ──────────────────────────────────────────────────────────

function personaFormVacio(): PersonaFormData {
  return {
    nombres: "", apellido_paterno: "", apellido_materno: "",
    tipo_documento_id: 0, numero_documento: "",
    fecha_nacimiento: "", genero: "Masculino",
    serial_registro_civil: "", grupo_sanguineo: "",
    grupo_etnico: "", credo_religioso: "", lugar_nacimiento: "", expedida_en: "",
  }
}

function laboralVacio(): AdminLaboralData {
  return {
    cargo: "", area: "", sede: "", jornada_id: 0, tipo_contrato: "",
    decreto_id: 0, grado_escalafon_id: 0, fecha_nombramiento: "", numero_resolucion: "",
  }
}

function formacionVacio(): AdminFormacionData {
  return { titulo: "", posgrado: "", perfil_profesional: "" }
}

// ── Resumen ───────────────────────────────────────────────────────────────────

function ResumenAdministrativo({
  personaData, laboralData, formacionData, contactos, jornadas, decretos, gradosCatalogo,
}: {
  personaData:   PersonaFormData
  laboralData:   AdminLaboralData
  formacionData: AdminFormacionData
  contactos:     ContactoData[]
  jornadas:      Jornada[]
  decretos:      Decreto[]
  gradosCatalogo: GradoEscalafon[]
}) {
  const jornadaLabel = jornadas.find((j) => j.jornada_id === laboralData.jornada_id)?.nombre ?? "—"
  const decretoLabel = decretos.find((d) => d.decreto_id === laboralData.decreto_id)?.nombre ?? "—"
  const gradoLabel   = gradosCatalogo.find((g) => g.grado_id === laboralData.grado_escalafon_id)?.codigo ?? "—"

  const filas: [string, string][] = [
    ["Cargo",         laboralData.cargo          || "—"],
    ["Área",          laboralData.area           || "—"],
    ["Sede",          laboralData.sede           || "—"],
    ["Contrato",      laboralData.tipo_contrato  || "—"],
    ["Jornada",       jornadaLabel],
    ["Decreto",       decretoLabel],
    ["Grado",         gradoLabel],
    ["Resolución",    laboralData.numero_resolucion || "—"],
    ["Nombramiento",  laboralData.fecha_nombramiento ? formatFechaCorta(laboralData.fecha_nombramiento) : "—"],
  ]

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm space-y-3">
      <div>
        <p className="font-semibold text-foreground">
          {[personaData.apellido_paterno, personaData.apellido_materno].filter(Boolean).join(" ")},{" "}
          {personaData.nombres}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Doc. {personaData.numero_documento}
          {personaData.fecha_nacimiento && ` · Nacido: ${formatFechaCorta(personaData.fecha_nacimiento)}`}
        </p>
      </div>
      <div className="border-t border-border pt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        {filas.map(([label, val]) => (
          <React.Fragment key={label}>
            <span className="text-muted-foreground">{label}:</span>
            <span className="text-foreground">{val}</span>
          </React.Fragment>
        ))}
      </div>
      {(formacionData.titulo || formacionData.posgrado) && (
        <div className="border-t border-border pt-3 text-xs text-muted-foreground">
          {formacionData.titulo && <span>Título: {formacionData.titulo}</span>}
          {formacionData.titulo && formacionData.posgrado && <span> · </span>}
          {formacionData.posgrado && <span>Posgrado: {formacionData.posgrado}</span>}
        </div>
      )}
      <div className="border-t border-border pt-3 text-xs text-muted-foreground">
        {contactos.filter(c => c.valor.trim()).length} contacto(s)
      </div>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface AdministrativoStepperProps {
  modo: "crear" | "editar"
  administrativoId?: number
}

// ── Componente principal ──────────────────────────────────────────────────────

export function AdministrativoStepper({ modo, administrativoId }: AdministrativoStepperProps) {
  const router = useRouter()

  // ── Navegación ────────────────────────────────────────────────────────────
  const [modoPersona, setModoPersona] = useState<ModoPersona>(modo === "editar" ? "existente" : null)
  const [pasoActivo, setPasoActivo]   = useState<Paso>(0)
  const [idInterno, setIdInterno]     = useState<number | null>(administrativoId ?? null)
  const [personaIdInterno, setPersonaIdInterno] = useState<number | null>(null)
  const [esProfesorExistente, setEsProfesorExistente] = useState(false)

  const [creadoExitoso, setCreadoExitoso]         = useState(false)
  const [hayTiposDocumento, setHayTiposDocumento] = useState<boolean | null>(null)

  // ── Estado ────────────────────────────────────────────────────────────────
  const [cargandoInicial, setCargandoInicial] = useState(modo === "editar")
  const [guardando, setGuardando]             = useState(false)
  const [error, setError]                     = useState<string | null>(null)

  // ── Datos del formulario ──────────────────────────────────────────────────
  const [personaData,   setPersonaData]   = useState<PersonaFormData>(personaFormVacio())
  const [laboralData,   setLaboralData]   = useState<AdminLaboralData>(laboralVacio())
  const [formacionData, setFormacionData] = useState<AdminFormacionData>(formacionVacio())

  const [contactos, setContactos] = useState<ContactoData[]>([
    { tipo_contacto: "celular", valor: "", es_principal: true },
  ])

  // ── Catálogos ─────────────────────────────────────────────────────────────
  const [jornadas,        setJornadas]        = useState<Jornada[]>([])
  const [decretos,        setDecretos]        = useState<Decreto[]>([])
  const [gradosCatalogo,  setGradosCatalogo]  = useState<GradoEscalafon[]>([])
  const [gradosFiltrados, setGradosFiltrados] = useState<GradoEscalafon[]>([])

  useEffect(() => {
    jornadasApi.getAll(100).then((res) => setJornadas(res.data ?? []))
    decretosApi.getAll().then((res) => setDecretos((res.data as any)?.data ?? res.data ?? []))
    gradosEscalafonApi.getAll().then((res) => setGradosCatalogo((res.data as any)?.data ?? res.data ?? []))
  }, [])

  // ── Fetch tipos de archivo ────────────────────────────────────────────────
  const swrTiposKey = modo === "crear" && personaIdInterno
    ? `/tipos-archivos/getByRol/administrativo`
    : null
  const { data: tiposRes } = useSWR(swrTiposKey, swrFetcher)

  useEffect(() => {
    if (tiposRes !== undefined) {
      const n = ((tiposRes as any)?.data as any[])?.filter((t: any) => t.activo !== false).length ?? 0
      setHayTiposDocumento(n > 0)
    }
  }, [tiposRes])

  // ── Carga inicial (modo editar) ───────────────────────────────────────────
  useEffect(() => {
    if (modo !== "editar" || !administrativoId) return
    async function cargar() {
      try {
        const res  = await administrativosApi.getById(administrativoId!)
        const data = res.data as AdministrativoWithPersonaDocumento
        const per  = data.persona as any
        const doc  = data.docente as any

        setPersonaData({
          nombres:               per.nombres               ?? "",
          apellido_paterno:      per.apellido_paterno       ?? "",
          apellido_materno:      per.apellido_materno       ?? "",
          tipo_documento_id:     per.tipo_documento?.tipo_documento_id ?? 0,
          numero_documento:      per.numero_documento       ?? "",
          fecha_nacimiento:      per.fecha_nacimiento?.split("T")[0] ?? "",
          genero:                per.genero                 ?? "Masculino",
          grupo_sanguineo:       per.grupo_sanguineo,
          grupo_etnico:          per.grupo_etnico,
          credo_religioso:       per.credo_religioso,
          lugar_nacimiento:      per.lugar_nacimiento,
          expedida_en:           per.expedida_en,
          serial_registro_civil: per.serial_registro_civil,
        })
        setLaboralData({
          cargo:              data.administrativo.cargo        ?? "",
          area:               doc.area                         ?? "",
          sede:               doc.sede                         ?? "",
          jornada_id:         doc.jornada_id                   ?? 0,
          tipo_contrato:      doc.tipo_contrato                ?? "",
          decreto_id:         doc.decreto_id                   ?? 0,
          grado_escalafon_id: doc.grado_escalafon_id           ?? 0,
          fecha_nombramiento: doc.fecha_nombramiento?.split?.("T")[0] ?? "",
          numero_resolucion:  doc.numero_resolucion             ?? "",
        })
        setFormacionData({
          titulo:             doc.titulo             ?? "",
          posgrado:           doc.posgrado           ?? "",
          perfil_profesional: doc.perfil_profesional ?? "",
        })
        setPersonaIdInterno(per.persona_id)
        setIdInterno(data.administrativo.administrativo_id ?? null)

        if (doc.decreto_id) {
          gradosEscalafonApi.getByDecretoId(doc.decreto_id)
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
  }, [modo, administrativoId])

  // ── Detectar si la persona es profesor ───────────────────────────────────

  async function detectarRolProfesor(numeroDocumento: string) {
    if (!numeroDocumento.trim()) return
    try {
      const res   = await profesoresApi.searchIndex(numeroDocumento)
      const lista = Array.isArray(res.data) ? res.data : res.data ? [res.data] : []
      if (lista.length > 0) {
        const match = lista[0] as any
        setEsProfesorExistente(true)
        setLaboralData((prev) => ({
          ...prev,
          sede:               match.docente?.sede               ?? prev.sede,
          jornada_id:         match.docente?.jornada_id         ?? prev.jornada_id,
          tipo_contrato:      match.docente?.tipo_contrato      ?? prev.tipo_contrato,
          decreto_id:         match.docente?.decreto_id         ?? prev.decreto_id,
          grado_escalafon_id: match.docente?.grado_escalafon_id ?? prev.grado_escalafon_id,
          area:               match.docente?.area               ?? prev.area,
          fecha_nombramiento: match.docente?.fecha_nombramiento?.split?.("T")[0] ?? prev.fecha_nombramiento,
          numero_resolucion:  match.docente?.numero_resolucion  ?? prev.numero_resolucion,
        }))
        setFormacionData((prev) => ({
          titulo:             match.docente?.titulo             ?? prev.titulo,
          posgrado:           match.docente?.posgrado           ?? prev.posgrado,
          perfil_profesional: match.docente?.perfil_profesional ?? prev.perfil_profesional,
        }))
        if (match.docente?.decreto_id) {
          setGradosFiltrados(gradosCatalogo.filter((g) => g.decreto_id === match.docente.decreto_id))
        }
      } else {
        setEsProfesorExistente(false)
      }
    } catch { /* silencioso */ }
  }

  // ── Validaciones por paso ─────────────────────────────────────────────────

  function validarPaso0(): string | null {
    if (!personaData.nombres.trim())           return "El nombre es obligatorio"
    if (!personaData.tipo_documento_id)        return "Selecciona un tipo de documento"
    if (!personaData.numero_documento.trim())  return "El número de documento es obligatorio"
    if (!personaData.fecha_nacimiento)         return "La fecha de nacimiento es obligatoria"
    if (!["Masculino", "Femenino", "Otro"].includes(personaData.genero)) return "Selecciona un género válido"
    return null
  }

  function validarPaso1(): string | null {
    if (!laboralData.cargo.trim()) return "El cargo es obligatorio"
    return null
  }

  function validarPaso3(): string | null {
    if (!contactos.filter((c) => c.valor.trim()).length) return "Agrega al menos un contacto con valor"
    return null
  }

  // ── Helpers de contactos ──────────────────────────────────────────────────

  function agregarContacto() {
    setContactos((prev) => [...prev, { tipo_contacto: "telefono", valor: "", es_principal: false }])
  }

  function actualizarContacto(i: number, field: keyof ContactoData, value: any) {
    setContactos((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }

  function eliminarContacto(i: number) {
    setContactos((prev) => {
      const next = prev.filter((_, idx) => idx !== i)
      if (prev[i].es_principal && next.length > 0) next[0].es_principal = true
      return next
    })
  }

  function marcarPrincipal(i: number) {
    setContactos((prev) => prev.map((c, idx) => ({ ...c, es_principal: idx === i })))
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleAvanzar(siguientePaso: Paso) {
    setError(null)
    if (modo === "crear") {
      if (pasoActivo === 0) { const e = validarPaso0(); if (e) { setError(e); return } }
      if (pasoActivo === 1) { const e = validarPaso1(); if (e) { setError(e); return } }
      // paso 2 (formación): sin campos requeridos
      if (pasoActivo === 3) { const e = validarPaso3(); if (e) { setError(e); return } }
    }
    setPasoActivo(siguientePaso)
  }

  async function handleGuardarYAvanzar(siguientePaso: Paso) {
    if (modo !== "editar" || !idInterno) { setPasoActivo(siguientePaso); return }
    setGuardando(true); setError(null)
    try {
      await administrativosApi.update(idInterno, {
        persona:        personaData as any,
        administrativo: { ...laboralData, ...formacionData },
      } as any)
      toast.success("Datos actualizados")
      setPasoActivo(siguientePaso)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally { setGuardando(false) }
  }

  async function handleCrearAdmin() {
    setGuardando(true); setError(null)
    try {
      const res = await administrativosApi.create({
        persona:        personaData as any,
        administrativo: { ...laboralData, ...formacionData },
        contactos:      contactos.filter((c) => c.valor.trim()),
      } as any)

      const data = res.data as any
      const nuevoId        = data.administrativo?.administrativo_id
      const nuevoPersonaId = data.persona?.persona_id

      if (!nuevoId) throw new Error("El servidor no devolvió el ID del administrativo")

      setIdInterno(nuevoId)
      setPersonaIdInterno(nuevoPersonaId ?? null)
      setCreadoExitoso(true)
      toast.success(
        esProfesorExistente
          ? "Rol administrativo asignado al profesor existente"
          : "Administrativo creado correctamente"
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el administrativo")
    } finally { setGuardando(false) }
  }

  // ── Render: carga ─────────────────────────────────────────────────────────

  if (cargandoInicial) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ── Pantalla selector ─────────────────────────────────────────────────────

  if (modo === "crear" && modoPersona === null) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-8">
          <h2 className="text-lg font-semibold text-foreground mb-2">¿Cómo deseas registrar al administrativo?</h2>
          <p className="text-sm text-muted-foreground mb-8">
            Puedes crear una persona nueva o vincular a alguien ya registrado en el sistema.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button type="button"
              onClick={() => { setModoPersona("nueva"); setPasoActivo(0) }}
              className="flex flex-col items-start gap-3 rounded-xl border-2 border-border bg-background p-6 text-left hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Persona nueva</p>
                <p className="text-xs text-muted-foreground mt-1">Registrar a alguien que no está en el sistema</p>
              </div>
            </button>
            <button type="button"
              onClick={() => { setModoPersona("existente"); setPasoActivo(0) }}
              className="flex flex-col items-start gap-3 rounded-xl border-2 border-border bg-background p-6 text-left hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Search className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Persona ya registrada</p>
                <p className="text-xs text-muted-foreground mt-1">Vincular a alguien existente en el sistema</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Render principal ──────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* ── Barra de pasos ── */}
      <nav aria-label="Pasos del formulario">
        <ol className="flex items-center gap-0">
          {PASOS.map((paso, idx) => {
            const activo     = pasoActivo === idx
            const completado = pasoActivo > idx
            return (
              <li key={idx} className="flex items-center flex-1 last:flex-none">
                <button type="button" onClick={() => setPasoActivo(idx as Paso)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors
                    ${activo ? "text-primary" : ""}
                    ${completado && !activo ? "text-success" : ""}
                    ${!activo && !completado ? "text-muted-foreground hover:text-foreground" : ""}
                  `}>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2 transition-colors
                    ${activo ? "border-primary bg-primary text-primary-foreground" : ""}
                    ${completado && !activo ? "border-success bg-success text-success-foreground" : ""}
                    ${!activo && !completado ? "border-muted-foreground text-muted-foreground" : ""}
                  `}>
                    {completado && !activo ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                  </span>
                  <span className="hidden sm:inline">{paso.label}</span>
                </button>
                {idx < PASOS.length - 1 && (
                  <div className={`h-px flex-1 mx-3 transition-colors ${completado ? "bg-success" : "bg-border"}`} />
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* ── Error global ── */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PASO 0 — Persona
      ══════════════════════════════════════════════════════════════════════ */}
      {pasoActivo === 0 && (
        <div className="space-y-6">
          {esProfesorExistente && (
            <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3">
              <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center mt-0.5 shrink-0">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Esta persona ya está registrada como <strong>profesor</strong>. Sus datos laborales se pre-cargarán.
              </p>
            </div>
          )}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">Datos de la persona</h2>
              {modoPersona === "existente" && (
                <span className="ml-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Buscar persona existente
                </span>
              )}
            </div>
            <PersonaForm
              data={personaData}
              onChange={(data) => {
                setPersonaData(data)
                if (modoPersona === "existente" && data.numero_documento !== personaData.numero_documento) {
                  detectarRolProfesor(data.numero_documento)
                }
              }}
              disabled={guardando}
              allowSearch={modoPersona === "existente" || modo === "crear"}
            />
          </div>
          <div className="flex items-center justify-between">
            {modo === "crear" && (
              <button type="button" onClick={() => setModoPersona(null)}
                className="h-10 px-4 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors">
                ← Cambiar tipo
              </button>
            )}
            {modo === "editar" && <div />}
            <button type="button"
              onClick={() => modo === "crear" ? handleAvanzar(1) : handleGuardarYAvanzar(1)}
              disabled={guardando}
              className="flex items-center gap-2 h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors ml-auto">
              {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Siguiente →"}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PASO 1 — Datos laborales
      ══════════════════════════════════════════════════════════════════════ */}
      {pasoActivo === 1 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">Datos laborales</h2>
              {esProfesorExistente && (
                <span className="ml-2 text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  Pre-cargado del registro de profesor
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo label="Cargo" required>
                <input required disabled={guardando} value={laboralData.cargo}
                  onChange={(e) => setLaboralData((d) => ({ ...d, cargo: e.target.value }))}
                  className={inputClass} placeholder="Ej: Secretaria, Rector, Coordinador…" />
              </Campo>
              <Campo label="Área">
                <input disabled={guardando} value={laboralData.area}
                  onChange={(e) => setLaboralData((d) => ({ ...d, area: e.target.value }))}
                  className={inputClass} placeholder="Ej: Coordinación académica" />
              </Campo>
              <Campo label="Sede">
                <input disabled={guardando} value={laboralData.sede}
                  onChange={(e) => setLaboralData((d) => ({ ...d, sede: e.target.value }))}
                  className={inputClass} placeholder="Ej: Sede principal" />
              </Campo>
              <Campo label="Tipo de contrato">
                <select disabled={guardando} value={laboralData.tipo_contrato}
                  onChange={(e) => setLaboralData((d) => ({ ...d, tipo_contrato: e.target.value }))}
                  className={inputClass}>
                  <option value="">Seleccionar…</option>
                  {TIPOS_CONTRATO.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Campo>
              <Campo label="Decreto">
                <select disabled={guardando} value={laboralData.decreto_id || ""}
                  onChange={(e) => {
                    const id = Number(e.target.value)
                    setGradosFiltrados(gradosCatalogo.filter((g) => g.decreto_id === id))
                    setLaboralData((d) => ({ ...d, decreto_id: id, grado_escalafon_id: 0 }))
                  }}
                  className={inputClass}>
                  <option value="">Seleccionar decreto…</option>
                  {decretos.map((d) => <option key={d.decreto_id} value={d.decreto_id}>{d.nombre}</option>)}
                </select>
              </Campo>
              <Campo label="Grado de escalafón">
                <select disabled={guardando || !laboralData.decreto_id}
                  value={laboralData.grado_escalafon_id || ""}
                  onChange={(e) => setLaboralData((d) => ({ ...d, grado_escalafon_id: Number(e.target.value) }))}
                  className={inputClass}>
                  <option value="">{laboralData.decreto_id ? "Seleccionar grado…" : "Primero seleccione un decreto"}</option>
                  {gradosFiltrados.map((g) => (
                    <option key={g.grado_id} value={g.grado_id}>
                      {g.codigo}{g.descripcion ? ` — ${g.descripcion}` : ""}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Jornada">
                <select disabled={guardando} value={laboralData.jornada_id || ""}
                  onChange={(e) => setLaboralData((d) => ({ ...d, jornada_id: Number(e.target.value) }))}
                  className={inputClass}>
                  <option value="">Seleccionar jornada…</option>
                  {jornadas.map((j) => <option key={j.jornada_id} value={j.jornada_id}>{j.nombre}</option>)}
                </select>
              </Campo>
              <Campo label="N° de resolución">
                <input disabled={guardando} value={laboralData.numero_resolucion}
                  onChange={(e) => setLaboralData((d) => ({ ...d, numero_resolucion: e.target.value }))}
                  className={inputClass} placeholder="N° de resolución de nombramiento" />
              </Campo>
              <Campo label="Fecha de nombramiento">
                <input type="date" disabled={guardando} value={laboralData.fecha_nombramiento}
                  onChange={(e) => setLaboralData((d) => ({ ...d, fecha_nombramiento: e.target.value }))}
                  className={inputClass} />
              </Campo>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setPasoActivo(0)} disabled={guardando}
              className="h-10 px-4 rounded-lg border border-border text-sm text-foreground hover:bg-muted disabled:opacity-50 transition-colors">
              ← Anterior
            </button>
            <button type="button"
              onClick={() => modo === "crear" ? handleAvanzar(2) : handleGuardarYAvanzar(2)}
              disabled={guardando}
              className="flex items-center gap-2 h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Siguiente →"}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PASO 2 — Formación académica
      ══════════════════════════════════════════════════════════════════════ */}
      {pasoActivo === 2 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">Formación académica</h2>
              <span className="text-xs text-muted-foreground ml-1">(opcional)</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo label="Título profesional">
                <input disabled={guardando} value={formacionData.titulo}
                  onChange={(e) => setFormacionData((d) => ({ ...d, titulo: e.target.value }))}
                  className={inputClass} placeholder="Ej: Licenciado en Matemáticas" />
              </Campo>
              <Campo label="Posgrado">
                <input disabled={guardando} value={formacionData.posgrado}
                  onChange={(e) => setFormacionData((d) => ({ ...d, posgrado: e.target.value }))}
                  className={inputClass} placeholder="Especialización, Maestría…" />
              </Campo>
              <div className="sm:col-span-2">
                <Campo label="Perfil profesional">
                  <textarea disabled={guardando} rows={3}
                    value={formacionData.perfil_profesional}
                    onChange={(e) => setFormacionData((d) => ({ ...d, perfil_profesional: e.target.value }))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 resize-none"
                    placeholder="Breve descripción del perfil…" />
                </Campo>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setPasoActivo(1)} disabled={guardando}
              className="h-10 px-4 rounded-lg border border-border text-sm text-foreground hover:bg-muted disabled:opacity-50 transition-colors">
              ← Anterior
            </button>
            <button type="button"
              onClick={() => modo === "crear" ? handleAvanzar(3) : handleGuardarYAvanzar(3)}
              disabled={guardando}
              className="flex items-center gap-2 h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Siguiente →"}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PASO 3 — Contactos
          Modo crear: inputs directos
          Modo editar: ContactoManager independiente
      ══════════════════════════════════════════════════════════════════════ */}
      {pasoActivo === 3 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">Contactos</h2>
            </div>

            {modo === "crear" ? (
              <div className="flex flex-col gap-3">
                {contactos.map((c, i) => (
                  <div key={i} className="grid grid-cols-[1fr_2fr_auto_auto] gap-2 items-end">
                    <div className="flex flex-col gap-1.5">
                      {i === 0 && <label className="text-sm font-medium text-foreground">Tipo</label>}
                      <select value={c.tipo_contacto} disabled={guardando}
                        onChange={(e) => actualizarContacto(i, "tipo_contacto", e.target.value as any)}
                        className={inputClass}>
                        {TIPOS_CONTACTO.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {i === 0 && <label className="text-sm font-medium text-foreground">Valor</label>}
                      <input value={c.valor} disabled={guardando}
                        onChange={(e) => actualizarContacto(i, "valor", e.target.value)}
                        className={inputClass} placeholder="Número / correo / dirección…" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {i === 0 && <label className="text-sm font-medium text-foreground">Principal</label>}
                      <div className="h-10 flex items-center justify-center">
                        <input type="checkbox" checked={c.es_principal} disabled={guardando}
                          onChange={() => marcarPrincipal(i)}
                          className="h-4 w-4 rounded border-input" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {i === 0 && <label className="text-sm font-medium text-foreground">&nbsp;</label>}
                      <button type="button" disabled={contactos.length === 1 || guardando}
                        onClick={() => eliminarContacto(i)}
                        className="h-10 w-10 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors disabled:opacity-30">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" disabled={guardando} onClick={agregarContacto}
                  className="flex items-center gap-1.5 self-start rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Plus className="h-3.5 w-3.5" /> Agregar otro contacto
                </button>
              </div>
            ) : (
              personaIdInterno && <ContactoManager personaId={personaIdInterno} />
            )}
          </div>

          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setPasoActivo(2)} disabled={guardando}
              className="h-10 px-4 rounded-lg border border-border text-sm text-foreground hover:bg-muted disabled:opacity-50 transition-colors">
              ← Anterior
            </button>
            <button type="button"
              onClick={() => modo === "crear" ? handleAvanzar(4) : setPasoActivo(4)}
              disabled={guardando}
              className="flex items-center gap-2 h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Siguiente →"}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PASO 4 — Finalizar
          Modo crear: FASE A (resumen + crear) → FASE B (docs + finalizar)
          Modo editar: ArchivoUploader directo
      ══════════════════════════════════════════════════════════════════════ */}
      {pasoActivo === 4 && (
        <div className="space-y-6">

          {/* ── MODO CREAR — FASE A ── */}
          {modo === "crear" && !creadoExitoso && (
            <>
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <h2 className="text-base font-semibold">Confirmar y crear</h2>
                <p className="text-xs text-muted-foreground">
                  Revisa los datos antes de crear el registro. Una vez creado podrás editar cualquier campo.
                </p>
                <ResumenAdministrativo
                  personaData={personaData}
                  laboralData={laboralData}
                  formacionData={formacionData}
                  contactos={contactos}
                  jornadas={jornadas}
                  decretos={decretos}
                  gradosCatalogo={gradosCatalogo}
                />
              </div>
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setPasoActivo(3)} disabled={guardando}
                  className="h-10 px-4 rounded-lg border border-border text-sm text-foreground hover:bg-muted disabled:opacity-50 transition-colors">
                  ← Anterior
                </button>
                <button type="button" onClick={handleCrearAdmin} disabled={guardando}
                  className="flex items-center gap-2 h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {guardando
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Creando…</>
                    : "Crear administrativo →"
                  }
                </button>
              </div>
            </>
          )}

          {/* ── MODO CREAR — FASE B ── */}
          {modo === "crear" && creadoExitoso && (
            <>
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center gap-2 text-success">
                  <Check className="h-5 w-5" />
                  <h2 className="text-base font-semibold text-foreground">Administrativo creado correctamente</h2>
                </div>
                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Documentos del administrativo</h3>
                  {hayTiposDocumento === null && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verificando documentos requeridos…
                    </div>
                  )}
                  {hayTiposDocumento === true && personaIdInterno && (
                    <ArchivoUploader
                      persona_id={personaIdInterno}
                      contexto="administrativo"
                      onSuccess={() => toast.success("Documentos guardados correctamente")}
                      onError={(err) => toast.error(err)}
                    />
                  )}
                  {hayTiposDocumento === false && (
                    <p className="text-sm text-muted-foreground">
                      No hay tipos de documentos configurados para administrativos. Puedes continuar.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => router.push("/dashboard/administrativos")}
                  className="h-10 px-4 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors">
                  Volver a la lista
                </button>
                {idInterno && (
                  <button type="button"
                    onClick={() => router.push(`/dashboard/administrativos/${idInterno}/detalles`)}
                    className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    Ver perfil →
                  </button>
                )}
              </div>
            </>
          )}

          {/* ── MODO EDITAR ── */}
          {modo === "editar" && (
            <>
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <h2 className="text-base font-semibold">Documentos del administrativo</h2>
                {personaIdInterno ? (
                  <ArchivoUploader
                    persona_id={personaIdInterno}
                    contexto="administrativo"
                    onSuccess={() => toast.success("Documentos guardados correctamente")}
                    onError={(err) => toast.error(err)}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Completa los pasos anteriores para habilitar la carga de documentos.
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setPasoActivo(3)}
                  className="h-10 px-4 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors">
                  ← Anterior
                </button>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => router.push("/dashboard/administrativos")}
                    className="h-10 px-4 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors">
                    Volver a la lista
                  </button>
                  {idInterno && (
                    <button type="button"
                      onClick={() => router.push(`/dashboard/administrativos/${idInterno}/detalles`)}
                      className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                      Ver perfil →
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

        </div>
      )}

    </div>
  )
}
