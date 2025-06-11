import api from "@/lib/axios"
import { DataResponse, Response } from "@/types/reponse"
import { AdminStats, DashboardSummary, UserStats } from "@/types/dashboard"

export interface DashboardParams {
  range: "today" | "last_7_days" | "last_month" | "this_month"
}

class DashboardService {
  async getSummary() {
    const response = await api.get<Response<DataResponse<DashboardSummary>>>("/dashboard/summary")
    return response.data
  }

  async getUserStats(params: DashboardParams) {
    const response = await api.get<Response<DataResponse<UserStats>>>("/dashboard/user-stats", { params })
    return response.data
  }
  
  async getAdminStats(params: DashboardParams) {
    const response = await api.get<Response<DataResponse<AdminStats>>>("/dashboard/admin-stats", { params })
    return response.data
  }
}
export const dashboardService = new DashboardService()
