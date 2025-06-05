import { User } from "./user"

export interface Ticket {
  id: string
  client_id: string
  title: string
  description: string
  holder_id: string
  staff_id: string
  status: "Open" | "In Progress" | "Done" | "Cancelled"
  created_at: string
  updated_at: string
  client_email: string
  client_name: string
  holder: User | null
  staff: User | null
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

export interface Comment {
  id: string
  ticket_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  attachments?: Attachment[]
}

export interface AuditLog {
  id: string
  ticket_id: string
  user_id: string
  action: string
  old_value?: string
  new_value?: string
  created_at: string
}

export interface Attachment {
  id: string
  comment_id: string
  filename: string
  size: number
  type: string
}

