"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useEventStore } from "@/store/eventStore";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Ticket, Users, Menu, X, LayoutDashboard, Calendar, MapPin, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoxLogo } from "@/components/VoxLogo";

interface SidebarItem {
    icon: React.ElementType;
    label: string;
    href: string;
}

export function DashboardLayout({ children, role }: { children: React.ReactNode, role: "admin" | "user" }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const { events, fetchEvents, selectedEventId, setSelectedEventId } = useEventStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileEventPickerOpen, setIsMobileEventPickerOpen] = useState(false);

    // Persist current path for reload restoration
    useEffect(() => {
        if (pathname) {
            localStorage.setItem('last-visited-path', pathname);
        }
    }, [pathname]);

    // Fetch events for user role
    useEffect(() => {
        if (role === "user") {
            fetchEvents();
        }
    }, [role, fetchEvents]);

    const assignedEvents = useMemo(
        () => role === "user" ? events.filter(e => e.assignedStaffIds.includes(user?.id || '')) : [],
        [events, user?.id, role]
    );

    // Auto-select first event when events load
    useEffect(() => {
        if (role !== "user") return;
        if (assignedEvents.length > 0 && !selectedEventId) {
            setSelectedEventId(assignedEvents[0].id);
        }
        if (selectedEventId && !assignedEvents.find(e => e.id === selectedEventId)) {
            setSelectedEventId(assignedEvents.length > 0 ? assignedEvents[0].id : null);
        }
    }, [assignedEvents, selectedEventId, role, setSelectedEventId]);

    const selectedEvent = useMemo(
        () => assignedEvents.find(e => e.id === selectedEventId) || null,
        [assignedEvents, selectedEventId]
    );

    const adminNav: SidebarItem[] = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
        { icon: Ticket, label: "Events & Tickets", href: "/admin/events" },
        { icon: Users, label: "Users & Staff", href: "/admin/users" },
    ];

    const userNav: SidebarItem[] = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/user/dashboard" },
    ];

    const navItems = role === "admin" ? adminNav : userNav;

    const handleLogout = () => {
        logout();
        localStorage.removeItem('last-visited-path');
        router.push("/login");
    };

    const handleSelectEvent = (eventId: string) => {
        setSelectedEventId(eventId);
        setIsMobileEventPickerOpen(false);
        setIsMobileMenuOpen(false);
    };

    // Shared event list component for sidebar
    const EventList = ({ isMobile = false }: { isMobile?: boolean }) => {
        if (role !== "user" || assignedEvents.length === 0) return null;

        return (
            <div className={cn("space-y-1", isMobile ? "" : "")}>
                <p className="px-3 mb-2 text-[10px] font-semibold text-ash uppercase tracking-widest">
                    Events
                </p>
                {assignedEvents.map(event => {
                    const isSelected = selectedEventId === event.id;
                    const eventSold = event.tickets.reduce((s, t) => s + t.sold, 0);
                    const eventQuota = event.tickets.reduce((s, t) => s + t.totalQuota, 0);
                    const pct = eventQuota > 0 ? Math.round((eventSold / eventQuota) * 100) : 0;

                    return (
                        <button
                            key={event.id}
                            onClick={() => handleSelectEvent(event.id)}
                            className={cn(
                                "w-full text-left px-3 py-2.5 rounded-sm transition-all duration-200 cursor-pointer group relative",
                                isSelected
                                    ? "bg-ink text-canvas"
                                    : "text-body hover:bg-surface-card hover:text-ink"
                            )}
                        >
                            {/* Active indicator */}
                            {isSelected && (
                                <motion.div
                                    layoutId={isMobile ? "mobile-event-indicator" : "desktop-event-indicator"}
                                    className="absolute left-0 top-1 bottom-1 w-[3px] bg-accent rounded-r-full"
                                />
                            )}

                            <p className={cn(
                                "text-xs font-bold truncate leading-tight",
                                isSelected ? "text-canvas" : "text-ink"
                            )}>
                                {event.name}
                            </p>
                            <div className={cn(
                                "flex items-center gap-1 mt-1 text-[10px]",
                                isSelected ? "text-on-dark-mute" : "text-mute"
                            )}>
                                <Calendar className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{event.date}</span>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-2 flex items-center gap-1.5">
                                <div className={cn(
                                    "flex-1 h-1 rounded-full overflow-hidden",
                                    isSelected ? "bg-on-dark-mute/20" : "bg-surface-card"
                                )}>
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-500",
                                            isSelected ? "bg-success" : "bg-accent"
                                        )}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <span className={cn(
                                    "text-[10px] font-medium tabular-nums",
                                    isSelected ? "text-on-dark-mute" : "text-ash"
                                )}>
                                    {pct}%
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-canvas flex font-mono">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 border-r border-hairline bg-canvas z-20 shrink-0">
                <div className="p-6 pb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-1 text-ink mt-1">
                            <VoxLogo className="w-24 h-24" />
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="px-4 pt-4 pb-2 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link key={item.href} href={item.href}>
                                <div className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-200 group relative",
                                    isActive ? "text-ink bg-surface-card" : "text-mute hover:text-ink hover:bg-surface-soft"
                                )}>
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-navIndicator"
                                            className="absolute left-0 top-1 bottom-1 w-[3px] bg-ink rounded-r-full"
                                        />
                                    )}
                                    <item.icon className={cn("w-4 h-4", isActive ? "text-ink" : "text-ash group-hover:text-ink")} />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Event List (user only) - Scrollable */}
                {role === "user" && assignedEvents.length > 0 && (
                    <div className="flex-1 overflow-y-auto px-4 py-3 border-t border-hairline mt-2">
                        <EventList />
                    </div>
                )}

                {/* Spacer for admin */}
                {role === "admin" && <div className="flex-1" />}

                {/* User Profile & Logout */}
                <div className="p-4 border-t border-hairline">
                    <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-sm bg-surface-card">
                        <div className="w-7 h-7 rounded-sm bg-ink flex items-center justify-center font-bold text-xs text-canvas">
                            {user?.name?.charAt(0) || "U"}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-medium text-ink truncate">{user?.name}</p>
                            <p className="text-[10px] text-ash truncate capitalize">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-danger hover:text-danger-hover hover:bg-danger/5 rounded-sm transition-colors cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-3 border-b border-hairline bg-canvas shrink-0 z-30 sticky top-0">
                    <div className="flex items-center gap-2">
                        <VoxLogo className="w-14 h-14 text-ink" />
                    </div>

                    {/* Mobile event name (quick indicator) */}
                    {role === "user" && selectedEvent && (
                        <button
                            onClick={() => setIsMobileEventPickerOpen(!isMobileEventPickerOpen)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-surface-card border border-hairline text-xs font-medium text-ink max-w-[180px] cursor-pointer"
                        >
                            <Ticket className="w-3 h-3 shrink-0 text-accent" />
                            <span className="truncate">{selectedEvent.name}</span>
                            <ChevronDown className={cn(
                                "w-3 h-3 shrink-0 text-ash transition-transform",
                                isMobileEventPickerOpen && "rotate-180"
                            )} />
                        </button>
                    )}

                    <button
                        onClick={() => {
                            setIsMobileMenuOpen(!isMobileMenuOpen);
                            setIsMobileEventPickerOpen(false);
                        }}
                        className="p-2 text-body cursor-pointer"
                    >
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </header>

                {/* Mobile Event Picker Dropdown (separate from menu) */}
                <AnimatePresence>
                    {isMobileEventPickerOpen && !isMobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="md:hidden border-b border-hairline bg-canvas sticky top-[65px] z-20 overflow-hidden"
                        >
                            <div className="p-3 max-h-[50vh] overflow-y-auto">
                                <EventList isMobile />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mobile Menu Dropdown */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="md:hidden border-b border-hairline bg-canvas sticky top-[65px] z-20 overflow-hidden"
                        >
                            <div className="p-3 space-y-1 max-h-[70vh] overflow-y-auto">
                                {/* Nav Items */}
                                {navItems.map((item) => (
                                    <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-body hover:text-ink hover:bg-surface-soft">
                                            <item.icon className="w-4 h-4" />
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </div>
                                    </Link>
                                ))}

                                {/* Event List for mobile menu */}
                                {role === "user" && assignedEvents.length > 0 && (
                                    <div className="pt-2 mt-2 border-t border-hairline">
                                        <EventList isMobile />
                                    </div>
                                )}

                                {/* Logout */}
                                <div className="pt-2 mt-2 border-t border-hairline">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger/5 rounded-sm cursor-pointer"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <main className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto h-full">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="h-full"
                        >
                            {children}
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    );
}
