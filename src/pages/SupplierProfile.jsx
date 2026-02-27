import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { 
  Building2, MapPin, Truck, Users, Save, Check, Plus, X, Upload, DollarSign, Package, Pencil, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const REGIONS = [
  'Cape Town', 'Johannesburg', 'Pretoria', 'Durban', 'Port Elizabeth',
  'Bloemfontein', 'East London', 'Polokwane', 'Nelspruit', 'Kimberley',
];

const CAPABILITY_CLASSES = [
  { id: 'apartment', label: 'Apartment' },
  { id: 'house', label: 'House' },
  { id: 'office', label: 'Office' },
  { id: 'long_distance', label: 'Long Distance' },
];

const PACKAGING_OPTIONS = [
  { name: 'Box 1', category: 'boxes', description: 'Max 10kg · 43×28×28cm' },
  { name: 'Box 2', category: 'boxes', description: 'Max 10kg · 56×40×28cm' },
  { name: 'Box 3', category: 'boxes', description: 'Max 10kg · 42×42×48cm' },
  { name: 'Box 4', category: 'boxes', description: 'Max 15kg · 50×45×66cm' },
  { name: 'Bubble Wrap (10m)', category: 'wrapping' },
  { name: 'Packing Paper (5kg)', category: 'wrapping' },
  { name: 'Packing Tape', category: 'tape' },
  { name: 'Mattress Cover', category: 'specialty' },
  { name: 'TV Box', category: 'specialty' },
];

export default function SupplierProfile() {
  const [user, setUser] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState(null);
  const [newVehicle, setNewVehicle] = useState({
      vehicle_type: '',
      make: '',
      model: '',
      year: '',
      capacity_m3: '',
      crew_size: '',
      rate_per_km: '',
      crew_member_rate: '',
      plate_number: '',
      front_photo_url: '',
      back_photo_url: '',
    });
  const [editingVehicleIndex, setEditingVehicleIndex] = useState(null);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [newPackagingItem, setNewPackagingItem] = useState({
    name: '',
    unit_price: '',
    in_stock: true,
  });
  const [uploadingInsurance, setUploadingInsurance] = useState(false);
  const [uploadingCompliance, setUploadingCompliance] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(createPageUrl('SupplierProfile'));
        return;
      }

      const userData = await base44.auth.me();
      setUser(userData);

      if (userData.supplier_id) {
        const suppliers = await base44.entities.Supplier.filter({ id: userData.supplier_id });
        if (suppliers.length > 0) {
          setSupplier(suppliers[0]);
          setFormData(suppliers[0]);
        }
      }
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Supplier.update(supplier.id, formData);
      setSupplier({ ...supplier, ...formData });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Error saving profile:', e);
    } finally {
      setSaving(false);
    }
  };

  const toggleRegion = (region) => {
    const regions = formData.service_regions || [];
    setFormData({
      ...formData,
      service_regions: regions.includes(region)
        ? regions.filter(r => r !== region)
        : [...regions, region]
    });
  };

  const toggleCapability = (capability) => {
    const capabilities = formData.capability_classes || [];
    setFormData({
      ...formData,
      capability_classes: capabilities.includes(capability)
        ? capabilities.filter(c => c !== capability)
        : [...capabilities, capability]
    });
  };

  const addVehicle = () => {
    if (newVehicle.vehicle_type && newVehicle.capacity_m3 && newVehicle.front_photo_url && newVehicle.back_photo_url) {
        setFormData({
          ...formData,
          fleet: [...(formData.fleet || []), { 
            ...newVehicle, 
            capacity_m3: parseFloat(newVehicle.capacity_m3),
            year: newVehicle.year ? parseInt(newVehicle.year) : null,
            crew_size: newVehicle.crew_size ? parseInt(newVehicle.crew_size) : null,
            rate_per_km: newVehicle.rate_per_km ? parseFloat(newVehicle.rate_per_km) : null,
            crew_member_rate: newVehicle.crew_member_rate ? parseFloat(newVehicle.crew_member_rate) : null,
          }]
        });
        setNewVehicle({ vehicle_type: '', make: '', model: '', year: '', capacity_m3: '', crew_size: '', rate_per_km: '', crew_member_rate: '', plate_number: '', front_photo_url: '', back_photo_url: '' });
    }
  };

  const handleVehiclePhotoUpload = async (file, type) => {
    if (type === 'front') setUploadingFront(true);
    else setUploadingBack(true);
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewVehicle({
        ...newVehicle,
        [type === 'front' ? 'front_photo_url' : 'back_photo_url']: file_url
      });
    } catch (e) {
      console.error('Error uploading photo:', e);
    } finally {
      if (type === 'front') setUploadingFront(false);
      else setUploadingBack(false);
    }
  };

  const removeVehicle = (index) => {
    setFormData({
      ...formData,
      fleet: formData.fleet.filter((_, i) => i !== index)
    });
  };

  const startEditVehicle = (index) => {
    setEditingVehicleIndex(index);
    setEditingVehicle({ ...formData.fleet[index] });
  };

  const saveEditVehicle = () => {
    const updatedFleet = [...(formData.fleet || [])];
    updatedFleet[editingVehicleIndex] = {
      ...editingVehicle,
      capacity_m3: parseFloat(editingVehicle.capacity_m3) || 0,
      year: editingVehicle.year ? parseInt(editingVehicle.year) : null,
      crew_size: editingVehicle.crew_size ? parseInt(editingVehicle.crew_size) : null,
      rate_per_km: editingVehicle.rate_per_km ? parseFloat(editingVehicle.rate_per_km) : null,
      crew_member_rate: editingVehicle.crew_member_rate ? parseFloat(editingVehicle.crew_member_rate) : null,
    };
    setFormData({ ...formData, fleet: updatedFleet });
    setEditingVehicleIndex(null);
    setEditingVehicle(null);
  };

  const cancelEditVehicle = () => {
    setEditingVehicleIndex(null);
    setEditingVehicle(null);
  };

  const addPackagingItem = () => {
    if (newPackagingItem.name && newPackagingItem.unit_price) {
      const pricing = formData.pricing || {};
      const packagingItems = pricing.packaging_items || [];
      const selectedOption = PACKAGING_OPTIONS.find(opt => opt.name === newPackagingItem.name);
      setFormData({
        ...formData,
        pricing: {
          ...pricing,
          packaging_items: [...packagingItems, { 
            name: newPackagingItem.name,
            category: selectedOption?.category || 'boxes',
            unit_price: parseFloat(newPackagingItem.unit_price),
            in_stock: newPackagingItem.in_stock
          }]
        }
      });
      setNewPackagingItem({ name: '', unit_price: '', in_stock: true });
    }
  };

  const removePackagingItem = (index) => {
    const pricing = formData.pricing || {};
    const packagingItems = pricing.packaging_items || [];
    setFormData({
      ...formData,
      pricing: {
        ...pricing,
        packaging_items: packagingItems.filter((_, i) => i !== index)
      }
    });
  };

  const handleDocUpload = async (file, docType) => {
    if (docType === 'insurance') setUploadingInsurance(true);
    else setUploadingCompliance(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, [docType === 'insurance' ? 'insurance_doc_url' : 'compliance_doc_url']: file_url });
    } catch (e) {
      console.error('Error uploading document:', e);
    } finally {
      if (docType === 'insurance') setUploadingInsurance(false);
      else setUploadingCompliance(false);
    }
  };

  const updatePricing = (field, value) => {
    setFormData({
      ...formData,
      pricing: {
        ...(formData.pricing || {}),
        [field]: value ? parseFloat(value) : 0
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 rounded-xl mb-6" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!supplier || !formData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500">No supplier profile found</p>
          <Button asChild className="mt-4">
            <Link to={createPageUrl('SupplierOnboarding')}>Complete Onboarding</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Company Profile</h1>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-black text-white hover:bg-gray-800"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved
              </>
            ) : saving ? (
              'Saving...'
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* Company Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="contact_phone">Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="contact_email">Email</Label>
              <Input
                id="contact_email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Service Regions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Service Regions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map(region => (
                <Badge
                  key={region}
                  variant={formData.service_regions?.includes(region) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer",
                    formData.service_regions?.includes(region) 
                      ? 'bg-black text-white' 
                      : 'hover:bg-gray-100'
                  )}
                  onClick={() => toggleRegion(region)}
                >
                  {region}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Capabilities */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Move Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {CAPABILITY_CLASSES.map(cap => (
                <Badge
                  key={cap.id}
                  variant={formData.capability_classes?.includes(cap.id) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer",
                    formData.capability_classes?.includes(cap.id) 
                      ? 'bg-black text-white' 
                      : 'hover:bg-gray-100'
                  )}
                  onClick={() => toggleCapability(cap.id)}
                >
                  {cap.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fleet */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Fleet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.fleet?.map((vehicle, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                {editingVehicleIndex === index && editingVehicle ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <Select value={editingVehicle.vehicle_type} onValueChange={(v) => setEditingVehicle({ ...editingVehicle, vehicle_type: v })}>
                        <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>
                          {['1-ton Bakkie','2-ton Truck','3-ton Truck','4-ton Truck','5-ton Truck','6-ton Truck','7-ton Truck','8-ton Truck','9-ton Truck','10-ton Truck'].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input placeholder="Make" value={editingVehicle.make || ''} onChange={(e) => setEditingVehicle({ ...editingVehicle, make: e.target.value })} />
                      <Input placeholder="Model" value={editingVehicle.model || ''} onChange={(e) => setEditingVehicle({ ...editingVehicle, model: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <Input placeholder="Year" type="number" value={editingVehicle.year || ''} onChange={(e) => setEditingVehicle({ ...editingVehicle, year: e.target.value })} />
                      <Input placeholder="Capacity (m³)" type="number" value={editingVehicle.capacity_m3 || ''} onChange={(e) => setEditingVehicle({ ...editingVehicle, capacity_m3: e.target.value })} />
                      <Input placeholder="Crew size" type="number" value={editingVehicle.crew_size || ''} onChange={(e) => setEditingVehicle({ ...editingVehicle, crew_size: e.target.value })} />
                      <Input placeholder="Plate #" value={editingVehicle.plate_number || ''} onChange={(e) => setEditingVehicle({ ...editingVehicle, plate_number: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Rate per KM (R)" type="number" value={editingVehicle.rate_per_km || ''} onChange={(e) => setEditingVehicle({ ...editingVehicle, rate_per_km: e.target.value })} />
                      <Input placeholder="Crew Member Rate (R)" type="number" value={editingVehicle.crew_member_rate || ''} onChange={(e) => setEditingVehicle({ ...editingVehicle, crew_member_rate: e.target.value })} />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={cancelEditVehicle}>Cancel</Button>
                      <Button size="sm" className="bg-black text-white hover:bg-gray-800" onClick={saveEditVehicle}><Check className="w-4 h-4 mr-1" /> Save</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1">
                        <span className="font-medium">{vehicle.vehicle_type}</span>
                        {vehicle.make && vehicle.model && (
                          <span className="text-gray-500 ml-2">• {vehicle.make} {vehicle.model}</span>
                        )}
                        {vehicle.year && (
                          <span className="text-gray-500 ml-1">({vehicle.year})</span>
                        )}
                      </div>
                      <span className="text-gray-500 text-sm">{vehicle.capacity_m3}m³</span>
                      {vehicle.crew_size && <span className="text-gray-500 text-sm">{vehicle.crew_size} crew</span>}
                      {vehicle.rate_per_km != null && <span className="text-gray-500 text-sm">R{vehicle.rate_per_km}/km</span>}
                      {vehicle.crew_member_rate != null && <span className="text-gray-500 text-sm">R{vehicle.crew_member_rate}/crew</span>}
                      <span className="text-gray-500 text-sm">{vehicle.plate_number}</span>
                      <Button variant="ghost" size="icon" onClick={() => startEditVehicle(index)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeVehicle(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {(vehicle.front_photo_url || vehicle.back_photo_url) && (
                      <div className="flex gap-2 mt-2">
                        {vehicle.front_photo_url && (
                          <img src={vehicle.front_photo_url} alt="Front" className="w-20 h-20 object-cover rounded" />
                        )}
                        {vehicle.back_photo_url && (
                          <img src={vehicle.back_photo_url} alt="Back" className="w-20 h-20 object-cover rounded" />
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            <div className="space-y-2 pt-4 border-t">
              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={newVehicle.vehicle_type}
                  onValueChange={(v) => setNewVehicle({ ...newVehicle, vehicle_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-ton Bakkie">1-ton Bakkie</SelectItem>
                    <SelectItem value="2-ton Truck">2-ton Truck</SelectItem>
                    <SelectItem value="3-ton Truck">3-ton Truck</SelectItem>
                    <SelectItem value="4-ton Truck">4-ton Truck</SelectItem>
                    <SelectItem value="5-ton Truck">5-ton Truck</SelectItem>
                    <SelectItem value="6-ton Truck">6-ton Truck</SelectItem>
                    <SelectItem value="7-ton Truck">7-ton Truck</SelectItem>
                    <SelectItem value="8-ton Truck">8-ton Truck</SelectItem>
                    <SelectItem value="9-ton Truck">9-ton Truck</SelectItem>
                    <SelectItem value="10-ton Truck">10-ton Truck</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Make"
                  value={newVehicle.make}
                  onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                />
                <Input
                  placeholder="Model"
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                <Input
                  placeholder="Year"
                  type="number"
                  value={newVehicle.year}
                  onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                />
                <Input
                  placeholder="Capacity (m³)"
                  type="number"
                  value={newVehicle.capacity_m3}
                  onChange={(e) => setNewVehicle({ ...newVehicle, capacity_m3: e.target.value })}
                />
                <Input
                  placeholder="Crew size"
                  type="number"
                  value={newVehicle.crew_size}
                  onChange={(e) => setNewVehicle({ ...newVehicle, crew_size: e.target.value })}
                />
                <Input
                  placeholder="Plate #"
                  value={newVehicle.plate_number}
                  onChange={(e) => setNewVehicle({ ...newVehicle, plate_number: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Rate per KM (R)"
                  type="number"
                  value={newVehicle.rate_per_km}
                  onChange={(e) => setNewVehicle({ ...newVehicle, rate_per_km: e.target.value })}
                />
                <Input
                  placeholder="Crew Member Rate (R)"
                  type="number"
                  value={newVehicle.crew_member_rate}
                  onChange={(e) => setNewVehicle({ ...newVehicle, crew_member_rate: e.target.value })}
                />
                <Button onClick={addVehicle} disabled={!newVehicle.vehicle_type || !newVehicle.capacity_m3 || !newVehicle.front_photo_url || !newVehicle.back_photo_url}>
                  <Plus className="w-4 h-4" /> Add Vehicle
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-sm text-gray-600">Front Photo</Label>
                  <div className="mt-1">
                    {newVehicle.front_photo_url ? (
                      <div className="relative">
                        <img src={newVehicle.front_photo_url} alt="Front" className="w-full h-24 object-cover rounded" />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 bg-white"
                          onClick={() => setNewVehicle({ ...newVehicle, front_photo_url: '' })}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center h-24 border-2 border-dashed rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleVehiclePhotoUpload(e.target.files[0], 'front')}
                          disabled={uploadingFront}
                        />
                        <Upload className="w-5 h-5 text-gray-400" />
                        {uploadingFront && <span className="ml-2 text-sm">Uploading...</span>}
                      </label>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Back Photo</Label>
                  <div className="mt-1">
                    {newVehicle.back_photo_url ? (
                      <div className="relative">
                        <img src={newVehicle.back_photo_url} alt="Back" className="w-full h-24 object-cover rounded" />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 bg-white"
                          onClick={() => setNewVehicle({ ...newVehicle, back_photo_url: '' })}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center h-24 border-2 border-dashed rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleVehiclePhotoUpload(e.target.files[0], 'back')}
                          disabled={uploadingBack}
                        />
                        <Upload className="w-5 h-5 text-gray-400" />
                        {uploadingBack && <span className="ml-2 text-sm">Uploading...</span>}
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Documents */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Insurance Document</Label>
                <div className="mt-1.5 space-y-2">
                  {formData.insurance_doc_url && (
                    <a href={formData.insurance_doc_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                      <FileText className="w-4 h-4" /> View Current Document
                    </a>
                  )}
                  <label className="flex items-center justify-center gap-2 h-10 border-2 border-dashed rounded cursor-pointer hover:bg-gray-50 text-sm text-gray-500">
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleDocUpload(e.target.files[0], 'insurance')}
                      disabled={uploadingInsurance} />
                    <Upload className="w-4 h-4" />
                    {uploadingInsurance ? 'Uploading...' : formData.insurance_doc_url ? 'Replace Document' : 'Upload Document'}
                  </label>
                </div>
              </div>
              <div>
                <Label>Business Owner ID</Label>
                <div className="mt-1.5 space-y-2">
                  {formData.compliance_doc_url && (
                    <a href={formData.compliance_doc_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                      <FileText className="w-4 h-4" /> View Current Document
                    </a>
                  )}
                  <label className="flex items-center justify-center gap-2 h-10 border-2 border-dashed rounded cursor-pointer hover:bg-gray-50 text-sm text-gray-500">
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleDocUpload(e.target.files[0], 'compliance')}
                      disabled={uploadingCompliance} />
                    <Upload className="w-4 h-4" />
                    {uploadingCompliance ? 'Uploading...' : formData.compliance_doc_url ? 'Replace Document' : 'Upload Document'}
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Rates */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="packing_service">Packing Service Rate (R)</Label>
                <Input
                  id="packing_service"
                  type="number"
                  placeholder="0.00"
                  value={formData.pricing?.packing_service_rate || ''}
                  onChange={(e) => updatePricing('packing_service_rate', e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="shuttle_service">Shuttle Service Rate (R)</Label>
                <Input
                  id="shuttle_service"
                  type="number"
                  placeholder="0.00"
                  value={formData.pricing?.shuttle_service_rate || ''}
                  onChange={(e) => updatePricing('shuttle_service_rate', e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Packaging Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5" />
              Packaging & Boxing Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.pricing?.packaging_items?.map((item, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-gray-500 text-sm ml-2">({item.category})</span>
                </div>
                <span className="font-semibold">R {item.unit_price.toFixed(2)}</span>
                <Badge variant={item.in_stock ? "default" : "outline"} className={item.in_stock ? "bg-green-500" : ""}>
                  {item.in_stock ? 'In Stock' : 'Out of Stock'}
                </Badge>
                <Button variant="ghost" size="icon" onClick={() => removePackagingItem(index)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <div className="grid grid-cols-4 gap-2 pt-4 border-t">
              <Select
                value={newPackagingItem.name}
                onValueChange={(v) => setNewPackagingItem({ ...newPackagingItem, name: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Item name" />
                </SelectTrigger>
                <SelectContent>
                  {PACKAGING_OPTIONS.map(opt => (
                    <SelectItem key={opt.name} value={opt.name}>
                      {opt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Price (R)"
                type="number"
                value={newPackagingItem.unit_price}
                onChange={(e) => setNewPackagingItem({ ...newPackagingItem, unit_price: e.target.value })}
                required
              />
              <Select
                value={newPackagingItem.in_stock.toString()}
                onValueChange={(v) => setNewPackagingItem({ ...newPackagingItem, in_stock: v === 'true' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">In Stock</SelectItem>
                  <SelectItem value="false">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addPackagingItem} disabled={!newPackagingItem.name || !newPackagingItem.unit_price}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}