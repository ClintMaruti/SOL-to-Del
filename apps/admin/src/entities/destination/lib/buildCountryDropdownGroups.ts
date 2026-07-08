import {
  COUNTRIES,
  resolveToIsoOfficialCountryName,
} from "@/shared/lib/countries";
import type { DropdownSelectOptionGroup } from "@/shared/ui";

import type { Destination } from "../model/types";

export type CountrySelectOptionsContext = "supplier" | "agencyOrHeadOffice";

interface RootCountryRow {
  id: string;
  name: string;
  isPreferred: boolean;
}

function collectActiveRootCountries(
  destinations: Destination[] | undefined
): RootCountryRow[] {
  if (!destinations?.length) {
    return [];
  }

  const rows: RootCountryRow[] = [];
  const seen = new Set<string>();

  for (const d of destinations) {
    if (d.type !== "Country") {
      continue;
    }
    if (d.status === "Inactive") {
      continue;
    }
    const key = d.name.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    rows.push({ id: d.id, name: d.name, isPreferred: !!d.isPreferred });
  }

  rows.sort((a, b) => a.name.localeCompare(b.name));
  return rows;
}

function isoNamesReservedByCatalog(rows: RootCountryRow[]): Set<string> {
  const reserved = new Set<string>();
  for (const { name } of rows) {
    reserved.add(name);
    const official = resolveToIsoOfficialCountryName(name);
    if (official) {
      reserved.add(official);
    }
  }
  return reserved;
}

export interface CountryDropdownGroupLabels {
  preferred: string;
  otherCatalog: string;
  allCountries: string;
}

/**
 * Builds grouped country options: preferred catalog countries (A→Z), other catalog
 * countries (A→Z), and optionally the full ISO list excluding catalog-resolved names.
 * Supplier catalog options use {@link Destination.id} as value and {@link Destination.name} as label.
 * Agency / head office catalog segments use ISO official names as values and
 * catalog names as labels; the full ISO list excludes catalog-resolved names.
 */
export function buildCountryDropdownGroups(
  destinations: Destination[] | undefined,
  context: CountrySelectOptionsContext,
  labels: CountryDropdownGroupLabels
): DropdownSelectOptionGroup[] {
  const roots = collectActiveRootCountries(destinations);
  const preferred = roots.filter((r) => r.isPreferred);
  const otherCatalog = roots.filter((r) => !r.isPreferred);

  const toOptions =
    context === "supplier"
      ? (list: RootCountryRow[]) =>
          list.map((r) => ({ value: r.id, label: r.name }))
      : (list: RootCountryRow[]) =>
          list.map((r) => {
            const value = resolveToIsoOfficialCountryName(r.name) ?? r.name;
            return { value, label: r.name };
          });

  const groups: DropdownSelectOptionGroup[] = [];

  if (preferred.length > 0) {
    groups.push({
      label: labels.preferred,
      options: toOptions(preferred),
    });
  }

  if (otherCatalog.length > 0) {
    groups.push({
      label: labels.otherCatalog,
      options: toOptions(otherCatalog),
    });
  }

  if (context === "agencyOrHeadOffice") {
    const reserved = isoNamesReservedByCatalog(roots);
    const restIso = COUNTRIES.filter((c) => !reserved.has(c.name)).map((c) => ({
      value: c.name,
      label: c.name,
    }));
    groups.push({
      label: labels.allCountries,
      options: restIso,
    });
  }

  return groups;
}
