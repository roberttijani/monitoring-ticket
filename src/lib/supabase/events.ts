import { createClient } from '@/utils/supabase/client'
import type { DbEvent, DbTicket, DbEventStaff } from '@/types/database'

const supabase = createClient()

// ─── Events ────────────────────────────────────────────────────

export async function fetchAllEvents() {
  // Fetch events
  const { data: events, error: eventsErr } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })

  if (eventsErr) throw eventsErr

  // Fetch all tickets
  const { data: tickets, error: ticketsErr } = await supabase
    .from('tickets')
    .select('*')

  if (ticketsErr) throw ticketsErr

  // Fetch all staff assignments
  const { data: staffAssignments, error: staffErr } = await supabase
    .from('event_staff')
    .select('*')

  if (staffErr) throw staffErr

  // Compose into frontend EventModel shape
  return (events as DbEvent[]).map(event => ({
    id: event.id,
    name: event.name,
    date: event.date,
    time: event.time,
    location: event.location,
    description: event.description,
    tickets: (tickets as DbTicket[])
      .filter(t => t.event_id === event.id)
      .map(t => ({
        id: t.id,
        name: t.name,
        price: t.price,
        totalQuota: t.total_quota,
        sold: t.sold,
        scanned: t.scanned,
      })),
    assignedStaffIds: (staffAssignments as DbEventStaff[])
      .filter(s => s.event_id === event.id)
      .map(s => s.user_id),
  }))
}

export async function insertEvent(event: {
  name: string
  date: string
  time: string
  location: string
  description: string
}) {
  const { data, error } = await supabase
    .from('events')
    .insert(event)
    .select()
    .single()

  if (error) throw error
  return data as DbEvent
}

export async function patchEvent(id: string, updates: Partial<DbEvent>) {
  const { error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

export async function destroyEvent(id: string) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ─── Tickets ───────────────────────────────────────────────────

export async function insertTicket(eventId: string, ticket: {
  name: string
  price: number
  total_quota: number
  sold: number
  scanned: number
}) {
  const { data, error } = await supabase
    .from('tickets')
    .insert({ ...ticket, event_id: eventId })
    .select()
    .single()

  if (error) throw error
  return data as DbTicket
}

export async function destroyTicket(ticketId: string) {
  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', ticketId)

  if (error) throw error
}

export async function patchTicket(ticketId: string, updates: Partial<DbTicket>) {
  const { data, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', ticketId)
    .select()
    .single()

  if (error) throw error
  return data as DbTicket
}

// ─── Staff Assignments ─────────────────────────────────────────

export async function insertStaffAssignment(eventId: string, userId: string) {
  const { error } = await supabase
    .from('event_staff')
    .insert({ event_id: eventId, user_id: userId })

  if (error) throw error
}

export async function removeStaffAssignment(eventId: string, userId: string) {
  const { error } = await supabase
    .from('event_staff')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId)

  if (error) throw error
}
