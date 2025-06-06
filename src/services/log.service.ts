import api from "@/lib/axios"
import { Response, DataResponse } from "@/types/reponse"
import { TicketAuditLog } from "@/types/ticket"

class LogService {
  // Get ticket audit logs
  async getTicketLogs(ticketId: string, params?: { page?: number; limit?: number }): Promise<Response<DataResponse<TicketAuditLog[]>>> {
    try {
      const response = await api.get<Response<DataResponse<TicketAuditLog[]>>>(`/tickets/${ticketId}/logs`, { params })
      return response.data
    } catch (error) {
      throw error
    }
  } 
}

export default new LogService()