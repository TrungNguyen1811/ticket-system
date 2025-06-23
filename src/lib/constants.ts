export const COLORS = {
  primary: "#4F46E5",
  secondary: "#6366F1",
  success: "#16A34A",
  danger: "#DC2626",
  warning: "#F59E0B",
  text: "#0F172A",
  background: "#F8FAFC",
} as const;

export const TICKET_STATUSES = [
  "new",
  "in_progress",
  "pending",
  "assigned",
  "complete",
  "archived",
] as const;

export const STATUS_OPTIONS = [
  { value: "in_progress", label: "In Progress", color: "yellow" },
  { value: "pending", label: "Pending", color: "purple" },
  { value: "complete", label: "Complete", color: "green" },
  { value: "archived", label: "Archived", color: "red" },
];

export const SHOW_STATUS_OPTIONS = [
  { value: "new", label: "New", color: "blue" },
  { value: "in_progress", label: "In Progress", color: "yellow" },
  { value: "pending", label: "Pending", color: "purple" },
  { value: "assigned", label: "Assigned", color: "orange" },
  { value: "complete", label: "Complete", color: "green" },
  { value: "archived", label: "Archived", color: "red" },
];
