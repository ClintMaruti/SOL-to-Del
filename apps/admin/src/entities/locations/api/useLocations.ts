import { api, useQuery } from "@sol/api-client";

import type { Location } from "../types";

export function useLocations() {
  return useQuery<Location[]>({
    queryKey: ["locations"],
    queryFn: async () => {
      const data = await api.get<Location[]>("/catalog/locations");
      return data;
    },
  });
}
