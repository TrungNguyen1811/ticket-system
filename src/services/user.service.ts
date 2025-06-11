import api from "@/lib/axios"
import type { User, Client } from "@/types/user"
import type { DataResponse, Response } from "@/types/reponse"

export interface UpdateUserRoleData {
  role: "admin" | "user"
  _method?: "PUT"
}

export interface CreateClientData {
  name: string
  email: string
  phone?: string
  address?: string
}

export interface UpdateClientData extends Partial<CreateClientData> {}

export interface ParamsUser {
  limit?: number
  page?: number
  isPaginate?: boolean
  role?: string
  search?: string
}

export interface UserFilters {
  role?: string
  client_id?: string
  staff_id?: string
  holder_id?: string
  search?: string
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: "asc" | "desc"
  isPaginate?: boolean
}

export interface CreateUserData {
  email: string
  name: string
  role: 'admin' | 'user'
}

class UserService {
  // Users
  async getUsers(params: ParamsUser): Promise<Response<DataResponse<User[]>>> {
    try {
      const response = await api.get<Response<DataResponse<User[]>>>("/users", { params })
      return response.data
    } catch (error) {
      throw error
    }
  }

  async getUser(id: string): Promise<User> {
    try {
      const response = await api.get<User>(`/users/${id}`)
      return response.data
    } catch (error) {
      throw error
    }
  }

  //update user role
  async updateUserRole(id: string, data: UpdateUserRoleData): Promise<Response<User>> {
    try {
      const response = await api.post<Response<User>>(`/users/${id}`, data)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Clients
  async getClients(): Promise<Client[]> {
    try {
      const response = await api.get<Client[]>("/clients")
      return response.data
    } catch (error) {
      throw error
    }
  }

  async getClient(id: string): Promise<Client> {
    try {
      const response = await api.get<Client>(`/clients/${id}`)
      return response.data
    } catch (error) {
      throw error
    }
  }
}

export const userService = new UserService()
