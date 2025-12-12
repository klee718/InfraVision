export enum InfrastructureType {
  FLOODING = 'Flooding',
  POTHOLE = 'Pothole',
  STRUCTURAL = 'Structural Damage',
  TRASH = 'Trash Buildup',
  OTHER = 'Other'
}

export interface InfrastructureReport {
  id: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  severity: number; // 1-10
  type: string;
  waterDepthEstimate?: string;
  description: string;
  thumbnail?: string; // Base64 of the first frame/image
  address?: string;
  googleMapsUrl?: string;
  repairCostEstimate?: string;
  department?: string;
  departmentBudgetTotal?: number;
}

export interface BudgetItem {
  department: string;
  project: string;
  cost: number;
  status: 'Planned' | 'In Progress' | 'Completed' | 'Over Budget';
  year: number;
}

export interface AnalysisResult {
  severity: number;
  type: string;
  waterDepth: string;
  description: string;
  repairCost: string;
  department: string;
}

export interface SpatialAnalysisResult {
  imageBase64: string;
  summary: string;
  boxes: {
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
    label: string;
    reasoning: string;
  }[];
}

export type Tab = 'map' | 'budget' | 'spatial';