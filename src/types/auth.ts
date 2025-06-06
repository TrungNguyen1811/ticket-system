import { LoginSchema } from "@/schema/auth.schema"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: "admin" | "user"
  avatar?: string
}

export type LoginCredentials = LoginSchema

export interface AuthContextType {
  user: AuthUser | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}



