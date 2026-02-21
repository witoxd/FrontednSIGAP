# Refactorización: De Modales a Páginas Independientes

## Resumen de Cambios

Se ha refactorizado el sistema de formularios de creación y edición, migrando de un patrón basado en modales a páginas independientes. Este cambio mejora la escalabilidad y permite agregar más funcionalidades futuras sin limitaciones de espacio.

## Motivación

### Antes (Modales)
- Limitación de espacio para agregar nuevos campos
- Difícil de escalar con funcionalidades complejas
- Fuerza al usuario a completar en una sola sesión
- No permite URL directa para compartir o bookmarking

### Ahora (Páginas Independientes)
- Espacio ilimitado para campos y secciones
- Permite agregar funcionalidades complejas (fotos, archivos, relaciones)
- Mejor experiencia de usuario con más tiempo y espacio
- URLs dedicadas para cada acción
- Navegación más natural con breadcrumbs

## Estructura de Rutas

### Estudiantes
- **Listado**: `/dashboard/estudiantes`
- **Crear**: `/dashboard/estudiantes/nuevo`
- **Editar**: `/dashboard/estudiantes/[id]/editar`

### Profesores
- **Listado**: `/dashboard/profesores`
- **Crear**: `/dashboard/profesores/nuevo`
- **Editar**: `/dashboard/profesores/[id]/editar`

### Administrativos
- **Listado**: `/dashboard/administrativos`
- **Crear**: `/dashboard/administrativos/nuevo`
- **Editar**: `/dashboard/administrativos/[id]/editar`

### Acudientes
- **Listado**: `/dashboard/acudientes`
- **Crear**: `/dashboard/acudientes/nuevo`
- **Editar**: `/dashboard/acudientes/[id]/editar`

## Archivos Creados

### Componentes Nuevos

1. **`lib/constants/archivo-tipos.ts`**
   - Constantes para tipos de archivos
   - IDs de tipos de archivo (FOTO_PERFIL, DOCUMENTO_IDENTIDAD, etc.)
   - Configuración de validación para fotos de perfil

2. **`components/shared/profile-photo-uploader.tsx`**
   - Componente reutilizable para subir foto de perfil
   - Drag & drop, preview, validación
   - Integración con endpoint `/api/archivos/bulkCreate`
   - Funciona en modo standalone o integrado en formulario

### Páginas de Creación

1. **`app/dashboard/estudiantes/nuevo/page.tsx`**
   - Formulario completo de creación de estudiante
   - Secciones: Foto, Información Personal, Información Académica
   - Integración con ProfilePhotoUploader

2. **`app/dashboard/profesores/nuevo/page.tsx`**
   - Formulario completo de creación de profesor
   - Secciones: Foto, Información Personal, Información Profesional

### Páginas de Edición

1. **`app/dashboard/estudiantes/[id]/editar/page.tsx`**
   - Carga datos existentes del estudiante
   - Permite actualizar información y foto

## Archivos Modificados

1. **`app/dashboard/estudiantes/page.tsx`**
   - Eliminado: Modal, EstudianteForm inline, funciones handleCreate/handleUpdate
   - Agregado: useRouter, funciones handleCreate/handleEdit con router.push()
   - Mantiene: Búsqueda, paginación, eliminación

2. **`app/dashboard/profesores/page.tsx`**
   - Refactorizado completamente (de 480+ líneas a ~160 líneas)
   - Eliminado: Modal, ProfesorForm inline
   - Agregado: Navegación con router.push()

3. **`lib/types.ts`**
   - Agregado: Interface TipoArchivo
   - Agregado: Interface BulkCreateArchivoMetadata
   - Agregado: Interface BulkCreateArchivoResponse

## Flujo de Trabajo: Foto de Perfil

### Estrategia Elegida: Tabla de Archivos

La foto de perfil se almacena en la tabla `archivos` con:
- `tipo_archivo_id = 1` (FOTO_PERFIL)
- `persona_id` vinculado a la persona
- Usando el endpoint `/api/archivos/bulkCreate`

### Flujo de Creación

```typescript
// 1. Crear estudiante/profesor/etc
const response = await entityService.create(input)
const nuevaPersonaId = response.data.persona_id

// 2. Si hay foto, subirla
if (photoFile && nuevaPersonaId) {
  const formData = new FormData()
  formData.append("archivos", photoFile)
  formData.append("persona_id", nuevaPersonaId.toString())
  formData.append("tipo_archivo_id", "1") // FOTO_PERFIL
  formData.append("descripcion", "Foto de perfil")
  
  await fetch("/api/archivos/bulkCreate", {
    method: "POST",
    body: formData,
  })
}

// 3. Redirigir
router.push("/dashboard/estudiantes")
```

### Flujo de Edición

```typescript
// 1. Cargar datos existentes
const estudiante = await estudiantesService.getById(id)

// 2. Actualizar información
await estudiantesService.update(id, input)

// 3. Si hay nueva foto, subirla (reemplaza la anterior)
if (photoFile && estudiante.persona_id) {
  // Mismo proceso que en creación
}
```

## Componente ProfilePhotoUploader

### Props

