export interface RatePlan {
  id: string;
  name: string;
  validityDateFrom: string;
  validityDateTo: string;
  payAtProperty: boolean;
  isActive: boolean;
}
