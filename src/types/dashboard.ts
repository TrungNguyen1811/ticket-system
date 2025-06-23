export interface DashboardStats {
  total: number;
  new: number;
  in_progress: number;
  complete: number;
}

export interface DashboardStatsTime {
  avg_seconds: number;
  avg_hms: string;
  total: string;
}

export interface DashboardSummary {
  as_holder: DashboardStats;
  as_staff: DashboardStats;
  as_admin: DashboardStats;
}

export interface UserStats {
  as_holder: {
    stat: DashboardStats[];
    avg: DashboardStatsTime;
  };
  as_staff: {
    stat: DashboardStats[];
    avg: DashboardStatsTime;
  };
}

export interface AdminStats {
  stat: DashboardStats[];
  avg: DashboardStatsTime;
  staff_performance: StaffPerformance;
}

export interface TimeSeries {
  date: string;
  tickets: number;
  resolved: number;
  inProgress: number;
}
[];

export interface Activity {
  day: string;
  hour: string;
  value: number;
}
[];

export interface StaffPerformanceItem {
  name: string;
  total_tickets: number;
  resolved: number;
  in_progress: number;
  avg_resolution_time: number;
}

export type StaffPerformance = StaffPerformanceItem[];
