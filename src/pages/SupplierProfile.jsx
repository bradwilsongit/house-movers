import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { 
  Building2, MapPin, Truck, Users, Save, Check, Plus, X, Upload, DollarSign, Package
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
  { id: 'micro', label: 'Micro Move' },
  { id: 'small', label: 'Small Move' },
  { id: 'family', label: 'Family Move' },
  { id: 'office', label: 'Office Move' },
  { id: 'long_distance', label: 'Long Distance' },
];

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

export default function SupplierProfile() {
  const [user, setUser] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState(null);
  const [newVehicle, setNewVehicle] = useState({
    vehicle_type: '',
    capacity_m3: '',
    plate_number: '',
  });
  const [newPackagingItem, setNewPackagingItem] = useState({
    name: '',
    unit_price: '',
    in_stock: true,
  });

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
    if (newVehicle.vehicle_type && newVehicle.capacity_m3) {
      setFormData({
        ...formData,
        fleet: [...(formData.fleet || []), { ...newVehicle, capacity_m3: parseFloat(newVehicle.capacity_m3) }]
      });
      setNewVehicle({ vehicle_type: '', capacity_m3: '', plate_number: '' });
    }
  };

  const removeVehicle = (index) => {
    setFormData({
      ...formData,
      fleet: formData.fleet.filter((_, i) => i !== index)
    });
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
              <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="flex-1 font-medium">{vehicle.vehicle_type}</span>
                <span className="text-gray-500">{vehicle.capacity_m3}m³</span>
                <span className="text-gray-500">{vehicle.plate_number}</span>
                <Button variant="ghost" size="icon" onClick={() => removeVehicle(index)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <div className="grid grid-cols-4 gap-2 pt-4 border-t">
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
                  <SelectItem value="4-ton Truck">4-ton Truck</SelectItem>
                  <SelectItem value="6-ton Truck">6-ton Truck</SelectItem>
                  <SelectItem value="8-ton Truck">8-ton Truck</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Capacity (m³)"
                value={newVehicle.capacity_m3}
                onChange={(e) => setNewVehicle({ ...newVehicle, capacity_m3: e.target.value })}
              />
              <Input
                placeholder="Plate #"
                value={newVehicle.plate_number}
                onChange={(e) => setNewVehicle({ ...newVehicle, plate_number: e.target.value })}
              />
              <Button onClick={addVehicle} disabled={!newVehicle.vehicle_type}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Crew */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Crew Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label>Maximum Crew Size</Label>
              <Select
                value={formData.crew_capacity?.toString()}
                onValueChange={(v) => setFormData({ ...formData, crew_capacity: parseInt(v) })}
              >
                <SelectTrigger className="mt-1.5 w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6, 8, 10].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} crew members</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <Label htmlFor="rate_per_km">Rate per KM (R)</Label>
                <Input
                  id="rate_per_km"
                  type="number"
                  placeholder="0.00"
                  value={formData.pricing?.rate_per_km || ''}
                  onChange={(e) => updatePricing('rate_per_km', e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="crew_rate">Crew Member Rate/Hour (R)</Label>
                <Input
                  id="crew_rate"
                  type="number"
                  placeholder="0.00"
                  value={formData.pricing?.crew_member_rate || ''}
                  onChange={(e) => updatePricing('crew_member_rate', e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="packing_service">Packing Service Rate/Hour (R)</Label>
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