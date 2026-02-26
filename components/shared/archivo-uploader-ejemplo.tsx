"use client"

/**
 * EJEMPLOS DE USO DEL COMPONENTE ArchivoUploader
 * 
 * Este archivo muestra diferentes casos de uso del componente
 * de carga de archivos en distintos contextos.
 */

import { useState } from "react"
import { ArchivoUploader } from "./archivo-uploader"
import { Modal } from "./modal"

// ============================================================================
// EJEMPLO 1: Uso Básico - Solo con persona_id
// ============================================================================

export function EjemploBasico() {
  const [personaId] = useState(123) // Simulando un persona_id existente

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Subir Documentos</h2>
      <ArchivoUploader
        persona_id={personaId}
        onSuccess={(archivos) => {
          console.log("Archivos subidos exitosamente:", archivos)
          alert(`¡Éxito! Se subieron ${archivos.length} archivos`)
        }}
        onError={(error) => {
          console.error("Error al subir archivos:", error)
          alert(`Error: ${error}`)
        }}
      />
    </div>
  )
}

// ============================================================================
// EJEMPLO 2: En Modal - Para agregar documentos a un estudiante existente
// ============================================================================

export function EjemploEnModal() {
  const [mostrarModal, setMostrarModal] = useState(false)
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<{
    estudiante_id: number
    persona_id: number
    nombre: string
  } | null>(null)

  const abrirModalArchivos = (estudiante: {
    estudiante_id: number
    persona_id: number
    nombre: string
  }) => {
    setEstudianteSeleccionado(estudiante)
    setMostrarModal(true)
  }

  return (
    <div>
      {/* Botón para abrir el modal */}
      <button
        onClick={() =>
          abrirModalArchivos({
            estudiante_id: 456,
            persona_id: 789,
            nombre: "Juan Pérez",
          })
        }
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
      >
        Agregar Documentos
      </button>

      {/* Modal con el uploader */}
      <Modal
        isOpen={mostrarModal}
        onClose={() => setMostrarModal(false)}
        title={`Subir documentos - ${estudianteSeleccionado?.nombre}`}
      >
        {estudianteSeleccionado && (
          <ArchivoUploader
            persona_id={estudianteSeleccionado.persona_id}
            onSuccess={(archivos) => {
              alert(`¡Éxito! Se subieron ${archivos.length} archivos`)
              setMostrarModal(false)
            }}
            onError={(error) => {
              alert(`Error: ${error}`)
            }}
            maxFiles={10}
            maxFileSize={5}
          />
        )}
      </Modal>
    </div>
  )
}

// ============================================================================
// EJEMPLO 3: En Formulario de Inscripción - Con tipos requeridos
// ============================================================================

export function EjemploInscripcion() {
  const [paso, setPaso] = useState<"datos" | "documentos">("datos")
  const [personaId, setPersonaId] = useState<number | null>(null)

  // Simulando el paso 1: guardar persona y obtener el persona_id
  const guardarDatosPersonales = async () => {
    // Aquí iría tu lógica para crear la persona
    // const response = await api.post("/personas/create", datos)
    // const nuevoPersonaId = response.data.persona_id
    
    // Simulación:
    const nuevoPersonaId = 999
    setPersonaId(nuevoPersonaId)
    setPaso("documentos")
  }

  if (paso === "datos") {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">
          Paso 1: Datos Personales
        </h2>
        {/* Aquí va tu formulario de datos personales */}
        <button
          onClick={guardarDatosPersonales}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          Continuar a Documentos
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Paso 2: Documentos Requeridos</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Debes subir los siguientes documentos obligatorios:
      </p>
      <ul className="text-sm mb-6 list-disc list-inside text-muted-foreground">
        <li>Certificado de estudios (Tipo ID: 1)</li>
        <li>Fotografía (Tipo ID: 5)</li>
        <li>Diploma de bachillerato (Tipo ID: 2)</li>
      </ul>

      {personaId && (
        <ArchivoUploader
          persona_id={personaId}
          tiposRequeridos={[1, 5, 2]} // IDs de tipos requeridos
          maxFiles={5}
          onSuccess={(archivos) => {
            alert("¡Inscripción completada exitosamente!")
            // Redirigir o mostrar confirmación
          }}
          onError={(error) => {
            alert(`Error: ${error}`)
          }}
        />
      )}
    </div>
  )
}

