import { User } from "./user"

export interface Ticket {
  id: string
  client_id: string
  title: string
  description: string
  holder_id: string
  staff_id: string
  status: "new" | "in_progress" | "waiting" | "assigned" | "complete" | "force_closed"
  created_at: string
  updated_at: string
  client_email: string
  client_name: string
  holder: User | null
  staff: User | null
  logs?: TicketAuditLog[]
}

export interface TicketFilters {
  limit?: number
  page?: number
  status?: string
  search?: string
}

export interface CreateTicketData {
  title: string
  description: string
  client_email: string
}

export interface TicketAuditLog {
  id: string
  ticket_id: string
  action: string
  status: string
  to_status: string | null
  holder_id: string | null
  staff_id: string | null
  start_at: string
  end_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  holder?: User
  staff?: User
}

export interface Attachment {
  id: string
  filename: string
  file_path: string
  file_size: number
  content_type: string
  created_at: string
  updated_at: string
}



