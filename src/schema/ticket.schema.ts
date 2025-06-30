import { z } from "zod";

export const createTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().trim().optional(),
  client_email: z.string().email({ message: "Invalid email address" }),
});
export type CreateTicketSchema = z.infer<typeof createTicketSchema>;

export const updateTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, { message: "Title must be at least 5 characters" })
    .optional(),
  description: z.string().trim().optional(),
  status: z
    .enum(["new", "in_progress", "pending", "assigned", "complete", "archived"])
    .optional(),
  staff_id: z.string().optional(),
  _method: z.string().optional(),
});
export type UpdateTicketSchema = z.infer<typeof updateTicketSchema>;
