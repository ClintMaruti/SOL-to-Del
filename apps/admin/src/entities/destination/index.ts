// API hooks
export {
  useDestinations,
  transformApiItemToDestination,
} from "./api/useDestinations";
export { useEligibleDestinations } from "./api/useEligibleDestinations";
export { useDestination } from "./api/useDestination";
export { useCountrySelectOptions } from "./api/useCountrySelectOptions";

// Types
export type {
  Destination,
  DestinationType,
  DestinationStatus,
  DestinationCoordinates,
  DestinationTypeOption,
  ParentDestinationOption,
} from "./model/types";
export type { DestinationApiItem } from "./model/api-types";

// Lib utilities
export {
  getAllDestinationTypes,
  getDestinationChildrenUnderCountry,
  getDestinationTypeConfig,
  findParentDestination,
  findDestinationById,
  findCountryDestinationIdByName,
  flattenDestinationTree,
  formatCoordinates,
  getRootDestinationCountryNames,
} from "./lib/destination-utils";
export {
  buildCountryDropdownGroups,
  type CountryDropdownGroupLabels,
  type CountrySelectOptionsContext,
} from "./lib/buildCountryDropdownGroups";
export {
  buildItineraryEligibleCountryOptionBuckets,
  type ItineraryDestinationCountryOption,
} from "./lib/buildItineraryEligibleCountryOptionBuckets";
