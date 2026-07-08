import { z } from "zod";

const destinationTypes = [
  "Country",
  "Region",
  "Area",
  "City",
  "Airport",
] as const;

export const editDestinationSubmitSchema = z
  .object({
    id: z.string(),
    parentId: z.string().nullable(),
    type: z.enum(destinationTypes),
    name: z.string().trim(),
    iataCode: z.string(),
    destinationCode: z.string(),
    latitude: z.string(),
    longitude: z.string(),
    isPreferred: z.boolean().optional(),
  })
  .transform((data) => ({
    id: data.id,
    parentId:
      !data.parentId || data.parentId === "root_id" ? null : data.parentId,
    name: data.name,
    type: data.type,
    code:
      data.type === "Airport"
        ? data.iataCode.trim()
        : data.destinationCode.trim(),
    latitude: data.latitude.trim() ? parseFloat(data.latitude) : null,
    longitude: data.longitude.trim() ? parseFloat(data.longitude) : null,
    isPreferred: data.type === "Country" ? !!data.isPreferred : false,
  }));

export type EditDestinationSubmitData = z.output<
  typeof editDestinationSubmitSchema
>;
