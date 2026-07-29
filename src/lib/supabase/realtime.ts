// src/lib/supabase/realtime.ts
// Supabase Realtime subscription pada tabel `tickets`.
// Saat webhook Mayar menaikkan `sold`, semua dashboard yang terbuka
// langsung ter-update tanpa refresh.
//
// Cara pakai — tambahkan di komponen dashboard (client component):
//
//   import { useEffect } from 'react'
//   import { subscribeToTicketChanges } from '@/lib/supabase/realtime'
//
//   useEffect(() => subscribeToTicketChanges(), [])

import { createClient } from '@/utils/supabase/client'
import { useEventStore } from '@/store/eventStore'
import type { DbTicket } from '@/types/database'

export function subscribeToTicketChanges(): () => void {
  const supabase = createClient()

  const channel = supabase
    .channel('tickets-realtime')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'tickets' },
      (payload) => {
        const row = payload.new as DbTicket
        useEventStore.setState((state) => ({
          events: state.events.map((event) =>
            event.id !== row.event_id
              ? event
              : {
                  ...event,
                  tickets: event.tickets.map((t) =>
                    t.id !== row.id
                      ? t
                      : { ...t, sold: row.sold, scanned: row.scanned },
                  ),
                },
          ),
        }))
      },
    )
    // INSERT/DELETE tiket jarang terjadi live; refetch penuh saja agar simpel.
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'tickets' },
      () => useEventStore.getState().fetchEvents(),
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'tickets' },
      () => useEventStore.getState().fetchEvents(),
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
