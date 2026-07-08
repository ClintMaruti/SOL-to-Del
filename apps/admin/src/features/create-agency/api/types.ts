import type { AgencyWritePayload } from "@/entities/agency/model/types";

/** Request body for POST /api/catalog/agencies */
export type CreateAgencyRequest = AgencyWritePayload;

/** Response body for POST /api/catalog/agencies (201 Created) – use Agency from entities/agency */
