import type { QueryClient } from "@tanstack/react-query";

/**
 * Updater for TanStack Query cache entries that may hold either an entity list
 * or a single entity (e.g. nested caches under the same key prefix).
 */
export function applyToggleToListOrEntityCache<T extends { id: string }>(
  toggle: (row: T) => T
) {
  return (prev: unknown): unknown => {
    if (Array.isArray(prev)) {
      return prev.map(toggle);
    }
    if (prev && typeof prev === "object" && "id" in prev) {
      return toggle(prev as T);
    }
    return prev;
  };
}

export interface UpdateToggleStatusListCachesParams<T extends { id: string }> {
  queryClient: QueryClient;
  /** Root list key, e.g. `["agents"]`. */
  rootQueryKey: readonly unknown[];
  entityId: string;
  toggle: (row: T) => T;
  /**
   * When true (default), skip keys where `queryKey[1] === entityId` and
   * `queryKey.length === 2` so detail caches like `["agent", id]` are not
   * treated as lists. Detail should be updated separately.
   */
  skipDetailKeyWhenSecondSegmentMatchesEntityId?: boolean;
}

/**
 * Updates the root list cache and every other list-shaped query under the same
 * prefix (via `findAll`), using one `toggle` mapper. See
 * `.cursor/rules/toggle-status-mutation-cache.mdc`.
 */
export function updateToggleStatusListCaches<T extends { id: string }>({
  queryClient,
  rootQueryKey,
  entityId,
  toggle,
  skipDetailKeyWhenSecondSegmentMatchesEntityId = true,
}: UpdateToggleStatusListCachesParams<T>): void {
  const applyCached = applyToggleToListOrEntityCache(toggle);

  queryClient.setQueryData(rootQueryKey, (prev) => {
    if (!Array.isArray(prev)) return prev;
    return prev.map(toggle);
  });

  queryClient
    .getQueryCache()
    .findAll({ queryKey: [...rootQueryKey] })
    .forEach(({ queryKey }) => {
      if (queryKey.length === 1) {
        return;
      }
      if (
        skipDetailKeyWhenSecondSegmentMatchesEntityId &&
        queryKey.length === 2 &&
        queryKey[1] === entityId
      ) {
        return;
      }
      queryClient.setQueryData(queryKey, applyCached);
    });
}
