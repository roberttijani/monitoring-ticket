import { createClient } from '@/utils/supabase/client'
import type { DbUser } from '@/types/database'
import bcrypt from 'bcryptjs'

const supabase = createClient()

const SALT_ROUNDS = 10

export async function fetchAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data as DbUser[]).map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as 'admin' | 'user',
  }))
}

export async function loginUser(email: string, password: string) {
  // Fetch user by email only — compare password hash client-side
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !data) return null

  const user = data as DbUser

  // Support both hashed and plaintext passwords (for migration)
  const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$')
  let isValid = false

  if (isHashed) {
    isValid = await bcrypt.compare(password, user.password)
  } else {
    // Plaintext comparison (legacy) — auto-upgrade to hash
    isValid = user.password === password
    if (isValid) {
      const hashed = await bcrypt.hash(password, SALT_ROUNDS)
      await supabase.from('users').update({ password: hashed }).eq('id', user.id)
    }
  }

  if (!isValid) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as 'admin' | 'user',
  }
}

export async function insertUser(user: {
  name: string
  email: string
  password: string
  role: 'admin' | 'user'
}) {
  // Hash password before storing
  const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS)

  const { data, error } = await supabase
    .from('users')
    .insert({ ...user, password: hashedPassword })
    .select()
    .single()

  if (error) throw error
  const created = data as DbUser
  return {
    id: created.id,
    name: created.name,
    email: created.email,
    role: created.role as 'admin' | 'user',
  }
}

export async function destroyUser(id: string) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)

  if (error) throw error
}