```typescript
interface ProfilePhotoUploaderProps {
  personaId?: number                    // ID de persona (para modo standalone)
  currentPhotoUrl?: string              // URL de foto actual (para edición)
  onPhotoChange?: (file: File | null) => void  // Callback cuando cambia la foto
  className?: string                    // Clases CSS adicionales
  disabled?: boolean                    // Deshabilitado durante submit
  showUploadButton?: boolean            // Mostrar botón para subir directamente
}
```

### Modos de Uso

#### Modo Formulario (Recomendado para crear/editar)
```tsx
<ProfilePhotoUploader
  onPhotoChange={setPhotoFile}
  disabled={isSubmitting}
/>
// La foto se sube cuando se guarda el formulario
```

#### Modo Standalone (Para perfiles existentes)
```tsx
<ProfilePhotoUploader
  personaId={123}
  currentPhotoUrl="/api/archivos/foto-123.jpg"
  showUploadButton={true}
/>
// Botón independiente para subir inmediatamente
```

### Validaciones

- **Formatos permitidos**: JPG, PNG, WebP
- **Tamaño máximo**: 5MB
- **Preview**: Vista previa antes de subir
- **Drag & Drop**: Arrastrar y soltar archivos

## Cambios en las Páginas de Listado

### Antes
```tsx
<button onClick={() => openCreate()}>
  Nuevo estudiante
</button>

<Modal open={modalOpen} onClose={...}>
  <EstudianteForm onSubmit={handleCreate} />
</Modal>
```

### Ahora
```tsx
<button onClick={() => router.push("/dashboard/estudiantes/nuevo")}>
  Nuevo estudiante
</button>

// Botón editar en tabla
<button onClick={() => router.push(`/dashboard/estudiantes/${id}/editar`)}>
  <Pencil />
</button>
```

## Beneficios de la Refactorización

### Escalabilidad
- Fácil agregar nuevas secciones (documentos, historial, relaciones)
- No hay límite de espacio vertical
- Mejor organización visual con cards y secciones

### Experiencia de Usuario
- Formularios no se pierden al cerrar accidentalmente
- URL única permite compartir enlace directo
- Breadcrumbs para navegación clara
- Más tiempo para completar información

### Mantenibilidad
- Código más limpio y organizado
- Componentes reutilizables (ProfilePhotoUploader)
- Separación clara de responsabilidades
- Más fácil de testear

### SEO y Accesibilidad
- URLs semánticas y descriptivas
- Mejor navegación con teclado
- Meta tags específicos por página
- Histórico de navegación correcto

## Patrón de Implementación

Para agregar un nuevo módulo (ej: cursos), sigue este patrón:

### 1. Crear constantes (si necesita archivos especiales)
```typescript
// lib/constants/archivo-tipos.ts
export const TIPO_ARCHIVO_IDS = {
  // ...
  PROGRAMA_CURSO: 10,
}
```

### 2. Crear página de creación
```typescript
// app/dashboard/cursos/nuevo/page.tsx
export default function NuevoCursoPage() {
  // Estructura similar a estudiantes/nuevo
}
```

### 3. Crear página de edición
```typescript
// app/dashboard/cursos/[id]/editar/page.tsx
export default function EditarCursoPage() {
  // Cargar datos existentes
  // Estructura similar a estudiantes/[id]/editar
}
```

### 4. Actualizar página de listado
```typescript
// app/dashboard/cursos/page.tsx
function handleCreate() {
  router.push("/dashboard/cursos/nuevo")
}

function handleEdit(curso) {
  router.push(`/dashboard/cursos/${curso.id}/editar`)
}
```

## Próximos Pasos Sugeridos

1. **Completar páginas faltantes**:
   - Administrativos: nuevo y editar
   - Acudientes: nuevo y editar

2. **Agregar validaciones avanzadas**:
   - Validación de formularios con zod o yup
   - Mensajes de error específicos por campo

3. **Mejorar carga de fotos**:
   - Compresión automática de imágenes
   - Crop/redimensionamiento antes de subir
   - Mostrar foto actual en edición

4. **Agregar más funcionalidades**:
   - Subir múltiples documentos en creación
   - Vista previa de PDF en formulario
   - Historial de cambios

5. **Optimizaciones de UX**:
   - Guardar borrador automáticamente
   - Confirmación al salir con cambios sin guardar
   - Stepper para formularios largos

## Notas Técnicas

### FormData para Archivos
El endpoint `/api/archivos/bulkCreate` espera:
```typescript
FormData {
  archivos: File[]              // Uno o más archivos
  persona_id: string            // ID de persona
  tipo_archivo_id: string       // ID del tipo de archivo
  descripcion: string           // Descripción del archivo
}
```

### Router.push y Router.refresh
```typescript
router.push("/ruta")      // Navega a nueva página
router.refresh()          // Refresca datos de la página actual
```

### SWR Mutate
```typescript
mutate()  // Revalida los datos después de crear/editar/eliminar
```

## Conclusión

Esta refactorización sienta las bases para un sistema de gestión más robusto y escalable. Las páginas independientes permiten agregar funcionalidades complejas sin comprometer la experiencia del usuario, y el componente de foto de perfil reutilizable facilita mantener consistencia en todo el sistema.
