/**
 * Shared list of countries for use in forms (e.g. Supplier Head Office, Agency).
 * Values stored in forms/API use country name to match existing backend.
 * Data from i18n-iso-countries (ISO 3166-1).
 */

import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";

countries.registerLocale(en);

export interface Country {
  code: string;
  name: string;
}

const names = countries.getNames("en", { select: "official" }) as Record<
  string,
  string
>;

const sorted = Object.entries(names)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name));

/** Countries list (code + name), sorted by name. Use name as form/API value. */
export const COUNTRIES: Country[] = sorted;

/** Country names only, for Select options and validation. Same order as COUNTRIES. */
export const COUNTRY_NAMES: string[] = COUNTRIES.map((c) => c.name);

const COUNTRY_NAME_SET = new Set(COUNTRY_NAMES);

/**
 * Maps a country label from the destinations catalog (or free text) to the exact
 * official English name used in `COUNTRIES`, when i18n-iso-countries can
 * resolve it (e.g. "Tanzania" → "United Republic of Tanzania").
 */
export function resolveToIsoOfficialCountryName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (COUNTRY_NAME_SET.has(trimmed)) return trimmed;
  const alpha2 = countries.getAlpha2Code(trimmed, "en");
  if (!alpha2) return null;
  const official = countries.getName(alpha2, "en", { select: "official" });
  if (typeof official !== "string" || !COUNTRY_NAME_SET.has(official))
    return null;
  return official;
}

export type CountrySelectOption = { value: string; label: string };

function sortResolvedDestinationCountriesAlphabetical(
  resolvedUnique: string[]
): string[] {
  return [...resolvedUnique].sort((a, b) => a.localeCompare(b));
}

export interface CountrySelectOptionGroups {
  destinationCountries: CountrySelectOption[];
  otherCountries: CountrySelectOption[];
}

/**
 * Splits ISO country options into destination (catalog root countries that resolve
 * to ISO names) and all other countries. Each value appears in at most one group.
 * Resolved destination names are sorted A→Z (catalog `isPreferred` drives real pickers).
 */
export function buildCountrySelectOptionGroups(
  preferredCountryNames: string[]
): CountrySelectOptionGroups {
  const resolvedSet = new Set<string>();
  for (const name of preferredCountryNames) {
    const resolved = resolveToIsoOfficialCountryName(name);
    if (resolved) resolvedSet.add(resolved);
  }
  const ordered = sortResolvedDestinationCountriesAlphabetical([
    ...resolvedSet,
  ]);
  const destinationCountries: CountrySelectOption[] = ordered.map((name) => ({
    value: name,
    label: name,
  }));
  const destValues = new Set(destinationCountries.map((o) => o.value));
  const otherCountries: CountrySelectOption[] = COUNTRIES.filter(
    (c) => !destValues.has(c.name)
  ).map((c) => ({ value: c.name, label: c.name }));
  return { destinationCountries, otherCountries };
}

/**
 * Builds a flat list: destination countries first, then the rest alphabetically.
 * Each `value` appears once — duplicates break Radix Select (concatenated trigger text).
 */
export function buildCountrySelectOptions(
  preferredCountryNames: string[]
): CountrySelectOption[] {
  const { destinationCountries, otherCountries } =
    buildCountrySelectOptionGroups(preferredCountryNames);
  return [...destinationCountries, ...otherCountries];
}
