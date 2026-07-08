import type {
  CreatePromotionPayload,
  Promotion,
  PromotionDetail,
  UpdatePromotionPayload,
} from "./types";

export type PromotionApiResponse = Promotion;
export type PromotionsListResponse = Promotion[];
export type PromotionDetailApiResponse = PromotionDetail;
export type CreatePromotionApiRequestPayload = CreatePromotionPayload;
export type CreatePromotionApiResponse = PromotionDetail;
export type UpdatePromotionApiRequestPayload = UpdatePromotionPayload;
export type UpdatePromotionApiResponse = PromotionDetail;
