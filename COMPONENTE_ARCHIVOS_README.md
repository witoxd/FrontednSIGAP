# 📁 Componente de Carga de Archivos - Guía Completa

## 📋 Resumen

Se ha creado un **componente reutilizable de carga de archivos** (`ArchivoUploader`) que permite subir múltiples documentos al endpoint `/api/archivos/bulkCreate` de manera simple y eficiente.

### ✨ Características Principales

- ✅ **Independiente**: Solo requiere un `persona_id` para funcionar
- ✅ **Drag & Drop**: Arrastra y suelta archivos
- ✅ **Preview**: Vista previa de imágenes
- ✅ **Validación**: Tipos, tamaños y archivos requeridos
- ✅ **Progreso**: Barra de progreso en tiempo real
- ✅ **Responsive**: Funciona en todos los dispositivos
- ✅ **Accesible**: Cumple estándares de accesibilidad

---

## 📂 Archivos Creados

### 1. **Componente Principal**
```
components/shared/archivo-uploader.tsx
```
El componente reutilizable principal. Este es el archivo que debes importar y usar.

**Ubicación**: `/vercel/share/v0-project/components/shared/archivo-uploader.tsx`

### 2. **Ejemplos de Uso**
```
components/shared/archivo-uploader-ejemplo.tsx
```
Contiene 6 ejemplos prácticos de cómo usar el componente en diferentes escenarios.

**Ubicación**: `/vercel/share/v0-project/components/shared/archivo-uploader-ejemplo.tsx`

### 3. **Documentación Completa**
```
components/shared/ARCHIVO_UPLOADER_README.md
```
Documentación detallada con todos los props, ejemplos y mejores prácticas.

**Ubicación**: `/vercel/share/v0-project/components/shared/ARCHIVO_UPLOADER_README.md`

### 4. **Ejemplo de Integración Real**
```
components/estudiantes/estudiante-form-con-archivos.tsx
```
Ejemplo práctico de un formulario de inscripción de estudiante en 2 pasos que integra el componente.

**Ubicación**: `/vercel/share/v0-project/components/estudiantes/estudiante-form-con-archivos.tsx`

### 5. **Tipos Actualizados**
```
lib/types.ts
```
Se agregaron los siguientes tipos:
- `TipoArchivo`
- `BulkCreateArchivoMetadata`
- `BulkCreateArchivoResponse`

**Ubicación**: `/vercel/share/v0-project/lib/types.ts`

---

## 🚀 Uso Rápido

### Paso 1: Importar el Componente

```tsx
import { ArchivoUploader } from "@/components/shared/archivo-uploader"
```

### Paso 2: Usar en tu Componente

```tsx
"use client"

export function MiFormulario() {
  const personaId = 123 // Tu persona_id existente

  return (
    <ArchivoUploader
      persona_id={personaId}
      onSuccess={(archivos) => {
        alert(`¡Éxito! ${archivos.length} archivos subidos`)
      }}
      onError={(error) => {
        alert(`Error: ${error}`)
      }}
    />
  )
}
```

---

## 🎯 Casos de Uso Comunes

### Caso 1: Agregar documentos después de crear un estudiante

```tsx
const handleCrearEstudiante = async (datos) => {
  const response = await estudiantesApi.create(datos)
  const nuevoPersonaId = response.data.persona_id
  
  // Mostrar el uploader con el nuevo persona_id
  setPersonaId(nuevoPersonaId)
  setMostrarUploader(true)
}

{mostrarUploader && personaId && (
  <ArchivoUploader
    persona_id={personaId}
    onSuccess={() => router.push("/dashboard/estudiantes")}
  />
)}
```

### Caso 2: Modal para agregar documentos a persona existente

```tsx
import { Modal } from "@/components/shared/modal"
import { ArchivoUploader } from "@/components/shared/archivo-uploader"

<Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
  <ArchivoUploader
    persona_id={personaIdSeleccionado}
    onSuccess={() => {
      alert("Documentos agregados")
      setModalOpen(false)
    }}
  />
</Modal>
```

