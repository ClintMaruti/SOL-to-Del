export const futureUpliftQueryKeys = {
  all: ["futureUplift"] as const,
  config: () => [...futureUpliftQueryKeys.all, "config"] as const,
};
