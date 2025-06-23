import { LoginSchema } from "@/schema/auth.schema";
import { User } from "./user";

export type LoginCredentials = LoginSchema;

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}
