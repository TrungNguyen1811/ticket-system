export interface DashboardSummary {
  as_holder: {
    total: number;
    new: number;
    in_progress: number;
    complete: number;
  };
  as_staff: {
    total: number;
    new: number;
    in_progress: number;
    complete: number;
  };
  as_admin: {
    total: number;
    new: number;
    in_progress: number;
    complete: number;
  };
}

export interface UserStats {
  as_holder: {
    stat: {
      date: string;
      total: number;
      new: number;
      in_progress: number;
      complete: number;
    }[];
    avg: {
      avg_seconds: number;
      avg_hms: string;
      total: string;
    };
  };
  as_staff: {
    stat: {
      date: string;
      total: number;
      new: number;
      in_progress: number;
      complete: number;
    }[];
    avg: {
      avg_seconds: number;
      avg_hms: string;
      total: string;
    };
  };
}

export interface AdminStats {
  stat: {
    date: string;
    total: number;
    new: number;
    in_progress: number;
    complete: number;
  }[];
  avg: {
    avg_seconds: number;
    avg_hms: string;
    total: string;
  };
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