// ============================================================================
// EJEMPLO 4: Integración en Formulario Existente de Estudiante
// ============================================================================

export function EjemploIntegracionEstudiante() {
  const [mostrarUploader, setMostrarUploader] = useState(false)
  const [personaId, setPersonaId] = useState<number | null>(null)

  const handleCrearEstudiante = async (datos: unknown) => {
    // Simulando creación de estudiante
    // const response = await api.post("/estudiantes/create", datos)
    // setPersonaId(response.data.persona_id)
    
    setPersonaId(123) // Simulación
    setMostrarUploader(true)
  }

  if (!mostrarUploader) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Crear Estudiante</h2>
        {/* Aquí va tu EstudianteForm */}
        <button
          onClick={() => handleCrearEstudiante({})}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          Guardar Estudiante
        </button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <p className="text-sm text-green-800 dark:text-green-200">
          ✓ Estudiante creado exitosamente. Ahora puedes subir sus documentos.
        </p>
      </div>

      <h2 className="text-xl font-bold mb-4">Subir Documentos del Estudiante</h2>

      {personaId && (
        <ArchivoUploader
          persona_id={personaId}
          onSuccess={(archivos) => {
            alert(`Se subieron ${archivos.length} documentos`)
            // Redirigir a la lista de estudiantes
          }}
          onError={(error) => {
            console.error(error)
          }}
        />
      )}

      <button
        onClick={() => {
          // Redirigir sin subir archivos
          alert("Redirígiendo sin subir archivos...")
        }}
        className="mt-4 text-sm text-muted-foreground hover:text-foreground"
      >
        Omitir y continuar
      </button>
    </div>
  )
}

// ============================================================================
// EJEMPLO 5: Para Profesores - Con configuración personalizada
// ============================================================================

export function EjemploProfesor({ profesorPersonaId }: { profesorPersonaId: number }) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">
        Documentos del Profesor
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Sube los documentos requeridos para el expediente del profesor
      </p>

      <ArchivoUploader
        persona_id={profesorPersonaId}
        maxFiles={15}
        maxFileSize={15} // 15MB para documentos más grandes
        onSuccess={(archivos) => {
          console.log("Documentos del profesor subidos:", archivos)
          alert("Documentos subidos correctamente")
        }}
        onError={(error) => {
          console.error("Error:", error)
        }}
        className="border border-border rounded-lg p-4 bg-background"
      />
    </div>
  )
}

// ============================================================================
// EJEMPLO 6: Agregar documentos después de crear la persona
// ============================================================================

export function EjemploFlujoContinuo() {
  const [etapa, setEtapa] = useState<"crear" | "documentos" | "completado">("crear")
  const [personaId, setPersonaId] = useState<number | null>(null)

  const crearPersona = async () => {
    // Simular creación
    setPersonaId(555)
    setEtapa("documentos")
  }

  const omitirDocumentos = () => {
    setEtapa("completado")
  }

  if (etapa === "crear") {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Crear Persona</h2>
        <button onClick={crearPersona} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
          Guardar Persona
        </button>
      </div>
    )
  }

  if (etapa === "documentos") {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold mb-4">
          ¿Deseas agregar documentos ahora?
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Puedes subir documentos ahora o hacerlo más tarde desde el perfil
        </p>

        {personaId && (
          <ArchivoUploader
            persona_id={personaId}
            onSuccess={(archivos) => {
              alert(`${archivos.length} documentos agregados`)
              setEtapa("completado")
            }}
            onError={(error) => {
              console.error(error)
            }}
          />
        )}

        <button
          onClick={omitirDocumentos}
          className="mt-4 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted"
        >
          Omitir por ahora
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 text-center">
      <h2 className="text-xl font-bold text-green-600 mb-2">
        ¡Proceso Completado!
      </h2>
      <p className="text-muted-foreground">
        La persona ha sido registrada exitosamente
      </p>
    </div>
  )
}
