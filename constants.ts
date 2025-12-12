import { BudgetItem } from './types';

export const DISTRICT_30_CENTER = {
  lat: 40.715,
  lng: -73.880
};

export const MOCK_BUDGET_DATA: BudgetItem[] = [
  { department: "Sanitation", project: "District 30 Waste Removal Upgrade", cost: 1200000, status: "In Progress", year: 2024 },
  { department: "Transportation", project: "Queens Blvd Pothole Repair", cost: 450000, status: "Completed", year: 2023 },
  { department: "Environmental", project: "Flood Mitigation: Maspeth", cost: 3200000, status: "Planned", year: 2025 },
  { department: "Parks", project: "Juniper Valley Park Renovation", cost: 800000, status: "Over Budget", year: 2023 },
  { department: "Transportation", project: "Bike Lane Expansion", cost: 150000, status: "In Progress", year: 2024 },
  { department: "Education", project: "School Roof Repairs (PS 12)", cost: 2100000, status: "Planned", year: 2024 },
  { department: "Public Safety", project: "Intersection Cameras", cost: 300000, status: "Completed", year: 2023 },
];

export const INITIAL_SYSTEM_INSTRUCTION = `
You are an expert infrastructure analyst for the NYC City Council. 
Your job is to analyze images or video frames of city infrastructure issues (like flooding, potholes, trash).
Assess severity on a scale of 1-10 based on safety risk and cost to repair.
Estimate water depth if flooding is present.
Be concise and professional.
`;