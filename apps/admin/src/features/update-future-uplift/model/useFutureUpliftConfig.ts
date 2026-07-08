import {
  futureUpliftQueryKeys,
  getFutureUpliftConfig,
} from "@/entities/future-uplift";
import { useQuery } from "@sol/api-client";

export function useFutureUpliftConfig() {
  return useQuery({
    queryKey: futureUpliftQueryKeys.config(),
    queryFn: () => getFutureUpliftConfig(),
  });
}
