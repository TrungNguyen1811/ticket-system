export const TICKET_STATUSES = ["new", "in_progress", "pending", "assigned", "complete", "archived"] as const

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
  // { value: "new", label: "Open", color: "blue" },
  { value: "in_progress", label: "In Progress", color: "yellow" },
  { value: "pending", label: "Pending", color: "orange" },
  // { value: "assigned", label: "Assigned", color: "purple" },
  { value: "complete", label: "Complete", color: "green" },
  { value: "archived", label: "Archived", color: "red" },
]

export const SEARCH_STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending", label: "Pending" },
  { value: "assigned", label: "Assigned" },
  { value: "complete", label: "Complete" },
  { value: "archived", label: "Archived" },
]

export const SHOW_STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending", label: "Pending" },
  { value: "assigned", label: "Assigned" },
  { value: "complete", label: "Complete" },
  { value: "archived", label: "Archived" },
]
  
 