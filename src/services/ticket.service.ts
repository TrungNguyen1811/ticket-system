import api from "@/lib/axios";
import { DataResponse, Response } from "@/types/reponse";
import type { Status, Ticket } from "@/types/ticket";

export interface TicketFilters {
  status?: string;
  client_id?: string;
  staff_id?: string;
  holder_id?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface CreateTicketData {
  title: string;
  description: string;
  client_email: string;
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  status?: Status;
  staff_id?: string;
  _method?: "PUT";
}

export interface UpdateAuditLogData {
  status?: string;
  to_status?: string;
  holder_id?: string;
  staff_id?: string;
  end_at?: string;
  _method?: "PUT";
}

class TicketService {
  // Get all tickets with filters
  async getTickets(
    filters?: TicketFilters,
  ): Promise<Response<DataResponse<Ticket[]>>> {
    try {
      const response = await api.get<Response<DataResponse<Ticket[]>>>(
        "/tickets",
        {
          params: filters,
        },
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get single ticket by ID
  async getTicket(id: string): Promise<Response<Ticket>> {
    try {
      const response = await api.get<Response<Ticket>>(`/tickets/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Create new ticket
  async createTicket(data: CreateTicketData): Promise<Response<Ticket>> {
    try {
      const response = await api.post<Response<Ticket>>("/tickets", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Update ticket
  async updateTicket(
    id: string,
    data: UpdateTicketData,
  ): Promise<Response<Ticket>> {
    try {
      const response = await api.post<Response<Ticket>>(`/tickets/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Delete ticket
  async deleteTicket(id: string): Promise<Response<DataResponse<boolean>>> {
    try {
      const response = await api.delete<Response<DataResponse<boolean>>>(
        `/tickets/${id}`,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
export const ticketService = new TicketService();
