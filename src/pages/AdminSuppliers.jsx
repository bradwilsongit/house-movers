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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const REGIONS = ['Cape Town','Johannesburg','Pretoria','Durban','Port Elizabeth','Bloemfontein','East London','Polokwane','Nelspruit','Kimberley'];
const CAPABILITY_CLASSES = ['apartment','house','office','long_distance'];
const VEHICLE_TYPES = ['1-ton Bakkie','2-ton Truck','3-ton Truck','4-ton Truck','5-ton Truck','6-ton Truck','7-ton Truck','8-ton Truck','9-ton Truck','10-ton Truck'];
const PACKAGING_OPTIONS = [
  { name: 'Large Box', category: 'boxes' },
  { name: 'Medium Box', category: 'boxes' },
  { name: 'Small Box', category: 'boxes' },
  { name: 'Wardrobe Box', category: 'boxes' },
  { name: 'Bubble Wrap (10m)', category: 'wrapping' },
  { name: 'Packing Paper (5kg)', category: 'wrapping' },
  { name: 'Packing Tape', category: 'tape' },
  { name: 'Moving Blanket', category: 'blankets' },
  { name: 'Mattress Cover', category: 'specialty' },
  { name: 'TV Box', category: 'specialty' },
];

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [actionDialog, setActionDialog] = useState({ open: false, action: null });
  const [actionNotes, setActionNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false });
  const [editForm, setEditForm] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editNewVehicle, setEditNewVehicle] = useState({ vehicle_type:'',make:'',model:'',year:'',capacity_m3:'',crew_size:'',rate_per_km:'',crew_member_rate:'',plate_number:'' });
  const [editNewPkg, setEditNewPkg] = useState({ name: '', unit_price: '' });

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

  const openEditDialog = (supplier) => {
    setEditForm({ ...supplier });
    setEditDialog({ open: true });
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    try {
      const { id, ...dataToSave } = editForm;
      await base44.entities.Supplier.update(id, dataToSave);
      setSuppliers(suppliers.map(s => s.id === editForm.id ? { ...s, ...editForm } : s));
      setEditDialog({ open: false });
    } catch (e) {
      console.error('Error saving supplier:', e);
    } finally {
      setEditSaving(false);
    }
  };

  const updateEditPricing = (field, value) => {
    setEditForm({ ...editForm, pricing: { ...(editForm.pricing || {}), [field]: value ? parseFloat(value) : 0 } });
  };

  const addEditVehicle = () => {
    if (editNewVehicle.vehicle_type && editNewVehicle.capacity_m3) {
      const fleet = editForm.fleet || [];
      setEditForm({ ...editForm, fleet: [...fleet, {
        ...editNewVehicle,
        capacity_m3: parseFloat(editNewVehicle.capacity_m3),
        year: editNewVehicle.year ? parseInt(editNewVehicle.year) : null,
        crew_size: editNewVehicle.crew_size ? parseInt(editNewVehicle.crew_size) : null,
        rate_per_km: editNewVehicle.rate_per_km ? parseFloat(editNewVehicle.rate_per_km) : null,
        crew_member_rate: editNewVehicle.crew_member_rate ? parseFloat(editNewVehicle.crew_member_rate) : null,
      }] });
      setEditNewVehicle({ vehicle_type:'',make:'',model:'',year:'',capacity_m3:'',crew_size:'',rate_per_km:'',crew_member_rate:'',plate_number:'' });
    }
  };

  const removeEditVehicle = (idx) => {
    setEditForm({ ...editForm, fleet: (editForm.fleet || []).filter((_, i) => i !== idx) });
  };

  const addEditPackaging = () => {
    if (editNewPkg.name && editNewPkg.unit_price) {
      const opt = PACKAGING_OPTIONS.find(o => o.name === editNewPkg.name);
      const items = editForm.pricing?.packaging_items || [];
      setEditForm({ ...editForm, pricing: { ...(editForm.pricing || {}), packaging_items: [...items, { name: editNewPkg.name, category: opt?.category || 'boxes', unit_price: parseFloat(editNewPkg.unit_price), in_stock: true }] } });
      setEditNewPkg({ name: '', unit_price: '' });
    }
  };

  const removeEditPackaging = (idx) => {
    const items = (editForm.pricing?.packaging_items || []).filter((_, i) => i !== idx);
    setEditForm({ ...editForm, pricing: { ...(editForm.pricing || {}), packaging_items: items } });
  };

  const toggleEditRegion = (region) => {
    const regions = editForm.service_regions || [];
    setEditForm({ ...editForm, service_regions: regions.includes(region) ? regions.filter(r => r !== region) : [...regions, region] });
  };

  const toggleEditCapability = (cap) => {
    const caps = editForm.capability_classes || [];
    setEditForm({ ...editForm, capability_classes: caps.includes(cap) ? caps.filter(c => c !== cap) : [...caps, cap] });
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
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(supplier)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
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

        {/* Edit Dialog */}
        <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open })}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Supplier — {editForm?.company_name}</DialogTitle>
            </DialogHeader>
            {editForm && (
              <div className="space-y-6">

                {/* Company Info */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-3">Company Information</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Company Name</Label>
                        <Input className="mt-1" value={editForm.company_name || ''} onChange={e => setEditForm({ ...editForm, company_name: e.target.value })} />
                      </div>
                      <div>
                        <Label>Registration Number</Label>
                        <Input className="mt-1" value={editForm.registration_number || ''} onChange={e => setEditForm({ ...editForm, registration_number: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Contact Person</Label>
                        <Input className="mt-1" value={editForm.contact_person || ''} onChange={e => setEditForm({ ...editForm, contact_person: e.target.value })} />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input className="mt-1" value={editForm.contact_phone || ''} onChange={e => setEditForm({ ...editForm, contact_phone: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input className="mt-1" value={editForm.contact_email || ''} onChange={e => setEditForm({ ...editForm, contact_email: e.target.value })} />
                    </div>
                    <div>
                      <Label>Max Crew Capacity</Label>
                      <Input className="mt-1" type="number" value={editForm.crew_capacity || ''} onChange={e => setEditForm({ ...editForm, crew_capacity: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-3">Documents</h4>
                  <div className="space-y-3">
                    <div>
                      <Label>Insurance Document URL</Label>
                      <div className="flex gap-2 mt-1">
                        <Input value={editForm.insurance_doc_url || ''} onChange={e => setEditForm({ ...editForm, insurance_doc_url: e.target.value })} placeholder="https://..." />
                        {editForm.insurance_doc_url && (
                          <a href={editForm.insurance_doc_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" type="button">View</Button>
                          </a>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Compliance Document URL</Label>
                      <div className="flex gap-2 mt-1">
                        <Input value={editForm.compliance_doc_url || ''} onChange={e => setEditForm({ ...editForm, compliance_doc_url: e.target.value })} placeholder="https://..." />
                        {editForm.compliance_doc_url && (
                          <a href={editForm.compliance_doc_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" type="button">View</Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Regions */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-3">Service Regions</h4>
                  <div className="flex flex-wrap gap-2">
                    {REGIONS.map(r => (
                      <Badge key={r} variant={editForm.service_regions?.includes(r) ? 'default' : 'outline'}
                        className={cn('cursor-pointer', editForm.service_regions?.includes(r) ? 'bg-black text-white' : 'hover:bg-gray-100')}
                        onClick={() => toggleEditRegion(r)}>{r}</Badge>
                    ))}
                  </div>
                </div>

                {/* Capabilities */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-3">Move Types / Capabilities</h4>
                  <div className="flex flex-wrap gap-2">
                    {CAPABILITY_CLASSES.map(c => (
                      <Badge key={c} variant={editForm.capability_classes?.includes(c) ? 'default' : 'outline'}
                        className={cn('cursor-pointer capitalize', editForm.capability_classes?.includes(c) ? 'bg-black text-white' : 'hover:bg-gray-100')}
                        onClick={() => toggleEditCapability(c)}>{c.replace(/_/g, ' ')}</Badge>
                    ))}
                  </div>
                </div>

                {/* Fleet */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-3">Fleet</h4>
                  <div className="space-y-2 mb-3">
                    {(editForm.fleet || []).map((v, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                        <span className="font-medium">{v.vehicle_type}</span>
                        {v.make && <span className="text-gray-500">{v.make} {v.model}</span>}
                        {v.year && <span className="text-gray-400">({v.year})</span>}
                        <span className="text-gray-500">{v.capacity_m3}m³</span>
                        {v.plate_number && <span className="text-gray-400">{v.plate_number}</span>}
                        <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => removeEditVehicle(i)}><XCircle className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    ))}
                  </div>
                  <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
                    <p className="text-xs font-medium text-gray-500">Add Vehicle</p>
                    <div className="grid grid-cols-3 gap-2">
                      <Select value={editNewVehicle.vehicle_type} onValueChange={v => setEditNewVehicle({ ...editNewVehicle, vehicle_type: v })}>
                        <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>{VEHICLE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input placeholder="Make" value={editNewVehicle.make} onChange={e => setEditNewVehicle({ ...editNewVehicle, make: e.target.value })} />
                      <Input placeholder="Model" value={editNewVehicle.model} onChange={e => setEditNewVehicle({ ...editNewVehicle, model: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <Input placeholder="Year" type="number" value={editNewVehicle.year} onChange={e => setEditNewVehicle({ ...editNewVehicle, year: e.target.value })} />
                      <Input placeholder="m³" type="number" value={editNewVehicle.capacity_m3} onChange={e => setEditNewVehicle({ ...editNewVehicle, capacity_m3: e.target.value })} />
                      <Input placeholder="Crew" type="number" value={editNewVehicle.crew_size} onChange={e => setEditNewVehicle({ ...editNewVehicle, crew_size: e.target.value })} />
                      <Input placeholder="Plate #" value={editNewVehicle.plate_number} onChange={e => setEditNewVehicle({ ...editNewVehicle, plate_number: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input placeholder="Rate/km (R)" type="number" value={editNewVehicle.rate_per_km} onChange={e => setEditNewVehicle({ ...editNewVehicle, rate_per_km: e.target.value })} />
                      <Input placeholder="Crew rate (R)" type="number" value={editNewVehicle.crew_member_rate} onChange={e => setEditNewVehicle({ ...editNewVehicle, crew_member_rate: e.target.value })} />
                      <Button onClick={addEditVehicle} disabled={!editNewVehicle.vehicle_type || !editNewVehicle.capacity_m3} size="sm">Add</Button>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-3">Pricing Rates</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Rate per KM (R)</Label>
                      <Input className="mt-1" type="number" value={editForm.pricing?.rate_per_km || ''} onChange={e => updateEditPricing('rate_per_km', e.target.value)} />
                    </div>
                    <div>
                      <Label>Crew Member Rate (R)</Label>
                      <Input className="mt-1" type="number" value={editForm.pricing?.crew_member_rate || ''} onChange={e => updateEditPricing('crew_member_rate', e.target.value)} />
                    </div>
                    <div>
                      <Label>Packing Service Rate (R)</Label>
                      <Input className="mt-1" type="number" value={editForm.pricing?.packing_service_rate || ''} onChange={e => updateEditPricing('packing_service_rate', e.target.value)} />
                    </div>
                    <div>
                      <Label>Shuttle Service Rate (R)</Label>
                      <Input className="mt-1" type="number" value={editForm.pricing?.shuttle_service_rate || ''} onChange={e => updateEditPricing('shuttle_service_rate', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Packaging Items */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-3">Packaging Items</h4>
                  <div className="space-y-2 mb-3">
                    {(editForm.pricing?.packaging_items || []).map((item, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                        <span className="flex-1 font-medium">{item.name}</span>
                        <span className="text-gray-500">R{item.unit_price}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeEditPackaging(i)}><XCircle className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Select value={editNewPkg.name} onValueChange={v => setEditNewPkg({ ...editNewPkg, name: v })}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Item" /></SelectTrigger>
                      <SelectContent>{PACKAGING_OPTIONS.map(o => <SelectItem key={o.name} value={o.name}>{o.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input className="w-28" placeholder="Price (R)" type="number" value={editNewPkg.unit_price} onChange={e => setEditNewPkg({ ...editNewPkg, unit_price: e.target.value })} />
                    <Button onClick={addEditPackaging} disabled={!editNewPkg.name || !editNewPkg.unit_price} size="sm">Add</Button>
                  </div>
                </div>

              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog({ open: false })}>Cancel</Button>
              <Button onClick={handleEditSave} disabled={editSaving} className="bg-black text-white hover:bg-gray-800">
                {editSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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