export interface Promotion {
  id: string;
  name: string;
  headOfficeId: string;
  bookingWindowFrom: string;
  bookingWindowTo: string;
  isActive: boolean;
}

export const PROMOTION_SELECT_ANY_VALUE = "__PROMOTION_ANY__";

export const PROMOTION_PAX_CODES = ["ANY", "ADT", "CHD", "INF", "YTH"] as const;

export type PromotionPaxCode = (typeof PROMOTION_PAX_CODES)[number];

export const PROMOTION_CONDITION_TYPES = [
  "SupplierNights",
  "SuppliersTotal",
  "NightsTotal",
  "PaxNumber",
  "PaxAge",
] as const;

export type PromotionConditionType = (typeof PROMOTION_CONDITION_TYPES)[number];

export const PROMOTION_TARGET_NIGHTS_TYPES = [
  "ANY",
  "Cheapest",
  "Average",
  "AnyFromFirst",
  "AnyFromLast",
  "ByIndex",
] as const;

export type PromotionTargetNightsType =
  (typeof PROMOTION_TARGET_NIGHTS_TYPES)[number];

export const PROMOTION_ACTION_TYPES = ["DiscountPercentage", "AddOn"] as const;

export type PromotionActionType = (typeof PROMOTION_ACTION_TYPES)[number];

export interface PromotionTravelDateRange {
  id?: string;
  from: string;
  to: string;
  version?: number;
}

export interface PromotionBookingWindow {
  from: string;
  to: string;
}

export interface PromotionBookingWindowRelative {
  fromDays: number | null;
  toDays: number | null;
}

export interface PromotionSupplierNightsCondition {
  id?: string;
  type: "SupplierNights";
  supplierId: string | null;
  serviceId: string | null;
  optionText: string | null;
  minNights: number | null;
  maxNights: number | null;
  version?: number;
}

export interface PromotionSuppliersTotalCondition {
  id?: string;
  type: "SuppliersTotal";
  minSuppliers: number | null;
  maxSuppliers: number | null;
  version?: number;
}

export interface PromotionNightsTotalCondition {
  id?: string;
  type: "NightsTotal";
  minNights: number | null;
  maxNights: number | null;
  version?: number;
}

export interface PromotionPaxNumberCondition {
  id?: string;
  type: "PaxNumber";
  paxCode: PromotionPaxCode;
  minPax: number | null;
  maxPax: number | null;
  version?: number;
}

export interface PromotionPaxAgeCondition {
  id?: string;
  type: "PaxAge";
  paxCode: PromotionPaxCode;
  minAge: number | null;
  maxAge: number | null;
  version?: number;
}

export type PromotionCondition =
  | PromotionSupplierNightsCondition
  | PromotionSuppliersTotalCondition
  | PromotionNightsTotalCondition
  | PromotionPaxNumberCondition
  | PromotionPaxAgeCondition;

export interface PromotionDiscountRow {
  id?: string;
  discountPercent: number | null;
  paxCode: PromotionPaxCode;
  paxIndexFrom: number | null;
  paxIndexTo: number | null;
  targetNightsType: PromotionTargetNightsType;
  nightIndexFrom: number | null;
  nightIndexTo: number | null;
}

export interface PromotionDiscountPercentageAction {
  id?: string;
  type: "DiscountPercentage";
  rows: PromotionDiscountRow[];
  version?: number;
}

export interface PromotionAddOnItem {
  id?: string;
  value: string;
}

export interface PromotionAddOnAction {
  id?: string;
  type: "AddOn";
  items: PromotionAddOnItem[];
  version?: number;
}

export type PromotionAction =
  | PromotionDiscountPercentageAction
  | PromotionAddOnAction;

export const PROMOTION_DETAIL_PAX_TYPES = [
  "Any",
  "Adult",
  "Child",
  "Infant",
  "Teen",
] as const;

export type PromotionDetailPaxType =
  (typeof PROMOTION_DETAIL_PAX_TYPES)[number];

export interface PromotionDetailNote {
  id: string;
  text: string;
  version: number;
}

export interface PromotionDetailRangeValue {
  min: number;
  max: number;
}

export interface PromotionDetailCondition {
  id: string;
  type: PromotionConditionType;
  supplierId: string | null;
  serviceId: string | null;
  optionText: string | null;
  paxType: PromotionDetailPaxType | null;
  nights: PromotionDetailRangeValue | null;
  suppliers: PromotionDetailRangeValue | null;
  nightsTotal: PromotionDetailRangeValue | null;
  paxCount: PromotionDetailRangeValue | null;
  age: PromotionDetailRangeValue | null;
  version: number;
}

export type PromotionDiscountTargetType = "Pax" | "Nights";

export interface PromotionDetailAddOn {
  id: string;
  serviceTypeId: string | null;
  name: string;
  version: number;
}

export interface PromotionDetailDiscount {
  id: string;
  discountPercent: number | null;
  targetType: PromotionDiscountTargetType;
  paxType: PromotionDetailPaxType | null;
  paxIndexFrom: number | null;
  paxIndexTo: number | null;
  targetNightsType: PromotionTargetNightsType;
  nightsIndexFrom: number | null;
  nightsIndexTo: number | null;
  version: number;
}

export interface PromotionDetailAction {
  id: string;
  type: PromotionActionType;
  addOn: PromotionDetailAddOn | null;
  discount: PromotionDetailDiscount | null;
  version: number;
}

