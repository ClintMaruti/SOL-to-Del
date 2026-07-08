export interface Contract {
  id: string;
  name: string;
  validFrom: string;
  validTo: string;
}

export interface FlightOptionData {
  operatingDays: string[];
  /** Local time, 12-hour string from API (e.g. `10:00 PM`). */
  timeFrom: string;
  /** Local time, 12-hour string from API (e.g. `11:34 PM`). */
  timeTo: string;
  flightNumber: string;
}

export interface ActivityOptionData {
  operatingDays?: string[] | null;
  /** Local time, 12-hour string from API when present. */
  timeFrom?: string;
  /** Local time, 12-hour string from API when present. */
  timeTo?: string;
}

export interface TransportOptionData {
  operatingDays?: string[] | null;
  /** Local time, 12-hour string from API when present. */
  timeFrom?: string;
  /** Local time, 12-hour string from API when present. */
  timeTo?: string;
}

export interface LinkedServiceOptionRef {
  serviceOptionId: string;
}

export interface ServiceOption {
  id: string;
  serviceId: string;
  title: string;
  includes: string;
  excludes: string;
  contractId: string | null;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  flightOption?: FlightOptionData;
  activityOption?: ActivityOptionData;
  transportOption?: TransportOptionData;
  accommodationOption?: LinkedServiceOptionRef;
  otherOption?: LinkedServiceOptionRef;
  feeOption?: LinkedServiceOptionRef;
}

export interface CreateServiceOptionPayload {
  serviceId: string;
  title: string;
  includes?: string;
  excludes?: string;
  contractId?: string | null;
  isActive?: boolean;
  flightOption?: FlightOptionData;
  activityOption?: ActivityOptionData;
  transportOption?: TransportOptionData;
  accommodationOption?: LinkedServiceOptionRef;
  otherOption?: LinkedServiceOptionRef;
  feeOption?: LinkedServiceOptionRef;
}

export interface UpdateServiceOptionPayload {
  title: string;
  includes?: string;
  excludes?: string;
  contractId?: string | null;
  isActive?: boolean;
  version: number;
  flightOption?: FlightOptionData;
  activityOption?: ActivityOptionData;
  transportOption?: TransportOptionData;
  accommodationOption?: LinkedServiceOptionRef;
  otherOption?: LinkedServiceOptionRef;
  feeOption?: LinkedServiceOptionRef;
}
