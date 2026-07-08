export function serviceRatesQueryKey(serviceId: string) {
  return ["service-rates", serviceId] as const;
}
