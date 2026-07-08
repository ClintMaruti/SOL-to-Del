export interface Location {
  id: string;
  name: string;
  parentId: string;
  type: number;
  code: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  version: number;
}
