import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"

interface UserAvatarProps {
  name: string
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"
}

export function UserAvatar({ name, size = "md" }: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
    xl: "h-12 w-12 text-lg",
    "2xl": "h-16 w-16 text-2xl",
    "3xl": "h-20 w-20 text-3xl",
  }

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarFallback className="bg-indigo-100 text-indigo-600 font-medium">{getInitials(name)}</AvatarFallback>
    </Avatar>
  )
}
