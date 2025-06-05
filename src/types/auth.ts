export interface AuthUser {
  id: string
  name: string
  email: string
  role: "admin" | "user"
  avatar?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthContextType {
  user: AuthUser | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}



