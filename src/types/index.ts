export interface DistrictProperties {
  district_id: string;
  district: string;
  state: string;
  population: number;
  total_beds: number;
  moh_beds: number;
  non_moh_beds: number;
  special_beds: number;
  beds_per_1k: number;
  moh_share_pct: number;
  equity_category: string;
  color_code: string;
  year: number;
}

export interface DistrictFeature {
  type: "Feature";
  id: string;
  properties: DistrictProperties;
  geometry: {
    type: string;
    coordinates: any;
  };
}

export interface HealthcareGeoJSON {
  type: "FeatureCollection";
  metadata: {
    title: string;
    sources: string[];
    total_districts: number;
    generated_at: string;
  };
  features: DistrictFeature[];
}

export type MetricViewMode = "ratio" | "total_beds" | "moh_share";
