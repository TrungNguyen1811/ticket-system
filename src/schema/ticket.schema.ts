import { z } from "zod"

export const createTicketSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(5),
  client_email: z.string().email(),
})
export type CreateTicketSchema = z.infer<typeof createTicketSchema>

export const updateTicketSchema = z.object({
  title: z.string().min(5).optional(),
  description: z.string().min(5).optional(),
  status: z.enum(["new", "in_progress", "pending", "assigned", "complete", "force_closed"]).optional(),
  staff_id: z.string().optional(),
  _method: z.string().optional(),
})
export type UpdateTicketSchema = z.infer<typeof updateTicketSchema>