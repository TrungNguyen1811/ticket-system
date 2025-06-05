import api from "@/lib/axios"
import type { Ticket, Comment, AuditLog } from "@/types/ticket"

export interface TicketFilters {
  status?: string
  client_id?: string
  staff_id?: string
  holder_id?: string
  search?: string
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: "asc" | "desc"
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateTicketData {
  title: string
  description: string
  client_id: string
  holder_id?: string
  staff_id?: string
  priority?: "low" | "medium" | "high" | "urgent"
}

export interface UpdateTicketData extends Partial<CreateTicketData> {
  status?: "Open" | "In Progress" | "Done" | "Cancelled"
}

class TicketService {
  // Get all tickets with filters
  async getTickets(filters?: TicketFilters): Promise<PaginatedResponse<Ticket>> {
    try {
      const response = await api.get<PaginatedResponse<Ticket>>("/tickets", {
        params: filters,
      })
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Get single ticket by ID
  async getTicket(id: string): Promise<Ticket> {
    try {
      const response = await api.get<Ticket>(`/tickets/${id}`)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Create new ticket
  async createTicket(data: CreateTicketData): Promise<Ticket> {
    try {
      const response = await api.post<Ticket>("/tickets", data)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Update ticket
  async updateTicket(id: string, data: UpdateTicketData): Promise<Ticket> {
    try {
      const response = await api.put<Ticket>(`/tickets/${id}`, data)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Delete ticket
  async deleteTicket(id: string): Promise<void> {
    try {
      await api.delete(`/tickets/${id}`)
    } catch (error) {
      throw error
    }
  }

  // Assign staff to ticket
  async assignStaff(ticketId: string, staffId: string): Promise<Ticket> {
    try {
      const response = await api.post<Ticket>(`/tickets/${ticketId}/assign`, {
        staff_id: staffId,
      })
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Change ticket status
  async changeStatus(ticketId: string, status: string): Promise<Ticket> {
    try {
      const response = await api.post<Ticket>(`/tickets/${ticketId}/status`, {
        status,
      })
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Get ticket comments
  async getTicketComments(ticketId: string): Promise<Comment[]> {
    try {
      const response = await api.get<Comment[]>(`/tickets/${ticketId}/comments`)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Add comment to ticket
  async addComment(ticketId: string, content: string, attachments?: File[]): Promise<Comment> {
    try {
      const formData = new FormData()
      formData.append("content", content)

      if (attachments) {
        attachments.forEach((file) => {
          formData.append("attachments", file)
        })
      }

      const response = await api.post<Comment>(`/tickets/${ticketId}/comments`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Get ticket audit logs
  async getTicketAuditLogs(ticketId: string): Promise<AuditLog[]> {
    try {
      const response = await api.get<AuditLog[]>(`/tickets/${ticketId}/audit-logs`)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Upload attachments
  async uploadAttachments(ticketId: string, files: File[]): Promise<void> {
    try {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append("files", file)
      })

      await api.post(`/tickets/${ticketId}/attachments`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
    } catch (error) {
      throw error
    }
  }

  // Get dashboard stats
  async getDashboardStats(): Promise<{
    openTickets: number
    inProgressTickets: number
    doneTickets: number
    totalClients: number
    recentTickets: Ticket[]
  }> {
    try {
      const response = await api.get("/tickets/dashboard/stats")
      return response.data
    } catch (error) {
      throw error
    }
  }
}

export const ticketService = new TicketService()