export interface PromotionDetail {
  id: string;
  name: string;
  headOfficeId: string;
  isPartiallySupported: boolean;
  note: PromotionDetailNote | null;
  travelDates: PromotionTravelDateRange[];
  bookingWindow: PromotionBookingWindow;
  bookingWindowRelative: {
    fromDays: number;
    toDays: number;
  } | null;
  conditions: PromotionDetailCondition[];
  actions: PromotionDetailAction[];
  isActive: boolean;
  version: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PromotionFormTravelDateRange {
  id: string;
  from: string;
  to: string;
  version?: number | null;
}

export interface PromotionFormBookingWindowRelative {
  fromDays: number | null;
  toDays: number | null;
}

export interface PromotionFormSupplierNightsCondition {
  id: string;
  type: "SupplierNights";
  supplierId: string | null;
  serviceId: string | null;
  optionText: string;
  minNights: number | null;
  maxNights: number | null;
  version?: number | null;
}

export interface PromotionFormSuppliersTotalCondition {
  id: string;
  type: "SuppliersTotal";
  minSuppliers: number | null;
  maxSuppliers: number | null;
  version?: number | null;
}

export interface PromotionFormNightsTotalCondition {
  id: string;
  type: "NightsTotal";
  minNights: number | null;
  maxNights: number | null;
  version?: number | null;
}

export interface PromotionFormPaxNumberCondition {
  id: string;
  type: "PaxNumber";
  paxCode: PromotionPaxCode;
  minPax: number | null;
  maxPax: number | null;
  version?: number | null;
}

export interface PromotionFormPaxAgeCondition {
  id: string;
  type: "PaxAge";
  paxCode: PromotionPaxCode;
  minAge: number | null;
  maxAge: number | null;
  version?: number | null;
}

export type PromotionFormCondition =
  | PromotionFormSupplierNightsCondition
  | PromotionFormSuppliersTotalCondition
  | PromotionFormNightsTotalCondition
  | PromotionFormPaxNumberCondition
  | PromotionFormPaxAgeCondition;

export interface PromotionFormDiscountRow {
  id: string;
  discountPercent: number | null;
  paxCode: PromotionPaxCode;
  paxIndexFrom: number | null;
  paxIndexTo: number | null;
  targetNightsType: PromotionTargetNightsType;
  nightIndexFrom: number | null;
  nightIndexTo: number | null;
  version?: number | null;
  actionId?: string | null;
  actionVersion?: number | null;
}

export interface PromotionFormDiscountPercentageAction {
  id: string;
  type: "DiscountPercentage";
  rows: PromotionFormDiscountRow[];
}

export interface PromotionFormAddOnItem {
  id: string;
  itemType?: "Other" | "Activity";
  value: string;
  version?: number | null;
  actionId?: string | null;
  actionVersion?: number | null;
  serviceTypeId?: string | null;
}

export interface PromotionFormAddOnAction {
  id: string;
  type: "AddOn";
  items: PromotionFormAddOnItem[];
}

export type PromotionFormAction =
  | PromotionFormDiscountPercentageAction
  | PromotionFormAddOnAction;

export interface PromotionFormValues {
  version?: number | null;
  name: string;
  isPartiallySupported: boolean;
  note: string;
  noteId?: string | null;
  noteVersion?: number | null;
  travelDates: PromotionFormTravelDateRange[];
  bookingWindow: PromotionBookingWindow;
  bookingWindowRelative: PromotionFormBookingWindowRelative;
  conditions: PromotionFormCondition[];
  actions: PromotionFormAction[];
  isActive: boolean;
}

interface PromotionWritePayloadNote {
  id?: string;
  text: string;
  version?: number;
}

interface PromotionWritePayloadTravelDate {
  id?: string;
  version?: number;
  from: string;
  to: string;
}

interface PromotionWritePayloadCondition {
  id?: string;
  version?: number;
  type: PromotionConditionType;
  supplierId: string | null;
  serviceId: string | null;
  optionText: string | null;
  paxType: PromotionDetailPaxType | null;
  nights: PromotionWritePayloadRangeValue | null;
  suppliers: PromotionWritePayloadRangeValue | null;
  nightsTotal: PromotionWritePayloadRangeValue | null;
  paxCount: PromotionWritePayloadRangeValue | null;
  age: PromotionWritePayloadRangeValue | null;
}

interface PromotionWritePayloadAddOn {
  id?: string;
  version?: number;
  serviceTypeId: string | null;
  name: string;
}

interface PromotionWritePayloadDiscount {
  id?: string;
  version?: number;
  discountPercent: number | null;
  targetType: PromotionDiscountTargetType;
  paxType: PromotionDetailPaxType | null;
  paxIndexFrom: number | null;
  paxIndexTo: number | null;
  targetNightsType: PromotionTargetNightsType;
  nightsIndexFrom: number | null;
  nightsIndexTo: number | null;
}

interface PromotionWritePayloadRangeValue {
  min: number | null;
  max: number | null;
}

interface PromotionWritePayloadAction {
  id?: string;
  version?: number;
  type: PromotionActionType;
  addOn: PromotionWritePayloadAddOn | null;
  discount: PromotionWritePayloadDiscount | null;
}

interface PromotionWritePayloadBase {
  name: string;
  isPartiallySupported: boolean;
  note: PromotionWritePayloadNote | null;
  travelDates: PromotionWritePayloadTravelDate[];
  bookingWindow: PromotionBookingWindow;
  bookingWindowRelative: PromotionBookingWindowRelative | null;
  conditions: PromotionWritePayloadCondition[];
  actions: PromotionWritePayloadAction[];
  isActive: boolean;
}

export interface CreatePromotionPayload extends PromotionWritePayloadBase {}

export interface UpdatePromotionPayload extends PromotionWritePayloadBase {
  version: number;
}

export type PromotionWritePayload =
  | CreatePromotionPayload
  | UpdatePromotionPayload;
