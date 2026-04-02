
import { api } from "../client"
import type { ApiResponse, PaginatedApiResponse, PersonaWithTipoDocumento, PersonaWithTipoDocumentoJSON } from "@/lib/types"


export const personaApi = {

    searchIndex: (query: string) =>
        api.get<PaginatedApiResponse<PersonaWithTipoDocumentoJSON>>(
            `/personas/searchIndex/${encodeURIComponent(query)}` ,
        )
}