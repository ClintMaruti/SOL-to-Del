export interface NamedAgencyGroup {
  id?: string | null;
  name?: string | null;
}

export function sortAgencyGroupsByName<T extends NamedAgencyGroup>(
  groups: readonly T[] | null | undefined
): T[] {
  const seen = new Set<string>();
  const uniqueGroups: T[] = [];

  for (const group of groups ?? []) {
    const id = group.id?.trim();
    const name = group.name?.trim();
    const key = id
      ? `id:${id}`
      : name
        ? `name:${name.toLowerCase()}`
        : `index:${uniqueGroups.length}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueGroups.push(group);
  }

  return uniqueGroups.sort((a, b) => {
    const byName = (a.name ?? "").localeCompare(b.name ?? "", undefined, {
      sensitivity: "base",
    });
    return byName || (a.id ?? "").localeCompare(b.id ?? "");
  });
}

export function formatAgencyGroupNames(
  groups: readonly NamedAgencyGroup[] | null | undefined,
  fallback = ""
): string {
  const names = sortAgencyGroupsByName(groups)
    .map((group) => group.name?.trim())
    .filter((name): name is string => Boolean(name));

  return names.length > 0 ? names.join(", ") : fallback;
}

export function agencyGroupNamesSearchText(
  groups: readonly NamedAgencyGroup[] | null | undefined
): string {
  return sortAgencyGroupsByName(groups)
    .map((group) => group.name ?? "")
    .join(" ");
}
