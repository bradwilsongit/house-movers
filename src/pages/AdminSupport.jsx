import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { 
  MessageSquare, Search, Clock, CheckCircle2, AlertCircle,
  ChevronRight, Filter, FileText, Image
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const statusConfig = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700', icon: Clock },
  awaiting_response: { label: 'Awaiting Response', color: 'bg-purple-100 text-purple-700', icon: Clock },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-700', icon: CheckCircle2 },
};

const priorityConfig = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-600' },
  high: { label: 'High', color: 'bg-amber-100 text-amber-600' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-600' },
};

const typeConfig = {
  general: 'General',
  dispute: 'Dispute',
  damage_claim: 'Damage Claim',
  refund_request: 'Refund Request',
  complaint: 'Complaint',
};

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('open');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolution, setResolution] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.SupportTicket.list('-created_date', 100);
      setTickets(data);
    } catch (e) {
      console.error('Error loading tickets:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      const updateData = { status: newStatus };
      
      if (newStatus === 'resolved' || newStatus === 'closed') {
        const user = await base44.auth.me();
        updateData.resolved_by = user.email;
        updateData.resolved_at = new Date().toISOString();
        if (resolution) {
          updateData.resolution = resolution;
        }
      }

      await base44.entities.SupportTicket.update(ticketId, updateData);
      setTickets(tickets.map(t => 
        t.id === ticketId ? { ...t, ...updateData } : t
      ));
      setSelectedTicket(null);
      setResolution('');
    } catch (e) {
      console.error('Error updating ticket:', e);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = !searchQuery || 
      t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'open' && ['open', 'in_progress', 'awaiting_response'].includes(t.status)) ||
      (activeTab === 'resolved' && ['resolved', 'closed'].includes(t.status));
    
    return matchesSearch && matchesTab;
  });

  const openCount = tickets.filter(t => ['open', 'in_progress', 'awaiting_response'].includes(t.status)).length;
  const urgentCount = tickets.filter(t => t.priority === 'urgent' && t.status === 'open').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Support Tickets</h1>
            {urgentCount > 0 && (
              <p className="text-sm text-red-600 mt-1">
                {urgentCount} urgent ticket{urgentCount > 1 && 's'} require attention
              </p>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border mb-6">
            <TabsTrigger value="open">
              Open
              {openCount > 0 && (
                <Badge className="ml-2 bg-blue-500 text-white">{openCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <div className="space-y-4">
            {filteredTickets.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No tickets found</p>
                </CardContent>
              </Card>
            ) : (
              filteredTickets.map(ticket => {
                const status = statusConfig[ticket.status] || statusConfig.open;
                const priority = priorityConfig[ticket.priority] || priorityConfig.medium;
                const StatusIcon = status.icon;

                return (
                  <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={status.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                            <Badge className={priority.color}>
                              {priority.label}
                            </Badge>
                            <Badge variant="outline">
                              {typeConfig[ticket.ticket_type]}
                            </Badge>
                          </div>

                          <h3 className="font-semibold text-lg mb-1">{ticket.subject}</h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {ticket.description}
                          </p>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>
                              Created: {format(new Date(ticket.created_date), 'MMM d, yyyy HH:mm')}
                            </span>
                            {ticket.booking_id && (
                              <span>Booking: {ticket.booking_id.slice(0, 8)}...</span>
                            )}
                            {ticket.evidence_urls?.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Image className="w-4 h-4" />
                                {ticket.evidence_urls.length} file{ticket.evidence_urls.length > 1 && 's'}
                              </span>
                            )}
                          </div>

                          {ticket.resolution && (
                            <div className="mt-3 p-3 bg-emerald-50 rounded-lg">
                              <p className="text-sm text-emerald-800">
                                <strong>Resolution:</strong> {ticket.resolution}
                              </p>
                              {ticket.resolved_by && (
                                <p className="text-xs text-emerald-600 mt-1">
                                  Resolved by {ticket.resolved_by} on{' '}
                                  {format(new Date(ticket.resolved_at), 'MMM d, yyyy')}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="ml-4">
                          {!['resolved', 'closed'].includes(ticket.status) && (
                            <Button
                              size="sm"
                              onClick={() => setSelectedTicket(ticket)}
                            >
                              Manage
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </Tabs>

        {/* Ticket Management Dialog */}
        <Dialog open={!!selectedTicket} onOpenChange={(open) => {
          if (!open) {
            setSelectedTicket(null);
            setResolution('');
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Manage Ticket</DialogTitle>
              <DialogDescription>
                Update the status or resolve this support ticket
              </DialogDescription>
            </DialogHeader>

            {selectedTicket && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-1">{selectedTicket.subject}</h4>
                  <p className="text-sm text-gray-600">{selectedTicket.description}</p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Update Status</label>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) => handleStatusUpdate(selectedTicket.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="awaiting_response">Awaiting Response</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Resolution Notes</label>
                  <Textarea
                    placeholder="Describe how this issue was resolved..."
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    rows={4}
                  />
                </div>

                {selectedTicket.evidence_urls?.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Evidence Files</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTicket.evidence_urls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
                        >
                          <FileText className="w-4 h-4" />
                          File {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setSelectedTicket(null)}
              >
                Close
              </Button>
              <Button
                onClick={() => handleStatusUpdate(selectedTicket?.id, 'resolved')}
                disabled={!resolution || processing}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Mark as Resolved
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}