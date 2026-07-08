import { api, useMutation, useQueryClient } from "@sol/api-client";

import {
  normalizeAgency,
  type AgencyApiResponse,
} from "@/entities/agency/lib/normalizeAgency";

import type { AgencySubmitData } from "../model/schema";

import { formDataToCreateAgencyRequest } from "./formDataToCreateAgencyRequest";

export function useCreateAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: AgencySubmitData) => {
      const payload = formDataToCreateAgencyRequest(formData);
      const data = await api.post<AgencyApiResponse>(
        "/catalog/agencies",
        payload
      );
      return normalizeAgency(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      queryClient.invalidateQueries({ queryKey: ["agency-groups"] });
    },
  });
}
