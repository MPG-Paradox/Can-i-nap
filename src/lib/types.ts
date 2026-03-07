export type District = 'north' | 'haifa' | 'center' | 'tel_aviv' | 'jerusalem' | 'south' | 'judea_samaria' | 'sharon';
export type ThreatSource = 'iran' | 'hezbollah' | 'both';
export type AlertSource = 'iran' | 'hezbollah' | 'dual' | 'unknown';
export type TrendDirection = 'increasing' | 'decreasing' | 'stable';
export type EscalationLevel = 'calm' | 'single_front' | 'dual_front' | 'heavy_barrage' | 'heavy_barrage_both';
export type Language = 'he' | 'en';

export interface Zone {
  hebrewName: string;
  englishName: string;
  district: District;
  lat: number;
  lng: number;
  timeToShelterSeconds: number;
  threatSource: ThreatSource;
  isRegion?: boolean;
  regionCities?: string[];
}

export interface Alert {
  id: string;
  timestamp: Date;
  category: number;
  title: string;
  cities: string[];
  source: AlertSource;
}

export interface StoredAlert {
  id: string;
  timestamp: string;
  category: number;
  title: string;
  cities: string[];
  source: AlertSource;
}

export interface OrefRealTimeResponse {
  id: string;
  cat: string;
  title: string;
  data: string[];
  desc: string;
}

export interface OrefHistoryItem {
  alertDate: string;
  title: string;
  data: string;
  category: number;
}

export interface RiskInput {
  zoneId: string;
  napDurationMinutes: number;
  alerts: Alert[];
  currentTime: Date;
}

export interface RiskResult {
  riskPercent: number;
  timeSinceLastMinutes: number;
  avgIntervalMinutes: number;
  volume24h: number;
  trend: TrendDirection;
  dualFrontStatus: DualFrontStatus;
  baseRisk: number;
  multipliers: {
    trendMultiplier: number;
    recencyMultiplier: number;
    dualFrontMultiplier: number;
  };
}

export interface DualFrontStatus {
  iranFront: {
    active: boolean;
    alertsLast6h: number;
    lastAlertTime: Date | null;
  };
  hezbollahFront: {
    active: boolean;
    alertsLast6h: number;
    lastAlertTime: Date | null;
  };
  dualFrontActive: boolean;
  escalationLevel: EscalationLevel;
  riskMultiplier: number;
}

export interface OptimalWindow {
  startTime: Date;
  endTime: Date;
  riskPercent: number;
}
