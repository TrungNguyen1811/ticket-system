import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"

interface UserAvatarProps {
  name: string
  size?: "sm" | "md" | "lg"
}

export function UserAvatar({ name, size = "md" }: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  }

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarFallback className="bg-indigo-100 text-indigo-600 font-medium">{getInitials(name)}</AvatarFallback>
    </Avatar>
  )
}