### Caso 3: Inscripción con documentos requeridos

```tsx
<ArchivoUploader
  persona_id={personaId}
  tiposRequeridos={[1, 5, 2]} // IDs de tipos obligatorios
  maxFiles={5}
  onSuccess={() => {
    alert("¡Inscripción completada!")
    router.push("/dashboard")
  }}
/>
```

---

## 🎛️ Props Disponibles

| Prop | Tipo | Requerido | Default | Descripción |
|------|------|-----------|---------|-------------|
| `persona_id` | `number` | ✅ Sí | - | ID de la persona |
| `onSuccess` | `function` | ❌ No | - | Callback al subir exitosamente |
| `onError` | `function` | ❌ No | - | Callback en caso de error |
| `maxFiles` | `number` | ❌ No | `20` | Máximo de archivos permitidos |
| `maxFileSize` | `number` | ❌ No | `10` | Tamaño máximo en MB |
| `tiposRequeridos` | `number[]` | ❌ No | `[]` | IDs de tipos requeridos |
| `className` | `string` | ❌ No | `""` | Clases CSS adicionales |

---

## 📝 Tipos de Archivo Soportados

- **PDF**: Para certificados, documentos oficiales
- **JPG/JPEG/PNG**: Para fotografías e imágenes
- **DOC/DOCX**: Para documentos de Word

---

## 🔧 Integración con Formularios Existentes

### Opción A: Formulario en 2 Pasos (Recomendado)

Ver el ejemplo completo en:
```
components/estudiantes/estudiante-form-con-archivos.tsx
```

**Flujo**:
1. Usuario llena datos personales → Se crea la persona → Se obtiene `persona_id`
2. Usuario sube documentos usando el `persona_id` obtenido
3. Confirmación final

### Opción B: Modal Independiente

Agregar un botón "Agregar Documentos" en tu tabla/lista que abra un modal con el `ArchivoUploader`.

### Opción C: Pestaña Adicional

En formularios con pestañas (tabs), agregar una pestaña "Documentos" con el componente.

---

## 🎨 Estructura de Datos Enviados

El componente envía un `FormData` al endpoint `/api/archivos/bulkCreate`:

```typescript
{
  persona_id: "123",
  archivos: [File, File, File], // Los archivos reales
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

**Importante**: El orden de los archivos en el array `archivos` debe coincidir con el orden del array `metadata`.

---

## 🔐 Seguridad y Autenticación

El componente:
- ✅ Usa el token almacenado en `localStorage` (`sigap_token`)
- ✅ Envía el token en el header `Authorization: Bearer <token>`
- ✅ Valida tipos MIME en el cliente
- ⚠️ **Importante**: El backend debe realizar validaciones adicionales

---

## 🐛 Manejo de Errores

El componente muestra errores visuales para:
- Archivos demasiado grandes
- Tipos de archivo no permitidos
- Exceso de archivos
- Falta de tipo asignado
- Tipos requeridos faltantes
- Errores de red
- Errores del servidor

Todos los errores se pueden capturar con el callback `onError`.

---

## 📚 Ver Más Ejemplos

Para ver ejemplos detallados de integración:

1. **Ejemplos básicos**: `components/shared/archivo-uploader-ejemplo.tsx`
2. **Ejemplo real integrado**: `components/estudiantes/estudiante-form-con-archivos.tsx`
3. **Documentación completa**: `components/shared/ARCHIVO_UPLOADER_README.md`

---

## 🧪 Testing del Componente

Para probar el componente:

1. Asegúrate de que el endpoint `/api/archivos/bulkCreate` esté funcionando
2. Verifica que tienes tipos de archivo configurados en `/api/tipos-archivos/getAll`
3. Usa un `persona_id` válido existente en tu base de datos

### Ejemplo de Prueba Rápida

```tsx
// app/test-uploader/page.tsx
"use client"

