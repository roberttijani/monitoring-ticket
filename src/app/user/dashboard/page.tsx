"use client";

import { useEventStore } from "@/store/eventStore";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ticket, BarChart3, Calendar, Clock, RefreshCw, Search } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

export default function UserDashboard() {
    const { events, loading, fetchEvents, selectedEventId } = useEventStore();
    const { user } = useAuthStore();
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Reset search when event changes
    useEffect(() => {
        setSearchTerm("");
    }, [selectedEventId]);

    const assignedEvents = useMemo(
        () => events.filter(e => e.assignedStaffIds.includes(user?.id || '')),
        [events, user?.id]
    );

    const selectedEvent = useMemo(
        () => assignedEvents.find(e => e.id === selectedEventId) || null,
        [assignedEvents, selectedEventId]
    );

    const tickets = useMemo(() => {
        if (!selectedEvent) return [];
        return selectedEvent.tickets;
    }, [selectedEvent]);

    const filteredTickets = useMemo(
        () => tickets.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [tickets, searchTerm]
    );

    const totalSold = useMemo(() => tickets.reduce((sum, t) => sum + t.sold, 0), [tickets]);
    const totalRevenue = useMemo(() => tickets.reduce((sum, t) => sum + (t.price * t.sold), 0), [tickets]);
    const totalQuota = useMemo(() => tickets.reduce((sum, t) => sum + t.totalQuota, 0), [tickets]);

    const formatDate = (date: Date) => {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const formatTime = (date: Date) => {
        return `${date.getHours().toString().padStart(2, '0')}.${date.getMinutes().toString().padStart(2, '0')}.${date.getSeconds().toString().padStart(2, '0')}`;
    };

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const handleRefresh = () => {
        fetchEvents();
    };

    if (loading && events.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // No events assigned
    if (assignedEvents.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Card className="border-hairline max-w-md w-full">
                    <CardContent className="p-10 text-center">
                        <Ticket className="w-12 h-12 text-ash mx-auto mb-3" />
                        <p className="text-lg font-medium text-ink mb-1">No Events Assigned</p>
                        <p className="text-sm text-mute">You haven&apos;t been assigned to any events yet. Contact your admin.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // No event selected yet (unlikely, but handle gracefully)
    if (!selectedEvent) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Card className="border-hairline max-w-md w-full">
                    <CardContent className="p-10 text-center">
                        <Ticket className="w-12 h-12 text-ash mx-auto mb-3" />
                        <p className="text-lg font-medium text-ink mb-1">Select an Event</p>
                        <p className="text-sm text-mute">Choose an event from the sidebar to view ticket sales.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 font-mono">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-ink tracking-tight">{selectedEvent.name}</h1>
                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-mute mt-2">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {selectedEvent.date}
                        </div>
                        <span className="text-hairline-strong">|</span>
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {currentTime ? formatTime(currentTime) : "..."}
                        </div>
                    </div>
                </div>
                <Button
                    onClick={handleRefresh}
                    className="gap-2 bg-ink hover:bg-charcoal text-canvas border-0 shrink-0 rounded-sm cursor-pointer text-xs"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Total Tickets Sold */}
                <Card className="border-hairline overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent pointer-events-none" />
                    <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-sm bg-success/10 flex items-center justify-center shrink-0 border border-success/20 group-hover:scale-105 transition-transform">
                            <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                        </div>
                        <div>
                            <p className="text-[10px] sm:text-xs font-medium text-mute mb-0.5">Tickets Sold</p>
                            <p className="text-lg sm:text-xl font-bold text-ink tabular-nums">
                                {totalSold}
                                <span className="text-xs sm:text-sm font-normal text-ash">/{totalQuota}</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Total Revenue */}
                <Card className="border-hairline overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
                    <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-sm bg-accent/10 flex items-center justify-center shrink-0 border border-accent/20 group-hover:scale-105 transition-transform">
                            <span className="text-xs sm:text-sm font-bold text-accent">Rp</span>
                        </div>
                        <div>
                            <p className="text-[10px] sm:text-xs font-medium text-mute mb-0.5">Revenue</p>
                            <p className="text-lg sm:text-xl font-bold text-ink">{formatRupiah(totalRevenue)}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Ticket Types */}
                <Card className="border-hairline overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent pointer-events-none" />
                    <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-sm bg-warning/10 flex items-center justify-center shrink-0 border border-warning/20 group-hover:scale-105 transition-transform">
                            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
                        </div>
                        <div>
                            <p className="text-[10px] sm:text-xs font-medium text-mute mb-0.5">Ticket Types</p>
                            <p className="text-lg sm:text-xl font-bold text-ink">{tickets.length}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Table Section */}
            <Card className="border-hairline overflow-hidden">
                <div className="p-3 sm:p-4 border-b border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-soft">
                    <div>
                        <h2 className="text-xs sm:text-sm font-bold text-ink">Ticket Sales Detail</h2>
                    </div>
                    <div className="relative w-full sm:w-56">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                            <Search className="h-3.5 w-3.5 text-ash" />
                        </div>
                        <Input
                            type="text"
                            placeholder="Search tickets..."
                            className="pl-9 h-8 sm:h-9 w-full text-xs sm:text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden divide-y divide-hairline">
                    {filteredTickets.length > 0 ? (
                        filteredTickets.map((ticket, index) => {
                            const ticketPct = ticket.totalQuota > 0
                                ? Math.round((ticket.sold / ticket.totalQuota) * 100)
                                : 0;
                            return (
                                <div key={ticket.id || index} className="p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-ink">{ticket.name}</p>
                                        <p className="text-sm font-bold text-ink tabular-nums">{formatRupiah(ticket.price * ticket.sold)}</p>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-mute">
                                        <span>Sold: <span className="text-ink font-medium">{ticket.sold}</span> / {ticket.totalQuota}</span>
                                        <span>{formatRupiah(ticket.price)} each</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 rounded-full bg-surface-card overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    ticketPct >= 90 ? 'bg-danger' :
                                                    ticketPct >= 70 ? 'bg-warning' :
                                                    'bg-success'
                                                }`}
                                                style={{ width: `${ticketPct}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-medium text-mute tabular-nums">{ticketPct}%</span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-8 text-center text-mute text-sm">
                            {searchTerm
                                ? "No tickets found matching your search."
                                : "No ticket types configured for this event."
                            }
                        </div>
                    )}

                    {/* Mobile Total */}
                    {filteredTickets.length > 0 && (
                        <div className="p-4 bg-surface-soft space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="uppercase tracking-wide text-mute font-semibold">Total</span>
                                <span className="font-bold text-ink">{formatRupiah(totalRevenue)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-mute">
                                <span>Sold: <span className="text-ink font-medium">{totalSold}</span> / {totalQuota}</span>
                                <span className="font-medium">{totalQuota > 0 ? Math.round((totalSold / totalQuota) * 100) : 0}%</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-surface-card/60 border-b border-hairline text-xs text-mute tracking-wide uppercase">
                                <th className="px-5 py-3 font-semibold">Ticket Type</th>
                                <th className="px-5 py-3 font-semibold">Sold / Quota</th>
                                <th className="px-5 py-3 font-semibold">Progress</th>
                                <th className="px-5 py-3 font-semibold">Price</th>
                                <th className="px-5 py-3 font-semibold">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-hairline">
                            {filteredTickets.length > 0 ? (
                                filteredTickets.map((ticket, index) => {
                                    const ticketPct = ticket.totalQuota > 0
                                        ? Math.round((ticket.sold / ticket.totalQuota) * 100)
                                        : 0;
                                    return (
                                        <tr key={ticket.id || index} className="hover:bg-surface-soft transition-colors">
                                            <td className="px-5 py-3.5 font-medium text-ink">
                                                {ticket.name}
                                            </td>
                                            <td className="px-5 py-3.5 text-body tabular-nums">
                                                <span className="font-medium text-ink">{ticket.sold}</span>
                                                <span className="text-ash"> / {ticket.totalQuota}</span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2 min-w-[120px]">
                                                    <div className="flex-1 h-1.5 rounded-full bg-surface-card overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${
                                                                ticketPct >= 90 ? 'bg-danger' :
                                                                ticketPct >= 70 ? 'bg-warning' :
                                                                'bg-success'
                                                            }`}
                                                            style={{ width: `${ticketPct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-medium text-mute tabular-nums w-8 text-right">{ticketPct}%</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-body">{formatRupiah(ticket.price)}</td>
                                            <td className="px-5 py-3.5 text-ink font-medium">{formatRupiah(ticket.price * ticket.sold)}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-mute">
                                        {searchTerm
                                            ? "No tickets found matching your search."
                                            : "No ticket types configured for this event."
                                        }
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {filteredTickets.length > 0 && (
                            <tfoot>
                                <tr className="border-t border-hairline bg-surface-soft font-medium">
                                    <td className="px-5 py-3 text-xs uppercase tracking-wide text-mute">Total</td>
                                    <td className="px-5 py-3 text-ink tabular-nums">{totalSold}<span className="text-ash"> / {totalQuota}</span></td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2 min-w-[120px]">
                                            <div className="flex-1 h-1.5 rounded-full bg-surface-card overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-ink"
                                                    style={{ width: `${totalQuota > 0 ? Math.round((totalSold / totalQuota) * 100) : 0}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-mute tabular-nums w-8 text-right">
                                                {totalQuota > 0 ? Math.round((totalSold / totalQuota) * 100) : 0}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3"></td>
                                    <td className="px-5 py-3 text-ink">{formatRupiah(totalRevenue)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                <div className="hidden sm:block px-5 py-3 border-t border-hairline text-xs text-mute bg-surface-soft">
                    Showing <span className="text-ink font-medium">{filteredTickets.length}</span> of {tickets.length} ticket types
                </div>
            </Card>
        </div>
    );
}
