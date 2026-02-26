# ArchivoUploader - Componente de Carga de Archivos

## 📋 Descripción

`ArchivoUploader` es un componente React reutilizable diseñado para facilitar la carga de múltiples archivos al endpoint `/api/archivos/bulkCreate`. El componente es completamente independiente y solo requiere un `persona_id` para funcionar.

## ✨ Características

- 🖱️ **Drag & Drop**: Arrastra y suelta archivos directamente
- 🖼️ **Preview**: Visualización previa de imágenes
- ✅ **Validación**: Validación de tipos, tamaños y archivos requeridos
- 📊 **Progreso**: Barra de progreso durante la carga
- 🎨 **UI Moderna**: Diseño consistente con el resto de la aplicación
- ♿ **Accesible**: Cumple con estándares de accesibilidad
- 🔄 **Reutilizable**: Se integra fácilmente en cualquier formulario

## 📦 Instalación

El componente ya está disponible en el proyecto. Solo necesitas importarlo:

```tsx
import { ArchivoUploader } from "@/components/shared/archivo-uploader"
```

## 🚀 Uso Básico

```tsx
"use client"

import { ArchivoUploader } from "@/components/shared/archivo-uploader"

export function MiComponente() {
  const personaId = 123 // ID de la persona existente

  return (
    <ArchivoUploader
      persona_id={personaId}
      onSuccess={(archivos) => {
        console.log("Archivos subidos:", archivos)
        alert(`¡Éxito! Se subieron ${archivos.length} archivos`)
      }}
      onError={(error) => {
        console.error("Error:", error)
        alert(`Error: ${error}`)
      }}
    />
  )
}
```

## 🎛️ Props

| Prop | Tipo | Requerido | Default | Descripción |
|------|------|-----------|---------|-------------|
| `persona_id` | `number` | ✅ Sí | - | ID de la persona a la que se vincularán los archivos |
| `onSuccess` | `(archivos: unknown[]) => void` | ❌ No | - | Callback ejecutado al subir exitosamente |
| `onError` | `(error: string) => void` | ❌ No | - | Callback ejecutado en caso de error |
| `maxFiles` | `number` | ❌ No | `20` | Número máximo de archivos permitidos |
| `maxFileSize` | `number` | ❌ No | `10` | Tamaño máximo por archivo en MB |
| `tiposRequeridos` | `number[]` | ❌ No | `[]` | IDs de tipos de archivo requeridos |
| `className` | `string` | ❌ No | `""` | Clases CSS adicionales para el contenedor |

## 📚 Ejemplos de Uso

### Ejemplo 1: Uso Simple

```tsx
<ArchivoUploader persona_id={personaId} />
```

### Ejemplo 2: Con Validación de Tipos Requeridos

Para inscripciones que requieren documentos específicos:

```tsx
<ArchivoUploader
  persona_id={personaId}
  tiposRequeridos={[1, 2, 5]} // Certificado, Diploma, Fotografía
  onSuccess={(archivos) => {
    console.log("Todos los documentos requeridos subidos")
    // Continuar con el siguiente paso
  }}
/>
```

### Ejemplo 3: Con Límites Personalizados

```tsx
<ArchivoUploader
  persona_id={personaId}
  maxFiles={5}
  maxFileSize={15} // 15MB
  onSuccess={(archivos) => {
    router.push("/dashboard")
  }}
  onError={(error) => {
    toast.error(error)
  }}
/>
```

### Ejemplo 4: En un Modal

```tsx
"use client"

import { useState } from "react"
import { Modal } from "@/components/shared/modal"
import { ArchivoUploader } from "@/components/shared/archivo-uploader"

export function DocumentosModal({ estudianteId, personaId }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Agregar Documentos
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Subir Documentos"
      >
        <ArchivoUploader
          persona_id={personaId}
          onSuccess={(archivos) => {
            alert("Documentos subidos correctamente")
            setIsOpen(false)
          }}
        />
      </Modal>
    </>
  )
}
```

### Ejemplo 5: Flujo de Inscripción en 2 Pasos

```tsx
"use client"

import { useState } from "react"
import { ArchivoUploader } from "@/components/shared/archivo-uploader"
import { estudiantesApi } from "@/lib/api/services/estudiantes"

export function InscripcionForm() {
  const [paso, setPaso] = useState<"datos" | "documentos">("datos")
  const [personaId, setPersonaId] = useState<number | null>(null)

  const handleSubmitDatos = async (datos: unknown) => {
    try {
      const response = await estudiantesApi.create(datos)
      setPersonaId(response.data.persona_id)
      setPaso("documentos")
    } catch (error) {
      console.error(error)
    }
  }

  if (paso === "datos") {
    return (
      <div>
        <h2>Paso 1: Datos del Estudiante</h2>
        {/* Tu formulario aquí */}
        <button onClick={() => handleSubmitDatos({})}>
          Continuar
        </button>
      </div>
    )
  }

  return (
    <div>
      <h2>Paso 2: Documentos Requeridos</h2>
      {personaId && (
        <ArchivoUploader
          persona_id={personaId}
          tiposRequeridos={[1, 5]} // Certificado y Fotografía obligatorios
          onSuccess={() => {
            alert("¡Inscripción completada!")
            router.push("/dashboard/estudiantes")
          }}
        />
      )}
    </div>
  )
}
```

## 🔧 Integración con Formularios Existentes

### Opción A: Agregar después de crear la persona

