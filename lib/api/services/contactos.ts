import { api } from "../client"
import type {
  ApiResponse,
  Contacto,
  ContactoCreationAttributes,
  UpdateContactoDTO,
  BulkCreateContactoDTO,
} from "@/lib/types"

/**
 * Servicio para el endpoint /contactos
 *
 * Un contacto es un canal de comunicación (teléfono, email, dirección, etc.)
 * que pertenece a una persona. Una persona puede tener múltiples contactos
 * pero solo uno puede ser principal.
 */
export const contactosApi = {

  // GET /contactos/getAll
  getAll: () =>
    api.get<ApiResponse<Contacto[]>>("/contactos/getAll"),

  // GET /contactos/getById/:id
  getById: (contactoId: number) =>
    api.get<ApiResponse<Contacto>>(`/contactos/getById/${contactoId}`),

  // GET /contactos/getByPersona/:personaId
  // → todos los contactos activos de una persona, ordenados: principal primero
  getByPersona: (personaId: number) =>
    api.get<ApiResponse<Contacto[]>>(`/contactos/getByPersona/${personaId}`),

  // GET /contactos/getByTipo/:personaId?tipo_contacto=...
  getByTipo: (personaId: number, tipoContacto: Contacto["tipo_contacto"]) =>
    api.get<ApiResponse<Contacto[]>>(
      `/contactos/getByTipo/${personaId}?tipo_contacto=${tipoContacto}`
    ),

  // POST /contactos/create
  create: (dto: ContactoCreationAttributes) =>
    api.post<ApiResponse<Contacto>>("/contactos/create", dto),

  // POST /contactos/bulkCreate
  // → útil para crear varios contactos de golpe al registrar una persona nueva
  bulkCreate: (dto: BulkCreateContactoDTO) =>
    api.post<ApiResponse<Contacto[]>>("/contactos/bulkCreate", dto),

  // PUT /contactos/update/:id
  update: (contactoId: number, dto: UpdateContactoDTO) =>
    api.put<ApiResponse<Contacto>>(`/contactos/update/${contactoId}`, dto),

  // PATCH /contactos/setPrincipal/:id
  // → marca este contacto como principal y desmarca el anterior automáticamente (backend)
  setPrincipal: (contactoId: number) =>
    api.patch<ApiResponse<Contacto>>(`/contactos/setPrincipal/${contactoId}`),

  // DELETE /contactos/delete/:id
  delete: (contactoId: number) =>
    api.delete<ApiResponse<void>>(`/contactos/delete/${contactoId}`),
}
