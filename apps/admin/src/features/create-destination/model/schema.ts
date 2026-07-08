import { z } from "zod";

const destinationTypes = [
  "Country",
  "Region",
  "Area",
  "City",
  "Airport",
] as const;

export const createDestinationSubmitSchema = z
  .object({
    type: z.enum(destinationTypes),
    name: z.string().trim(),
    parentId: z.string(),
    iataCode: z.string(),
    destinationCode: z.string(),
    latitude: z.string(),
    longitude: z.string(),
    isPreferred: z.boolean().optional(),
  })
  .transform((data) => ({
    parentId:
      !data.parentId || data.parentId === "root_id" ? null : data.parentId,
    name: data.name,
    type: data.type,
    code:
      data.type === "Airport"
        ? data.iataCode.trim() || undefined
        : data.destinationCode.trim() || undefined,
    latitude: data.latitude.trim() ? parseFloat(data.latitude) : undefined,
    longitude: data.longitude.trim() ? parseFloat(data.longitude) : undefined,
    isPreferred: data.type === "Country" ? !!data.isPreferred : false,
  }));

export type CreateDestinationSubmitData = z.output<
  typeof createDestinationSubmitSchema
>;
