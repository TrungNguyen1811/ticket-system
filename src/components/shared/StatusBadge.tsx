import { Badge } from "@/components/ui/badge"
import { STATUS_OPTIONS } from "@/lib/constants"
import { cn, getStatusColor } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge className={getStatusColor(status)}>{status}</Badge>
}

export const getStatusIcon = (status: string) => {
  const statusOption = STATUS_OPTIONS.find(s => s.value === status)
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