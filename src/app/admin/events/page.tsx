"use client";

import { useState, useEffect } from "react";
import { useEventStore } from "@/store/eventStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Plus, Search, MapPin, Calendar, Clock, Edit2, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminEventsPage() {
    const router = useRouter();
    const { events, loading, deleteEvent, createEvent, fetchEvents } = useEventStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [newEvent, setNewEvent] = useState({
        name: "", date: "", time: "", location: "", description: ""
    });

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const filteredEvents = events.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreateEvent = async () => {
        if (!newEvent.name || !newEvent.date || !newEvent.time || !newEvent.location) return;
        setIsSubmitting(true);
        await createEvent({
            ...newEvent,
            tickets: [],
            assignedStaffIds: [],
        });
        setIsSubmitting(false);
        setIsCreateModalOpen(false);
        setNewEvent({ name: "", date: "", time: "", location: "", description: "" });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        await deleteEvent(deleteTarget.id);
        setIsDeleting(false);
        setDeleteTarget(null);
    };

    if (loading && events.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Events Management</h1>
                    <p className="text-surface-200 mt-1">Manage all your events, tickets, and staff assignments.</p>
                </div>
                <Button className="shrink-0 group" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Create New Event
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-100/50 pb-4">
                    <CardTitle>All Events</CardTitle>
                    <div className="relative w-full md:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-200" />
                        <Input
                            placeholder="Search events..."
                            className="pl-9 h-9 border-surface-100 bg-surface-50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-surface-100/50">
                        {filteredEvents.length === 0 ? (
                            <div className="p-12 text-center text-surface-200">
                                No events found matching your search.
                            </div>
                        ) : (
                            filteredEvents.map(event => (
                                <div key={event.id} className="p-6 flex flex-col xl:flex-row gap-6 hover:bg-surface-100/20 transition-colors">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-semibold text-foreground">{event.name}</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm text-surface-200">
                                            <div className="flex items-center gap-1.5 border border-surface-100/50 px-2.5 py-1 rounded-md bg-surface-50/50">
                                                <Calendar className="w-4 h-4 text-primary-400" />
                                                {event.date}
                                            </div>
                                            <div className="flex items-center gap-1.5 border border-surface-100/50 px-2.5 py-1 rounded-md bg-surface-50/50">
                                                <Clock className="w-4 h-4 text-primary-400" />
                                                {event.time}
                                            </div>
                                            <div className="flex items-center gap-1.5 border border-surface-100/50 px-2.5 py-1 rounded-md bg-surface-50/50">
                                                <MapPin className="w-4 h-4 text-primary-400" />
                                                {event.location}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 xl:w-64">
                                        <div className="text-center flex-1 p-3 bg-surface-100/30 rounded-xl">
                                            <p className="text-2xl font-bold text-foreground mb-1">{event.tickets.length}</p>
                                            <p className="text-[10px] font-medium text-surface-200 uppercase tracking-wider">Ticket Types</p>
                                        </div>
                                        <div className="text-center flex-1 p-3 bg-surface-100/30 rounded-xl">
                                            <p className="text-2xl font-bold text-foreground mb-1">{event.assignedStaffIds.length}</p>
                                            <p className="text-[10px] font-medium text-surface-200 uppercase tracking-wider">Assigned Staff</p>
                                        </div>
                                    </div>

                                    <div className="flex xl:flex-col items-center justify-end gap-2 shrink-0">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="w-full xl:w-32 border-surface-100/50 text-surface-200 hover:text-foreground"
                                            onClick={() => router.push(`/admin/events/${event.id}`)}
                                        >
                                            <Edit2 className="w-4 h-4 mr-2" />
                                            Manage
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            className="w-full xl:w-32"
                                            onClick={() => setDeleteTarget({ id: event.id, name: event.name })}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                title="Delete Event"
                message={`Are you sure you want to delete "${deleteTarget?.name}"? All tickets and staff assignments will also be removed. This action cannot be undone.`}
                confirmLabel="Delete Event"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteTarget(null)}
                loading={isDeleting}
            />

            {/* Create Event Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-lg border-surface-100/50 bg-surface-50 shadow-2xl">
                        <CardHeader className="border-b border-surface-100/50 flex flex-row items-center justify-between py-4">
                            <CardTitle className="text-lg">Create New Event</CardTitle>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 text-surface-200 hover:text-foreground hover:bg-surface-100 rounded-md">
                                <X className="w-5 h-5" />
                            </button>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Event Name</label>
                                <Input 
                                    placeholder="e.g. Music Festival 2026" 
                                    value={newEvent.name}
                                    onChange={e => setNewEvent({...newEvent, name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">Date</label>
                                    <Input 
                                        type="date"
                                        value={newEvent.date}
                                        onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">Time</label>
                                    <Input 
                                        type="time"
                                        value={newEvent.time}
                                        onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Location</label>
                                <div className="relative">
                                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-200" />
                                    <Input 
                                        placeholder="e.g. Gelora Bung Karno" 
                                        className="pl-9"
                                        value={newEvent.location}
                                        onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Description</label>
                                <textarea 
                                    placeholder="Brief description of the event..."
                                    className="w-full min-h-[80px] rounded-lg border border-surface-100 bg-surface-100/50 px-3 py-2 text-sm text-foreground placeholder:text-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
                                    value={newEvent.description}
                                    onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                                <Button 
                                    className="flex-1" 
                                    onClick={handleCreateEvent} 
                                    disabled={!newEvent.name || !newEvent.date || !newEvent.time || !newEvent.location || isSubmitting}
                                >
                                    {isSubmitting ? "Creating..." : "Create Event"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
