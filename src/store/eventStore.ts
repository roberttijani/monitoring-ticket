import { create } from 'zustand'
import {
    fetchAllEvents,
    insertEvent,
    patchEvent,
    destroyEvent,
    insertTicket,
    destroyTicket,
    patchTicket,
    insertStaffAssignment,
    removeStaffAssignment,
} from '@/lib/supabase/events'

export interface TicketType {
    id: string
    name: string
    price: number
    totalQuota: number
    sold: number
    scanned: number
}

export interface EventModel {
    id: string
    name: string
    date: string
    time: string
    location: string
    description: string
    tickets: TicketType[]
    assignedStaffIds: string[]
}

interface EventState {
    events: EventModel[]
    loading: boolean
    error: string | null
    selectedEventId: string | null
    setSelectedEventId: (id: string | null) => void
    fetchEvents: () => Promise<void>
    createEvent: (event: Omit<EventModel, 'id'>) => Promise<void>
    updateEvent: (id: string, updates: Partial<EventModel>) => Promise<void>
    deleteEvent: (id: string) => Promise<void>
    addTicket: (eventId: string, ticket: Omit<TicketType, 'id'>) => Promise<void>
    updateTicket: (eventId: string, ticketId: string, updates: Partial<TicketType>) => Promise<void>
    deleteTicket: (eventId: string, ticketId: string) => Promise<void>
    assignStaff: (eventId: string, staffId: string) => Promise<void>
    removeStaff: (eventId: string, staffId: string) => Promise<void>
}

export const useEventStore = create<EventState>((set, get) => ({
    events: [],
    loading: false,
    error: null,
    selectedEventId: null,
    setSelectedEventId: (id) => set({ selectedEventId: id }),

    fetchEvents: async () => {
        // Skip if already loaded and not stale
        set({ loading: true, error: null })
        try {
            const events = await fetchAllEvents()
            set({ events, loading: false })
        } catch (err: any) {
            set({ error: err.message || 'Failed to fetch events', loading: false })
        }
    },

    createEvent: async (event) => {
        set({ loading: true, error: null })
        try {
            const dbEvent = await insertEvent({
                name: event.name,
                date: event.date,
                time: event.time,
                location: event.location,
                description: event.description,
            })
            // Add the new event to local state with empty tickets/staff
            const newEvent: EventModel = {
                id: dbEvent.id,
                name: dbEvent.name,
                date: dbEvent.date,
                time: dbEvent.time,
                location: dbEvent.location,
                description: dbEvent.description,
                tickets: [],
                assignedStaffIds: [],
            }
            set((state) => ({ events: [...state.events, newEvent], loading: false }))
        } catch (err: any) {
            set({ error: err.message || 'Failed to create event', loading: false })
        }
    },

    updateEvent: async (id, updates) => {
        set({ loading: true, error: null })
        try {
            // Only send DB-compatible fields (not tickets/assignedStaffIds)
            const dbUpdates: Record<string, any> = {}
            if (updates.name !== undefined) dbUpdates.name = updates.name
            if (updates.date !== undefined) dbUpdates.date = updates.date
            if (updates.time !== undefined) dbUpdates.time = updates.time
            if (updates.location !== undefined) dbUpdates.location = updates.location
            if (updates.description !== undefined) dbUpdates.description = updates.description

            if (Object.keys(dbUpdates).length > 0) {
                await patchEvent(id, dbUpdates)
            }

            set((state) => ({
                events: state.events.map(ev => ev.id === id ? { ...ev, ...updates } : ev),
                loading: false,
            }))
        } catch (err: any) {
            set({ error: err.message || 'Failed to update event', loading: false })
        }
    },

    deleteEvent: async (id) => {
        set({ loading: true, error: null })
        try {
            await destroyEvent(id)
            set((state) => ({
                events: state.events.filter(ev => ev.id !== id),
                loading: false,
            }))
        } catch (err: any) {
            set({ error: err.message || 'Failed to delete event', loading: false })
        }
    },

    addTicket: async (eventId, ticket) => {
        set({ loading: true, error: null })
        try {
            const dbTicket = await insertTicket(eventId, {
                name: ticket.name,
                price: ticket.price,
                total_quota: ticket.totalQuota,
                sold: ticket.sold,
                scanned: ticket.scanned,
            })
            const newTicket: TicketType = {
                id: dbTicket.id,
                name: dbTicket.name,
                price: dbTicket.price,
                totalQuota: dbTicket.total_quota,
                sold: dbTicket.sold,
                scanned: dbTicket.scanned,
            }
            set((state) => ({
                events: state.events.map(ev =>
                    ev.id === eventId ? { ...ev, tickets: [...ev.tickets, newTicket] } : ev
                ),
                loading: false,
            }))
        } catch (err: any) {
            set({ error: err.message || 'Failed to add ticket', loading: false })
        }
    },

    updateTicket: async (eventId, ticketId, updates) => {
        set({ loading: true, error: null })
        try {
            const dbUpdates: Record<string, any> = {}
            if (updates.name !== undefined) dbUpdates.name = updates.name
            if (updates.price !== undefined) dbUpdates.price = updates.price
            if (updates.totalQuota !== undefined) dbUpdates.total_quota = updates.totalQuota
            if (updates.sold !== undefined) dbUpdates.sold = updates.sold
            if (updates.scanned !== undefined) dbUpdates.scanned = updates.scanned

            const dbTicket = await patchTicket(ticketId, dbUpdates)
            const updatedTicket: TicketType = {
                id: dbTicket.id,
                name: dbTicket.name,
                price: dbTicket.price,
                totalQuota: dbTicket.total_quota,
                sold: dbTicket.sold,
                scanned: dbTicket.scanned,
            }
            set((state) => ({
                events: state.events.map(ev =>
                    ev.id === eventId
                        ? { ...ev, tickets: ev.tickets.map(t => t.id === ticketId ? updatedTicket : t) }
                        : ev
                ),
                loading: false,
            }))
        } catch (err: any) {
            set({ error: err.message || 'Failed to update ticket', loading: false })
        }
    },

    deleteTicket: async (eventId, ticketId) => {
        set({ loading: true, error: null })
        try {
            await destroyTicket(ticketId)
            set((state) => ({
                events: state.events.map(ev =>
                    ev.id === eventId
                        ? { ...ev, tickets: ev.tickets.filter(t => t.id !== ticketId) }
                        : ev
                ),
                loading: false,
            }))
        } catch (err: any) {
            set({ error: err.message || 'Failed to delete ticket', loading: false })
        }
    },

    assignStaff: async (eventId, staffId) => {
        set({ loading: true, error: null })
        try {
            await insertStaffAssignment(eventId, staffId)
            set((state) => ({
                events: state.events.map(ev =>
                    ev.id === eventId && !ev.assignedStaffIds.includes(staffId)
                        ? { ...ev, assignedStaffIds: [...ev.assignedStaffIds, staffId] }
                        : ev
                ),
                loading: false,
            }))
        } catch (err: any) {
            set({ error: err.message || 'Failed to assign staff', loading: false })
        }
    },

    removeStaff: async (eventId, staffId) => {
        set({ loading: true, error: null })
        try {
            await removeStaffAssignment(eventId, staffId)
            set((state) => ({
                events: state.events.map(ev =>
                    ev.id === eventId
                        ? { ...ev, assignedStaffIds: ev.assignedStaffIds.filter(id => id !== staffId) }
                        : ev
                ),
                loading: false,
            }))
        } catch (err: any) {
            set({ error: err.message || 'Failed to remove staff', loading: false })
        }
    },
}))
