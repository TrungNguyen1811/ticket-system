import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import lodash from "lodash"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function getInitials(name: string): string {
  if (!name) return ""
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "Open":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "In Progress":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "Done":
      return "bg-green-100 text-green-800 border-green-200"
    case "Cancelled":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

