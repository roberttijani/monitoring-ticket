"use client";

import { useEffect } from "react";
import { useEventStore } from "@/store/eventStore";
import { subscribeToTicketChanges } from "@/lib/supabase/realtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Calendar, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
    const { events, loading, fetchEvents } = useEventStore();

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Realtime subscription untuk update otomatis saat webhook Mayar masuk
    useEffect(() => {
        const unsubscribe = subscribeToTicketChanges();
        return () => unsubscribe();
    }, []);

    const totalEvents = events.length;
    const totalStaff = new Set(events.flatMap(e => e.assignedStaffIds)).size;

    let totalTickets = 0;
    let soldTickets = 0;
    let totalRevenue = 0;

    events.forEach(event => {
        event.tickets.forEach(ticket => {
            totalTickets += ticket.totalQuota;
            soldTickets += ticket.sold;
            totalRevenue += (ticket.price * ticket.sold);
        });
    });

    const chartData = events.map(event => {
        let sold = 0;
        let quota = 0;
        event.tickets.forEach(t => {
            sold += t.sold;
            quota += t.totalQuota;
        });
        return {
            name: event.name.substring(0, 15) + "...",
            sold,
            quota,
        };
    });

    if (loading && events.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">System Overview</h1>
                <p className="text-surface-200 mt-1">Real-time statistics across all managed events.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-surface-200">Total Revenue</p>
                                <p className="text-2xl font-bold text-foreground mt-1">
                                    Rp {(totalRevenue / 1000000).toFixed(1)}M
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-green-500">Rp</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-surface-200">Tickets Sold</p>
                                <p className="text-2xl font-bold text-foreground mt-1">
                                    {soldTickets.toLocaleString()} <span className="text-sm font-normal text-surface-200">/ {totalTickets.toLocaleString()}</span>
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-primary-500/10 rounded-full flex items-center justify-center">
                                <Ticket className="w-6 h-6 text-primary-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-surface-200">Active Staff</p>
                                <p className="text-2xl font-bold text-foreground mt-1">{totalStaff}</p>
                            </div>
                            <div className="w-12 h-12 bg-accent-500/10 rounded-full flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-accent-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-surface-200">Total Events</p>
                                <p className="text-2xl font-bold text-foreground mt-1">{totalEvents}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card className="col-span-1 border-surface-100/50">
                    <CardHeader>
                        <CardTitle>Ticket Sales by Event</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2d39" vertical={false} />
                                    <XAxis dataKey="name" stroke="#8c8d96" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#8c8d96" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e212b', border: '1px solid #373b4d', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    />
                                    <Bar dataKey="sold" name="Sold" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="quota" name="Quota" fill="#373b4d" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 border-surface-100/50">
                    <CardHeader>
                        <CardTitle>Recent Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {events.slice(0, 4).map(event => (
                                <div key={event.id} className="p-4 rounded-xl bg-surface-100/30 flex items-center justify-between border border-white/5">
                                    <div>
                                        <h4 className="font-medium text-foreground">{event.name}</h4>
                                        <p className="text-sm text-surface-200 mt-1">{event.date} • {event.location}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
