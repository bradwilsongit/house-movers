import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function DisputesTable({ supplierId }) {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDisputes();
  }, [supplierId]);

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const tickets = await base44.entities.SupportTicket.filter(
        { supplier_id: supplierId },
        '-created_date'
      );
      // Filter for dispute-related tickets
      const disputeTickets = tickets.filter(t => 
        ['dispute', 'damage_claim', 'refund_request', 'complaint'].includes(t.ticket_type)
      );
      setDisputes(disputeTickets);
    } catch (e) {
      console.error('Error loading disputes:', e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'open':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-amber-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return <Badge className="bg-green-100 text-green-700">Resolved</Badge>;
      case 'open':
        return <Badge className="bg-red-100 text-red-700">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-amber-100 text-amber-700">In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-700">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-700">High</Badge>;
      case 'medium':
        return <Badge className="bg-blue-100 text-blue-700">Medium</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">Low</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="mt-6">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Disputes & Support Tickets</CardTitle>
      </CardHeader>
      <CardContent>
        {disputes.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-gray-500">No active disputes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Subject</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Priority</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map(dispute => (
                  <tr key={dispute.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      <span className="text-sm text-gray-600 capitalize">
                        {dispute.ticket_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3">
                      <p className="text-sm text-gray-600 max-w-xs truncate">
                        {dispute.subject}
                      </p>
                    </td>
                    <td className="py-3">
                      {getStatusBadge(dispute.status)}
                    </td>
                    <td className="py-3">
                      {getPriorityBadge(dispute.priority)}
                    </td>
                    <td className="py-3 text-sm text-gray-500">
                      {new Date(dispute.created_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}