import { ArchivoUploader } from "@/components/shared/archivo-uploader"

export default function TestUploader() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Archivo Uploader</h1>
      <ArchivoUploader
        persona_id={1} // Cambia por un ID válido
        onSuccess={(archivos) => console.log("Éxito:", archivos)}
        onError={(error) => console.error("Error:", error)}
      />
    </div>
  )
}
```

---

## 🔄 Cómo Actualizar Tipos de Archivo

Los tipos de archivo disponibles se cargan automáticamente desde:
```
GET /api/tipos-archivos/getAll
```

El componente usa **SWR** para cachear y revalidar automáticamente estos datos.

Si agregas nuevos tipos de archivo en el backend, el componente los mostrará automáticamente.

---

## 💡 Mejores Prácticas

1. **Siempre valida en el backend**: Las validaciones del cliente son solo para UX
2. **Usa tipos requeridos**: Para flujos críticos como inscripciones
3. **Implementa callbacks**: `onSuccess` y `onError` para mejor feedback
4. **Ajusta límites**: Configura `maxFileSize` según tus necesidades
5. **Considera el flujo**: Decide si cargar archivos inmediatamente o después
6. **Feedback visual**: Usa notificaciones toast en los callbacks

---

## 📞 Soporte y Troubleshooting

### Problema: No se suben los archivos

**Solución**:
1. Verifica que el endpoint `/api/archivos/bulkCreate` esté disponible
2. Confirma que el `persona_id` existe en la base de datos
3. Revisa la consola del navegador para logs con `[v0]`
4. Verifica que tienes el token de autenticación

### Problema: No aparecen tipos de archivo

**Solución**:
1. Verifica que `/api/tipos-archivos/getAll` devuelva datos
2. Confirma que los tipos tengan `activo: true`
3. Revisa la consola de red del navegador

### Problema: Error de validación

**Solución**:
1. Revisa que el archivo sea PDF, JPG, PNG o DOC
2. Confirma que el tamaño no exceda `maxFileSize`
3. Verifica que todos los archivos tengan tipo asignado

---

## 🎯 Próximos Pasos

Después de integrar el componente:

1. ✅ Importar `ArchivoUploader` en tu formulario
2. ✅ Pasar el `persona_id` obtenido al crear la persona
3. ✅ Implementar callbacks `onSuccess` y `onError`
4. ✅ (Opcional) Configurar `tiposRequeridos` si aplica
5. ✅ Probar el flujo completo

---

## 📦 Resumen de Archivos

```
components/
├── shared/
│   ├── archivo-uploader.tsx                    # ⭐ Componente principal
│   ├── archivo-uploader-ejemplo.tsx            # 📚 Ejemplos de uso
│   └── ARCHIVO_UPLOADER_README.md             # 📖 Documentación detallada
├── estudiantes/
│   └── estudiante-form-con-archivos.tsx        # 🎯 Ejemplo integrado real
lib/
└── types.ts                                    # 🔧 Tipos actualizados
```

---

## ✅ Checklist de Integración

- [ ] Importar el componente `ArchivoUploader`
- [ ] Obtener el `persona_id` después de crear la persona
- [ ] Pasar el `persona_id` como prop al componente
- [ ] Implementar callback `onSuccess` para redirección
- [ ] Implementar callback `onError` para manejo de errores
- [ ] (Opcional) Configurar `tiposRequeridos` si aplica
- [ ] Probar con diferentes tipos de archivo
- [ ] Verificar que los archivos se guarden correctamente
- [ ] Revisar la experiencia de usuario

---

## 🙌 Conclusión

El componente `ArchivoUploader` está listo para usar en cualquier parte de tu aplicación. Es independiente, reutilizable y sigue las mejores prácticas de React y Next.js.

Para cualquier duda, consulta los ejemplos en:
- `archivo-uploader-ejemplo.tsx`
- `estudiante-form-con-archivos.tsx`
- `ARCHIVO_UPLOADER_README.md`

¡Feliz codificación! 🚀
