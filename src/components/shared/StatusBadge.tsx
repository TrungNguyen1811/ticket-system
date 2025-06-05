import { Badge } from "@/components/ui/badge"
import { getStatusColor } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge className={getStatusColor(status)}>{status}</Badge>
}
