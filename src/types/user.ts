export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  nickname: string;
  picture: string;
  updated_at: string;
  created_at: string;
  sub: string;
  slack_connected: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  tickets_count?: number;
}