```tsx
const handleCrearEstudiante = async (datos: CreateEstudianteInput) => {
  const response = await estudiantesApi.create(datos)
  const nuevoPersonaId = response.data.persona_id
  
  // Mostrar el uploader con el persona_id recién creado
  setPersonaId(nuevoPersonaId)
  setMostrarUploader(true)
}
```

### Opción B: En modal separado

```tsx
// En tu tabla de estudiantes
<button onClick={() => abrirModalDocumentos(estudiante.persona_id)}>
  Agregar Documentos
</button>

// Modal con el uploader
<Modal isOpen={modalOpen}>
  <ArchivoUploader persona_id={personaIdSeleccionado} />
</Modal>
```

### Opción C: Como paso adicional en wizard

```tsx
{pasoActual === 3 && (
  <ArchivoUploader
    persona_id={personaId}
    onSuccess={() => setPasoActual(4)}
  />
)}
```

## 📝 Tipos de Archivo Soportados

El componente acepta los siguientes tipos de archivo:

- **PDF**: `application/pdf`
- **Imágenes**: `image/jpeg`, `image/jpg`, `image/png`
- **Word**: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

## ⚙️ Cómo Funciona

1. **Selección**: El usuario arrastra archivos o hace clic para seleccionarlos
2. **Validación**: Se validan tipos, tamaños y cantidad
3. **Configuración**: El usuario asigna tipo y descripción a cada archivo
4. **Envío**: Los archivos se envían al endpoint `/api/archivos/bulkCreate` usando FormData
5. **Respuesta**: Se ejecutan los callbacks `onSuccess` o `onError`

### Estructura de Datos Enviados

```typescript
// FormData enviado al backend
{
  persona_id: "123",
  archivos: [File, File, File],
  metadata: JSON.stringify([
    {
      tipo_archivo_id: 1,
      descripcion: "Certificado de estudios"
    },
    {
      tipo_archivo_id: 5,
      descripcion: "Fotografía del estudiante"
    }
  ])
}
```

## 🎨 Personalización Visual

Puedes personalizar el estilo del componente usando la prop `className`:

```tsx
<ArchivoUploader
  persona_id={personaId}
  className="border border-blue-500 rounded-xl p-6 bg-blue-50"
/>
```

## 🐛 Manejo de Errores

El componente maneja varios tipos de errores:

- **Archivos muy grandes**: Muestra error si exceden `maxFileSize`
- **Tipo no permitido**: Valida que sean PDF, imágenes o documentos
- **Exceso de archivos**: Limita a `maxFiles`
- **Sin tipo asignado**: Requiere que cada archivo tenga un tipo
- **Tipos faltantes**: Valida que estén los tipos requeridos (`tiposRequeridos`)
- **Error de red**: Maneja errores de conexión
- **Error del servidor**: Muestra el mensaje de error del backend

Todos los errores se muestran en una alerta visual y se pueden capturar con `onError`.

## 🔐 Seguridad

- Usa el token de autenticación almacenado en `localStorage` (`sigap_token`)
- Valida tipos MIME en el cliente
- El backend debe realizar validaciones adicionales
- Los archivos se envían con autenticación Bearer

## 📊 Estado de Carga

El componente muestra:

- Barra de progreso durante la carga
- Spinner en el botón de envío
- Deshabilitación de controles durante el envío
- Porcentaje de progreso en tiempo real

## 🧪 Testing

Ver el archivo `archivo-uploader-ejemplo.tsx` para ejemplos completos de integración que puedes usar como base para tus tests.

## 📱 Responsive

El componente es completamente responsive:

- **Desktop**: Grid de 2 columnas para controles
- **Mobile**: Layout vertical apilado
- **Tablet**: Se adapta automáticamente

## ♿ Accesibilidad

- Labels descriptivos para todos los inputs
- Mensajes de error claros
- Soporte completo de teclado
- Estados visuales para drag & drop
- ARIA labels apropiados

## 🔄 Actualizar Archivos

Si necesitas actualizar tipos de archivo disponibles, estos se cargan automáticamente desde:

```
GET /api/tipos-archivos/getAll
```

El componente usa SWR para cachear y revalidar automáticamente.

## 💡 Tips y Mejores Prácticas

1. **Siempre valida en el backend**: Las validaciones del cliente son solo para UX
2. **Usa tipos requeridos**: Para flujos de inscripción o registro
3. **Maneja los callbacks**: Implementa `onSuccess` y `onError` para feedback al usuario
4. **Considera el tamaño**: Ajusta `maxFileSize` según tus necesidades
5. **Flujo de usuario**: Decide si cargar archivos inmediatamente o en paso separado
6. **Feedback visual**: Usa toast notifications en los callbacks para mejor UX

## 📞 Soporte

Si encuentras problemas o tienes preguntas:

1. Revisa los ejemplos en `archivo-uploader-ejemplo.tsx`
2. Verifica que el endpoint `/api/archivos/bulkCreate` esté funcionando
3. Confirma que el `persona_id` existe en la base de datos
4. Revisa la consola del navegador para logs de debug

## 🔮 Futuras Mejoras

Posibles extensiones del componente:

- [ ] Soporte para editar archivos existentes
- [ ] Previsualización de PDFs
- [ ] Compresión de imágenes antes de subir
- [ ] Soporte para copiar/pegar imágenes
- [ ] Edición de imágenes (crop, rotate)
- [ ] Subida por lotes en paralelo
- [ ] Reintentar automáticamente en caso de fallo

## 📄 Licencia

Este componente es parte del proyecto SIGAP y sigue la misma licencia del proyecto principal.
