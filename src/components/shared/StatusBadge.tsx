import { Badge } from "@/components/ui/badge"
import { SHOW_STATUS_OPTIONS } from "@/lib/constants"
import { cn, getStatusColor } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

interface TicketStatusDisplayProps {
  status: string
  variant?: "badge" | "icon" | "iconLabel"
}

export function TicketStatusDisplay({ status, variant = "badge" }: TicketStatusDisplayProps) {
  const statusOption = SHOW_STATUS_OPTIONS.find(s => s.value === status)

  if (!statusOption) return <Badge className="bg-gray-400">Unknown</Badge>

  if (variant === "icon") {
    return (
      <div className={cn("h-2 w-2 rounded-full", getStatusColor(statusOption.value || ""))} />
    )
  }

  if (variant === "iconLabel") {
    return (
      <div className="flex items-center">
        {getStatusIcon(statusOption.value || "")}
        <span className="ml-2">{statusOption.label}</span>
      </div>
    )
  }

  // default is badge
  return <Badge className={getStatusColor(statusOption.value || "")}>{statusOption.label}</Badge>
}

export const getStatusIcon = (status: string) => {
  const statusOption = SHOW_STATUS_OPTIONS.find(s => s.value === status)
  if (!statusOption) return <AlertCircle className="h-4 w-4 text-gray-600" />
  
  return (
    <div className={cn(
      "h-2 w-2 rounded-full",
      statusOption.color === "blue" && "bg-blue-500",
      statusOption.color === "yellow" && "bg-yellow-500",
      statusOption.color === "orange" && "bg-orange-500",
      statusOption.color === "purple" && "bg-purple-500",
      statusOption.color === "green" && "bg-green-500",
      statusOption.color === "red" && "bg-red-500",
    )} />
  )
}