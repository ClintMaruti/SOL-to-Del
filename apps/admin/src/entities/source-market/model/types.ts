/**
 * Source market item from GET /api/catalog/source-markets
 */
export interface SourceMarket {
  id: string;
  name: string;
  taxCode: string;
  code: string;
  isActive: boolean;
}
