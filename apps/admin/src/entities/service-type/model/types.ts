/**
 * Service type from GET /api/catalog/service-types
 */
export interface ServiceType {
  id: string;
  code: number;
  name: string;
  displayName: string;
  description: string;
}
