import { LoginSchema } from "@/schema/auth.schema"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: "admin" | "user"
  avatar?: string
}


export interface AuthContextType {
  user: AuthUser | null
  login: (credentials: LoginSchema) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}



