import api from "@/lib/axios"
import type { User, Client } from "@/types/user"
import type { DataResponse, Response } from "@/types/reponse"

export interface CreateUserData {
  name: string
  email: string
  role: "admin" | "user"
  password: string
}

export interface UpdateUserData extends Partial<Omit<CreateUserData, "password">> {}

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

class UserService {
  // Users
  async getUsers(params: ParamsUser): Promise<DataResponse<User[]>> {
    try {
      const response = await api.get<Response<DataResponse<User[]>>>("/users", { params })
      return response.data.data
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

  async createUser(data: CreateUserData): Promise<User> {
    try {
      const response = await api.post<User>("/users", data)
      return response.data
    } catch (error) {
      throw error
    }
  }

  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    try {
      const response = await api.put<User>(`/users/${id}`, data)
      return response.data
    } catch (error) {
      throw error
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await api.delete(`/users/${id}`)
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

  async createClient(data: CreateClientData): Promise<Client> {
    try {
      const response = await api.post<Client>("/clients", data)
      return response.data
    } catch (error) {
      throw error
    }
  }

  async updateClient(id: string, data: UpdateClientData): Promise<Client> {
    try {
      const response = await api.put<Client>(`/clients/${id}`, data)
      return response.data
    } catch (error) {
      throw error
    }
  }

  async deleteClient(id: string): Promise<void> {
    try {
      await api.delete(`/clients/${id}`)
    } catch (error) {
      throw error
    }
  }
}

export const userService = new UserService()
