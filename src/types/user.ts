export interface User {
  id: string
  name: string
  email: string
  role?: string
  nickname: string
  picture: string
  updated_at: string
  sub: string
}

export interface Client {
  id: string
  name: string
  email: string
  ticketCount?: number
}


