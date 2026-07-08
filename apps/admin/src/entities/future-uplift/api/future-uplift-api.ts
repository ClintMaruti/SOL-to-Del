import { api } from "@sol/api-client";

import type {
  FutureUpliftConfigDto,
  FutureUpliftPatchPayload,
} from "../model/types";

const BASE = "/catalog/future-uplift";

export async function getFutureUpliftConfig(): Promise<FutureUpliftConfigDto> {
  return api.get<FutureUpliftConfigDto>(BASE);
}

export async function patchFutureUpliftConfig(
  payload: FutureUpliftPatchPayload
): Promise<FutureUpliftConfigDto> {
  return api.patch<FutureUpliftConfigDto>(BASE, payload);
}
