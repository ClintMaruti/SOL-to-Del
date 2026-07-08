/**
 * MSW helpers for catalog location trees (eligible countries, etc.).
 * Mirrors server rules: keep nodes whose root Country has ≥1 active supplier (by country name).
 */

export interface FlatCatalogLocationLike {
  id: string;
  parentId: string | null;
  name: string;
  type: string;
  isActive: boolean;
  deletedAt?: string | null;
}

/**
 * Keeps flat location rows whose root ancestor is an active Country whose name
 * (case-insensitive) appears in `activeSupplierCountryNamesLower`.
 */
export function filterFlatLocationsToEligibleSupplierCountries<
  T extends FlatCatalogLocationLike,
>(flat: T[], activeSupplierCountryNamesLower: Set<string>): T[] {
  const activeRows = flat.filter((d) => !d.deletedAt);
  const byId = new Map(activeRows.map((d) => [d.id, d]));

  function rootCountryIdForNode(nodeId: string): string | null {
    let cur: string | undefined = nodeId;
    const seen = new Set<string>();
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      const node = byId.get(cur);
      if (!node) {
        return null;
      }
      if (node.parentId === null) {
        return node.type === "Country" ? cur : null;
      }
      cur = node.parentId;
    }
    return null;
  }

  const eligibleRootIds = new Set(
    activeRows
      .filter(
        (n) =>
          n.parentId === null &&
          n.type === "Country" &&
          n.isActive &&
          activeSupplierCountryNamesLower.has(n.name.trim().toLowerCase())
      )
      .map((n) => n.id)
  );

  return flat.filter((d) => {
    if (d.deletedAt) {
      return false;
    }
    const rootId = rootCountryIdForNode(d.id);
    if (rootId === null) {
      return false;
    }
    return eligibleRootIds.has(rootId);
  });
}
