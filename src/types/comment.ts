import { Attachment } from "./ticket"
import { User } from "./user"

export interface Comment {
    id: string
    ticket_id: string
    user_id: string
    content: string
    created_at: string
    updated_at: string
    attachments?: Attachment[]
    user?: User
  }
  
export interface DataComment {
  attachments?: File[]
  content: string
}

export interface DataUpdateComment {
  content: string
  _method: "PUT"
}

export interface ParamsComment {
  limit?: number
  page?: number
  isPaginate?: boolean
}

export type CommentFormData = FormData