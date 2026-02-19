import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { 
  Building2, Search, Clock, CheckCircle2, XCircle, 
  Star, Truck, MapPin, FileText, ChevronDown, Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
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

const REGIONS = ['Cape Town','Johannesburg','Pretoria','Durban','Port Elizabeth','Bloemfontein','East London','Polokwane','Nelspruit','Kimberley'];
const CAPABILITY_CLASSES = ['apartment','house','office','long_distance'];

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [actionDialog, setActionDialog] = useState({ open: false, action: null });
  const [actionNotes, setActionNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Supplier.list('-created_date', 100);
      setSuppliers(data);
    } catch (e) {
      console.error('Error loading suppliers:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    setProcessing(true);
    try {
      let newStatus;
      if (action === 'approve') {
        newStatus = 'approved';
      } else if (action === 'reject' || action === 'suspend') {
        newStatus = 'suspended';
      }

      await base44.entities.Supplier.update(selectedSupplier.id, {
        status: newStatus,
      });

      setSuppliers(suppliers.map(s => 
        s.id === selectedSupplier.id ? { ...s, status: newStatus } : s
      ));
      setActionDialog({ open: false, action: null });
      setSelectedSupplier(null);
      setActionNotes('');
    } catch (e) {
      console.error('Error updating supplier:', e);
    } finally {
      setProcessing(false);
    }
  };

  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = !searchQuery || 
      s.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contact_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' || s.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const pendingCount = suppliers.filter(s => s.status === 'pending').length;
  const approvedCount = suppliers.filter(s => s.status === 'approved').length;
  const suspendedCount = suppliers.filter(s => s.status === 'suspended').length;

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
          <h1 className="text-2xl font-bold">Supplier Management</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border mb-6">
            <TabsTrigger value="pending">
              Pending
              {pendingCount > 0 && (
                <Badge className="ml-2 bg-amber-500 text-white">{pendingCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved
              <Badge className="ml-2 bg-gray-200 text-gray-700">{approvedCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="suspended">
              Suspended
              <Badge className="ml-2 bg-gray-200 text-gray-700">{suspendedCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <div className="space-y-4">
            {filteredSuppliers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No suppliers found</p>
                </CardContent>
              </Card>
            ) : (
              filteredSuppliers.map(supplier => (
                <Card key={supplier.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{supplier.company_name}</h3>
                          <Badge className={cn(
                            supplier.status === 'approved' && 'bg-emerald-100 text-emerald-700',
                            supplier.status === 'pending' && 'bg-amber-100 text-amber-700',
                            supplier.status === 'suspended' && 'bg-red-100 text-red-700'
                          )}>
                            {supplier.status === 'approved' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {supplier.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            {supplier.status === 'suspended' && <XCircle className="w-3 h-3 mr-1" />}
                            {supplier.status?.charAt(0).toUpperCase() + supplier.status?.slice(1)}
                          </Badge>
                          {supplier.rating_average > 0 && (
                            <span className="flex items-center gap-1 text-sm text-gray-500">
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                              {supplier.rating_average.toFixed(1)}
                            </span>
                          )}
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Contact</p>
                            <p className="font-medium">{supplier.contact_person}</p>
                            <p className="text-gray-600">{supplier.contact_email}</p>
                            <p className="text-gray-600">{supplier.contact_phone}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Regions</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {supplier.service_regions?.slice(0, 3).map(r => (
                                <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                              ))}
                              {supplier.service_regions?.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{supplier.service_regions.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-500">Capabilities</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {supplier.capability_classes?.map(c => (
                                <Badge key={c} variant="secondary" className="text-xs capitalize">
                                  {c.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-500">Fleet</p>
                            <p className="font-medium">
                              {supplier.fleet?.length || 0} vehicles
                            </p>
                            <p className="text-gray-600">
                              {supplier.crew_capacity} max crew
                            </p>
                          </div>
                        </div>

                        {supplier.insurance_doc_url && (
                          <div className="flex items-center gap-2 mt-4 text-sm text-blue-600">
                            <FileText className="w-4 h-4" />
                            <a href={supplier.insurance_doc_url} target="_blank" rel="noopener noreferrer">
                              View Insurance Document
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {supplier.status === 'pending' && (
                          <>
                            <Button
                              onClick={() => {
                                setSelectedSupplier(supplier);
                                setActionDialog({ open: true, action: 'approve' });
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedSupplier(supplier);
                                setActionDialog({ open: true, action: 'reject' });
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {supplier.status === 'approved' && (
                          <Button
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setActionDialog({ open: true, action: 'suspend' });
                            }}
                          >
                            Suspend
                          </Button>
                        )}
                        {supplier.status === 'suspended' && (
                          <Button
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setActionDialog({ open: true, action: 'approve' });
                            }}
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </Tabs>

        {/* Action Dialog */}
        <Dialog open={actionDialog.open} onOpenChange={(open) => {
          setActionDialog({ open, action: null });
          if (!open) {
            setSelectedSupplier(null);
            setActionNotes('');
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionDialog.action === 'approve' && 'Approve Supplier'}
                {actionDialog.action === 'reject' && 'Reject Application'}
                {actionDialog.action === 'suspend' && 'Suspend Supplier'}
              </DialogTitle>
              <DialogDescription>
                {actionDialog.action === 'approve' && 
                  `This will allow ${selectedSupplier?.company_name} to receive and fulfill jobs on the platform.`}
                {actionDialog.action === 'reject' && 
                  `This will reject the application from ${selectedSupplier?.company_name}.`}
                {actionDialog.action === 'suspend' && 
                  `This will prevent ${selectedSupplier?.company_name} from receiving new jobs.`}
              </DialogDescription>
            </DialogHeader>
            <div>
              <Textarea
                placeholder="Add notes (optional)..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
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
                  (actionDialog.action === 'reject' || actionDialog.action === 'suspend') && 
                    'bg-red-600 hover:bg-red-700'
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