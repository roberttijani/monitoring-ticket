// Database row types (match Supabase table columns)

export interface DbUser {
  id: string
  name: string
  email: string
  password: string
  role: 'admin' | 'user'
  created_at: string
}

export interface DbEvent {
  id: string
  name: string
  date: string
  time: string
  location: string
  description: string
  created_at: string
}

export interface DbTicket {
  id: string
  event_id: string
  name: string
  price: number
  total_quota: number
  sold: number
  scanned: number
}

export interface DbEventStaff {
  event_id: string
  user_id: string
}
