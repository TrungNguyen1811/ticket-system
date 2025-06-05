import type { User, Client, Ticket, Comment, AuditLog } from "../types"

export const mockUsers: User[] = [
  { id: "user1", name: "John Admin", email: "admin@example.com", role: "Admin" },
  { id: "user2", name: "Sarah Staff", email: "staff@example.com", role: "Staff" },
  { id: "user3", name: "Mike Support", email: "mike@example.com", role: "Staff" },
  { id: "user4", name: "Lisa Manager", email: "manager@example.com", role: "Manager" },
  { id: "user5", name: "Tom Tech", email: "tom@example.com", role: "Staff" },
]

export const mockClients: Client[] = [
  { id: "client1", name: "Company ABC", email: "contact@abc.com", ticketCount: 5 },
  { id: "client2", name: "XYZ Corporation", email: "support@xyz.com", ticketCount: 3 },
  { id: "client3", name: "Tech Solutions Ltd", email: "info@techsolutions.com", ticketCount: 8 },
  { id: "client4", name: "Digital Innovations", email: "hello@digital.com", ticketCount: 2 },
  { id: "client5", name: "Global Systems", email: "contact@global.com", ticketCount: 6 },
]

export const mockTickets: Ticket[] = [
  {
    id: "ticket1",
    client_id: "client1",
    title: "Screen not working",
    description: "The computer screen is black after power on. Need urgent assistance.",
    holder_id: "user1",
    staff_id: "user2",
    status: "Open",
    created_at: "2025-06-01T08:00:00Z",
    updated_at: "2025-06-02T09:00:00Z",
  },
  {
    id: "ticket2",
    client_id: "client2",
    title: "Network connectivity issues",
    description: "Unable to connect to the internet from office computers.",
    holder_id: "user1",
    staff_id: "user3",
    status: "In Progress",
    created_at: "2025-06-01T10:30:00Z",
    updated_at: "2025-06-02T14:15:00Z",
  },
  {
    id: "ticket3",
    client_id: "client3",
    title: "Software installation request",
    description: "Need to install new accounting software on 5 workstations.",
    holder_id: "user4",
    staff_id: "user2",
    status: "Done",
    created_at: "2025-05-28T09:00:00Z",
    updated_at: "2025-06-01T16:30:00Z",
  },
  {
    id: "ticket4",
    client_id: "client1",
    title: "Email server down",
    description: "Email server is not responding. All email services are down.",
    holder_id: "user1",
    staff_id: "user5",
    status: "Open",
    created_at: "2025-06-02T07:45:00Z",
    updated_at: "2025-06-02T07:45:00Z",
  },
  {
    id: "ticket5",
    client_id: "client4",
    title: "Printer maintenance",
    description: "Regular maintenance required for office printers.",
    holder_id: "user4",
    staff_id: "user3",
    status: "Cancelled",
    created_at: "2025-05-30T11:00:00Z",
    updated_at: "2025-06-01T13:20:00Z",
  },
]

export const mockComments: Comment[] = [
  {
    id: "comment1",
    ticket_id: "ticket1",
    user_id: "user2",
    content: "I have checked the power connections and they seem fine. Will investigate further.",
    created_at: "2025-06-02T09:30:00Z",
    updated_at: "2025-06-02T09:30:00Z",
  },
  {
    id: "comment2",
    ticket_id: "ticket1",
    user_id: "user1",
    content: "Please also check if the monitor cable is properly connected.",
    created_at: "2025-06-02T10:00:00Z",
    updated_at: "2025-06-02T10:00:00Z",
  },
  {
    id: "comment3",
    ticket_id: "ticket2",
    user_id: "user3",
    content: "Network diagnostics completed. Found issues with the main router.",
    created_at: "2025-06-02T14:15:00Z",
    updated_at: "2025-06-02T14:15:00Z",
  },
]

export const mockAuditLogs: AuditLog[] = [
  {
    id: "audit1",
    ticket_id: "ticket1",
    user_id: "user1",
    action: "Status Changed",
    old_value: "Open",
    new_value: "In Progress",
    created_at: "2025-06-02T09:00:00Z",
  },
  {
    id: "audit2",
    ticket_id: "ticket1",
    user_id: "user1",
    action: "Staff Assigned",
    old_value: "",
    new_value: "user2",
    created_at: "2025-06-01T08:30:00Z",
  },
  {
    id: "audit3",
    ticket_id: "ticket3",
    user_id: "user4",
    action: "Status Changed",
    old_value: "In Progress",
    new_value: "Done",
    created_at: "2025-06-01T16:30:00Z",
  },
]
