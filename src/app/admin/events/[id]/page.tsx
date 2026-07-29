"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useEventStore, TicketType } from "@/store/eventStore";
import { useAuthStore } from "@/store/authStore";
import { subscribeToTicketChanges } from "@/lib/supabase/realtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { ArrowLeft, Ticket, Calendar, MapPin, Plus, Users, X, Pencil, UserPlus, UserMinus, Search } from "lucide-react";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const { events, addTicket, updateTicket, deleteTicket, assignStaff, removeStaff, fetchEvents, loading } = useEventStore();
  const { users, fetchUsers } = useAuthStore();
  
  const [isAddTicketModalOpen, setIsAddTicketModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newTicket, setNewTicket] = useState({ name: "", price: "", quota: "" });
  const [editForm, setEditForm] = useState({ name: "", price: "", quota: "", sold: "", scanned: "" });
  const [staffSearch, setStaffSearch] = useState("");

  useEffect(() => {
    if (events.length === 0) fetchEvents();
    if (users.length === 0) fetchUsers();
  }, [events.length, users.length, fetchEvents, fetchUsers]);

  // Realtime subscription untuk update otomatis saat webhook Mayar masuk
  useEffect(() => {
    const unsubscribe = subscribeToTicketChanges();
    return () => unsubscribe();
  }, []);

  const event = events.find(e => e.id === eventId);

  // Filter staff users only (not admins)
  const staffUsers = users.filter(u => u.role === "user");
  const assignedStaff = staffUsers.filter(u => event?.assignedStaffIds.includes(u.id));
  const availableStaff = staffUsers.filter(u => 
    !event?.assignedStaffIds.includes(u.id) &&
    (u.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
     u.email.toLowerCase().includes(staffSearch.toLowerCase()))
  );

  const openEditModal = (ticket: TicketType) => {
    setEditingTicket(ticket);
    setEditForm({
      name: ticket.name,
      price: String(ticket.price),
      quota: String(ticket.totalQuota),
      sold: String(ticket.sold),
      scanned: String(ticket.scanned),
    });
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-xl font-bold text-foreground">Event not found</h2>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const handleCreateTicket = async () => {
    if (!newTicket.name || !newTicket.price || !newTicket.quota) return;
    setIsSubmitting(true);
    await addTicket(eventId, {
      name: newTicket.name,
      price: parseInt(newTicket.price),
      totalQuota: parseInt(newTicket.quota),
      sold: 0,
      scanned: 0
    });
    setIsSubmitting(false);
    setIsAddTicketModalOpen(false);
    setNewTicket({ name: "", price: "", quota: "" });
  };

  const handleUpdateTicket = async () => {
    if (!editingTicket || !editForm.name || !editForm.price || !editForm.quota) return;
    setIsSubmitting(true);
    await updateTicket(eventId, editingTicket.id, {
      name: editForm.name,
      price: parseInt(editForm.price),
      totalQuota: parseInt(editForm.quota),
      sold: parseInt(editForm.sold) || 0,
      scanned: parseInt(editForm.scanned) || 0,
    });
    setIsSubmitting(false);
    setEditingTicket(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    await deleteTicket(eventId, deleteTarget.id);
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  const handleAssignStaff = async (userId: string) => {
    await assignStaff(eventId, userId);
  };

  const handleRemoveStaff = async (userId: string) => {
    await removeStaff(eventId, userId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/events')} className="shrink-0 group bg-surface-100/50 hover:bg-surface-100">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">{event.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-surface-200">
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {event.date} • {event.time}</span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {event.location}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details + Staff Management */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="border-b border-surface-100/50">
              <CardTitle>Event Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-surface-200 uppercase tracking-widest mb-2 block">Description</label>
                <div className="bg-surface-100/30 p-3 rounded-lg border border-surface-100/50 text-sm">
                  {event.description || "No description provided."}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff Management Card */}
          <Card>
            <CardHeader className="border-b border-surface-100/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-500" />
                  Monitoring Staff
                </CardTitle>
                <span className="text-sm font-bold text-primary-500 bg-primary-500/10 px-2.5 py-0.5 rounded-full">
                  {assignedStaff.length}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Assigned Staff List */}
              <div className="divide-y divide-surface-100/50">
                {assignedStaff.length === 0 ? (
                  <div className="p-6 text-center text-surface-200 text-sm">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No staff assigned yet.
                  </div>
                ) : (
                  assignedStaff.map(staff => (
                    <div key={staff.id} className="px-4 py-3 flex items-center justify-between hover:bg-surface-100/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-500/15 text-primary-500 flex items-center justify-center text-sm font-bold">
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{staff.name}</p>
                          <p className="text-xs text-surface-200">{staff.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-surface-200 hover:text-red-500 hover:bg-red-50"
                        onClick={() => handleRemoveStaff(staff.id)}
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Staff Section */}
              <div className="border-t border-surface-100/50 p-4 space-y-3 bg-surface-100/10">
                <label className="text-xs font-semibold text-surface-200 uppercase tracking-widest">Add Staff</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-surface-200" />
                  <Input 
                    placeholder="Search available staff..."
                    className="pl-8 h-8 text-sm"
                    value={staffSearch}
                    onChange={e => setStaffSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {availableStaff.length === 0 ? (
                    <p className="text-xs text-surface-200 py-2 text-center">
                      {staffSearch ? "No staff found." : "All staff are assigned."}
                    </p>
                  ) : (
                    availableStaff.map(staff => (
                      <div key={staff.id} className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-surface-100/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-surface-200/15 text-surface-200 flex items-center justify-center text-xs font-bold">
                            {staff.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-foreground">{staff.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-primary-500 hover:text-primary-600 hover:bg-primary-50"
                          onClick={() => handleAssignStaff(staff.id)}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tickets */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b border-surface-100/50 flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle>Tickets & Quotas</CardTitle>
                <p className="text-sm text-surface-200 mt-1">Manage ticket variants and capacities.</p>
              </div>
              <Button onClick={() => setIsAddTicketModalOpen(true)} className="shrink-0 shadow-sm border border-primary-500/50">
                <Plus className="w-4 h-4 mr-2" />
                Add Ticket Tier
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-surface-100/50">
                {event.tickets.length === 0 ? (
                  <div className="p-8 text-center text-surface-200 flex flex-col items-center">
                    <Ticket className="w-10 h-10 mb-2 opacity-20" />
                    <p>No tickets have been created yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                    {event.tickets.map(ticket => {
                      const percentSold = ticket.totalQuota > 0 ? Math.round((ticket.sold / ticket.totalQuota) * 100) : 0;
                      
                      return (
                        <div key={ticket.id} className="p-4 rounded-xl bg-surface-50 border border-surface-100 hover:border-primary-200 transition-colors shadow-sm relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-3">
                            <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${percentSold >= 100 ? 'bg-red-100 text-red-600' : 'bg-primary-50 text-primary-600'}`}>
                              {percentSold >= 100 ? 'SOLD OUT' : `${percentSold}% SOLD`}
                            </div>
                          </div>
                          
                          <div className="flex items-start mb-4">
                            <div className="p-2.5 bg-primary-50 text-primary-500 rounded-lg mr-3">
                              <Ticket className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-bold text-foreground text-lg">{ticket.name}</h4>
                              <p className="font-medium text-surface-200 flex items-center">
                                <span className="text-xs font-bold mr-0.5">Rp</span>
                                {ticket.price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-xs font-medium mb-1">
                                <span className="text-surface-200">Quota Consumed</span>
                                <span className="text-foreground">{ticket.sold} / {ticket.totalQuota}</span>
                              </div>
                              <div className="h-2 w-full bg-surface-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${percentSold >= 100 ? 'bg-red-500' : 'bg-primary-500'} transition-all`} 
                                  style={{ width: `${Math.min(percentSold, 100)}%` }} 
                                />
                              </div>
                            </div>
                            
                            <div className="flex gap-2 pt-2 border-t border-surface-100/50">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 h-8 text-xs bg-surface-50"
                                onClick={() => openEditModal(ticket)}
                              >
                                <Pencil className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm" 
                                className="flex-1 h-8 text-xs"
                                onClick={() => setDeleteTarget({ id: ticket.id, name: ticket.name })}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Ticket Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Ticket"
        message={`Are you sure you want to delete "${deleteTarget?.name}" ticket tier? This action cannot be undone.`}
        confirmLabel="Delete Ticket"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={isDeleting}
      />

      {/* Add Ticket Modal */}
      {isAddTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border-surface-100/50 bg-surface-50 shadow-2xl">
            <CardHeader className="border-b border-surface-100/50 flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg">Add New Ticket Tier</CardTitle>
              <button onClick={() => setIsAddTicketModalOpen(false)} className="p-1.5 text-surface-200 hover:text-foreground hover:bg-surface-100 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Ticket Name</label>
                <Input 
                  placeholder="e.g. VIP, Early Bird, General Admission" 
                  value={newTicket.name}
                  onChange={e => setNewTicket({...newTicket, name: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Price (Rp)</label>
                <div className="relative">
                  <span className="text-xs font-bold absolute left-3 top-1/2 -translate-y-1/2 text-surface-200">Rp</span>
                  <Input 
                    type="number"
                    placeholder="0" 
                    className="pl-9"
                    value={newTicket.price}
                    onChange={e => setNewTicket({...newTicket, price: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Total Quota</label>
                <Input 
                  type="number"
                  placeholder="Capacity limit" 
                  value={newTicket.quota}
                  onChange={e => setNewTicket({...newTicket, quota: e.target.value})}
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setIsAddTicketModalOpen(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleCreateTicket} disabled={!newTicket.name || !newTicket.price || !newTicket.quota || isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Ticket"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Ticket Modal */}
      {editingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border-surface-100/50 bg-surface-50 shadow-2xl">
            <CardHeader className="border-b border-surface-100/50 flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg">Edit Ticket: {editingTicket.name}</CardTitle>
              <button onClick={() => setEditingTicket(null)} className="p-1.5 text-surface-200 hover:text-foreground hover:bg-surface-100 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Ticket Name</label>
                <Input 
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Price (Rp)</label>
                <div className="relative">
                  <span className="text-xs font-bold absolute left-3 top-1/2 -translate-y-1/2 text-surface-200">Rp</span>
                  <Input 
                    type="number"
                    className="pl-9"
                    value={editForm.price}
                    onChange={e => setEditForm({...editForm, price: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Total Quota</label>
                <Input 
                  type="number"
                  value={editForm.quota}
                  onChange={e => setEditForm({...editForm, quota: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Sold</label>
                  <Input 
                    type="number"
                    value={editForm.sold}
                    onChange={e => setEditForm({...editForm, sold: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Scanned</label>
                  <Input 
                    type="number"
                    value={editForm.scanned}
                    onChange={e => setEditForm({...editForm, scanned: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setEditingTicket(null)}>Cancel</Button>
                <Button className="flex-1" onClick={handleUpdateTicket} disabled={!editForm.name || !editForm.price || !editForm.quota || isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
