import { ApiError, api, useQuery } from "@sol/api-client";

import { normalizeContractedExtra } from "../lib/normalize-contracted-extra";
import type { CatalogContractedExtraDetail } from "../model/types";

export function isContractedExtraNotFoundError(e: unknown): boolean {
  if (ApiError.isApiError(e) && e.status === 404) return true;
  const r =
    typeof e === "object" && e !== null && "response" in e
      ? (e as { response?: { status?: number } }).response
      : undefined;
  return r?.status === 404;
}

/**
 * GET `/catalog/extras/:id/contracted-extras?contractId=` — use for one-off page-load hydration only.
 * HTTP 404 → `null` (no row for that contract yet).
 */
export function useContractedExtraForExtra(
  extraId: string | null | undefined,
  contractId: string | null | undefined
) {
  const trimmed = contractId?.trim() ?? "";
  const enabled = Boolean(extraId && trimmed.length > 0);

  return useQuery({
    queryKey: ["catalog-contracted-extra", extraId, trimmed],
    enabled,
    retry: false,
    staleTime: 60_000,
    queryFn: async (): Promise<CatalogContractedExtraDetail | null> => {
      try {
        const data = await api.get<unknown>(
          `/catalog/extras/${extraId}/contracted-extras`,
          { params: { contractId: trimmed } }
        );
        return normalizeContractedExtra(data);
      } catch (e) {
        if (isContractedExtraNotFoundError(e)) {
          return null;
        }
        throw e;
      }
    },
  });
}
