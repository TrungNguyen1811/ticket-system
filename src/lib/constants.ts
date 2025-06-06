export const TICKET_STATUSES = ["new", "in_progress", "waiting", "assigned", "complete", "force_closed"] as const

export const COLORS = {
  primary: "#4F46E5",
  secondary: "#6366F1",
  success: "#16A34A",
  danger: "#DC2626",
  warning: "#F59E0B",
  text: "#0F172A",
  background: "#F8FAFC",
} as const

export const STATUS_OPTIONS = [
  { value: "new", label: "Open", color: "blue" },
  { value: "in_progress", label: "In Progress", color: "yellow" },
  { value: "waiting", label: "Waiting", color: "orange" },
  { value: "assigned", label: "Assigned", color: "purple" },
  { value: "complete", label: "Complete", color: "green" },
  { value: "force_closed", label: "Cancelled", color: "red" },
]