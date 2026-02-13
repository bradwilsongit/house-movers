import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { 
  Package, Clock, CheckCircle2, XCircle, Image, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function AdminExtras() {
  const [extraRequests, setExtraRequests] = useState([]);
  const [suppliers, setSuppliers] = useState({});
  const [bookings, setBookings] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedExtra, setSelectedExtra] = useState(null);
  const [actionDialog, setActionDialog] = useState({ open: false, action: null });
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [extras, suppliersData, bookingsData] = await Promise.all([
        base44.entities.ExtraRequest.list('-created_date', 100),
        base44.entities.Supplier.list(),
        base44.entities.Booking.list(),
      ]);

      setExtraRequests(extras);

      const supplierMap = {};
      suppliersData.forEach(s => { supplierMap[s.id] = s; });
      setSuppliers(supplierMap);

      const bookingMap = {};
      bookingsData.forEach(b => { bookingMap[b.id] = b; });
      setBookings(bookingMap);
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    setProcessing(true);
    try {
      const updateData = {
        status: action === 'approve' ? 'approved' : 'rejected',
        admin_notes: adminNotes,
      };

      if (action === 'approve') {
        const user = await base44.auth.me();
        updateData.approved_by = user.email;
        updateData.approved_at = new Date().toISOString();
      }

      await base44.entities.ExtraRequest.update(selectedExtra.id, updateData);

      setExtraRequests(extraRequests.map(e => 
        e.id === selectedExtra.id ? { ...e, ...updateData } : e
      ));
      setActionDialog({ open: false, action: null });
      setSelectedExtra(null);
      setAdminNotes('');
    } catch (e) {
      console.error('Error updating extra request:', e);
    } finally {
      setProcessing(false);
    }
  };

  const pendingExtras = extraRequests.filter(e => e.status === 'pending');
  const approvedExtras = extraRequests.filter(e => e.status === 'approved');
  const rejectedExtras = extraRequests.filter(e => e.status === 'rejected');

  const getFilteredExtras = () => {
    switch (activeTab) {
      case 'pending': return pendingExtras;
      case 'approved': return approvedExtras;
      case 'rejected': return rejectedExtras;
      default: return extraRequests;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-8">Extra Requests</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border mb-6">
            <TabsTrigger value="pending">
              Pending
              {pendingExtras.length > 0 && (
                <Badge className="ml-2 bg-amber-500 text-white">{pendingExtras.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved
              <Badge className="ml-2 bg-gray-200 text-gray-700">{approvedExtras.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected
              <Badge className="ml-2 bg-gray-200 text-gray-700">{rejectedExtras.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <div className="space-y-4">
            {getFilteredExtras().length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No extra requests</p>
                </CardContent>
              </Card>
            ) : (
              getFilteredExtras().map(extra => {
                const supplier = suppliers[extra.supplier_id];
                const booking = bookings[extra.booking_id];

                return (
                  <Card key={extra.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge className={cn(
                              extra.status === 'pending' && 'bg-amber-100 text-amber-700',
                              extra.status === 'approved' && 'bg-emerald-100 text-emerald-700',
                              extra.status === 'rejected' && 'bg-red-100 text-red-700',
                              extra.status === 'paid' && 'bg-blue-100 text-blue-700'
                            )}>
                              {extra.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                              {extra.status === 'approved' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              {extra.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                              {extra.status?.charAt(0).toUpperCase() + extra.status?.slice(1)}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {extra.request_type?.replace('_', ' ')}
                            </Badge>
                          </div>

                          <p className="font-medium text-lg mb-2">{extra.description}</p>

                          <div className="grid sm:grid-cols-3 gap-4 text-sm mt-4">
                            <div>
                              <p className="text-gray-500">Supplier</p>
                              <p className="font-medium">{supplier?.company_name || 'Unknown'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Booking</p>
                              <p className="font-medium">{booking?.booking_reference || 'Unknown'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Requested</p>
                              <p className="font-medium">
                                {format(new Date(extra.created_date), 'MMM d, yyyy HH:mm')}
                              </p>
                            </div>
                          </div>

                          {extra.photo_urls?.length > 0 && (
                            <div className="flex items-center gap-2 mt-4">
                              <Image className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-500">
                                {extra.photo_urls.length} photo{extra.photo_urls.length > 1 && 's'} attached
                              </span>
                              {extra.photo_urls.map((url, idx) => (
                                <a 
                                  key={idx}
                                  href={url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 text-sm underline"
                                >
                                  View
                                </a>
                              ))}
                            </div>
                          )}

                          {extra.admin_notes && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-500">Admin Notes</p>
                              <p className="text-sm">{extra.admin_notes}</p>
                            </div>
                          )}
                        </div>

                        <div className="text-right ml-6">
                          <div className="flex items-center gap-2 justify-end mb-2">
                            <DollarSign className="w-5 h-5 text-gray-400" />
                            <span className="text-2xl font-bold">R{extra.amount?.toLocaleString()}</span>
                          </div>

                          {extra.status === 'pending' && (
                            <div className="flex items-center gap-2 mt-4">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedExtra(extra);
                                  setActionDialog({ open: true, action: 'approve' });
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedExtra(extra);
                                  setActionDialog({ open: true, action: 'reject' });
                                }}
                              >
                                Reject
                              </Button>
                            </div>
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

        {/* Action Dialog */}
        <Dialog open={actionDialog.open} onOpenChange={(open) => {
          setActionDialog({ open, action: null });
          if (!open) {
            setSelectedExtra(null);
            setAdminNotes('');
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionDialog.action === 'approve' ? 'Approve Extra Request' : 'Reject Extra Request'}
              </DialogTitle>
              <DialogDescription>
                {actionDialog.action === 'approve' 
                  ? 'This will notify the customer to pay for this extra charge.'
                  : 'This will reject the extra request and notify the supplier.'}
              </DialogDescription>
            </DialogHeader>

            {selectedExtra && (
              <div className="py-4 border-y">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Request</span>
                  <span className="font-medium">{selectedExtra.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-bold">R{selectedExtra.amount?.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div>
              <Textarea
                placeholder="Add notes (optional)..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setActionDialog({ open: false, action: null })}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleAction(actionDialog.action)}
                disabled={processing}
                className={cn(
                  actionDialog.action === 'approve' && 'bg-emerald-600 hover:bg-emerald-700',
                  actionDialog.action === 'reject' && 'bg-red-600 hover:bg-red-700'
                )}
              >
                {processing ? 'Processing...' : 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}