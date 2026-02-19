import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { 
  Truck, Building2, FileText, CheckCircle2, Upload, Plus, X, 
  ArrowRight, Shield, Star, DollarSign, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const CAPABILITY_CLASSES = [
  { id: 'apartment', label: 'Apartment', description: 'Apartment moves' },
  { id: 'house', label: 'House', description: 'House moves' },
  { id: 'office', label: 'Office', description: 'Commercial relocations' },
  { id: 'long_distance', label: 'Long Distance', description: 'Inter-city moves' },
];

const REGIONS = [
  'Cape Town',
  'Johannesburg',
  'Pretoria',
  'Durban',
  'Port Elizabeth',
  'Bloemfontein',
  'East London',
  'Polokwane',
  'Nelspruit',
  'Kimberley',
];

export default function SupplierOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    company_name: '',
    registration_number: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    service_regions: [],
    capability_classes: [],
    crew_capacity: 2,
    fleet: [],
    insurance_doc_url: '',
    compliance_doc_url: '',
    agreement_accepted: false,
  });

  const [newVehicle, setNewVehicle] = useState({
    vehicle_type: '',
    make: '',
    model: '',
    year: '',
    capacity_m3: '',
    crew_size: '',
    plate_number: '',
    front_photo_url: '',
    back_photo_url: '',
  });
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (isAuth) {
      const userData = await base44.auth.me();
      setUser(userData);
      setFormData(prev => ({
        ...prev,
        contact_email: userData.email,
        contact_person: userData.full_name || '',
      }));
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleRegion = (region) => {
    setFormData(prev => ({
      ...prev,
      service_regions: prev.service_regions.includes(region)
        ? prev.service_regions.filter(r => r !== region)
        : [...prev.service_regions, region]
    }));
  };

  const toggleCapability = (capability) => {
    setFormData(prev => ({
      ...prev,
      capability_classes: prev.capability_classes.includes(capability)
        ? prev.capability_classes.filter(c => c !== capability)
        : [...prev.capability_classes, capability]
    }));
  };

  const addVehicle = () => {
    if (newVehicle.vehicle_type && newVehicle.capacity_m3 && newVehicle.front_photo_url && newVehicle.back_photo_url) {
      setFormData(prev => ({
        ...prev,
        fleet: [...prev.fleet, { 
          ...newVehicle, 
          capacity_m3: parseFloat(newVehicle.capacity_m3),
          year: newVehicle.year ? parseInt(newVehicle.year) : null,
          crew_size: newVehicle.crew_size ? parseInt(newVehicle.crew_size) : null,
        }]
      }));
      setNewVehicle({ vehicle_type: '', make: '', model: '', year: '', capacity_m3: '', crew_size: '', plate_number: '', front_photo_url: '', back_photo_url: '' });
    }
  };

  const handleVehiclePhotoUpload = async (file, type) => {
    if (type === 'front') setUploadingFront(true);
    else setUploadingBack(true);
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewVehicle(prev => ({
        ...prev,
        [type === 'front' ? 'front_photo_url' : 'back_photo_url']: file_url
      }));
    } catch (e) {
      console.error('Error uploading photo:', e);
    } finally {
      if (type === 'front') setUploadingFront(false);
      else setUploadingBack(false);
    }
  };

  const removeVehicle = (index) => {
    setFormData(prev => ({
      ...prev,
      fleet: prev.fleet.filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = async (file, field) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange(field, file_url);
    } catch (e) {
      console.error('Upload failed:', e);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      base44.auth.redirectToLogin(createPageUrl('SupplierOnboarding'));
      return;
    }

    setLoading(true);
    try {
      // Create supplier
      const supplier = await base44.entities.Supplier.create({
        ...formData,
        user_id: user.id,
        status: 'pending',
      });

      // Update user type
      await base44.auth.updateMe({
        user_type: 'supplier',
        supplier_id: supplier.id,
      });

      navigate(createPageUrl('SupplierDashboard'));
    } catch (e) {
      console.error('Error creating supplier:', e);
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: Users, title: 'Access Customers', description: 'Connect with customers actively looking to move' },
    { icon: Shield, title: 'Secure Payments', description: 'Get paid safely through our platform' },
    { icon: Star, title: 'Build Reputation', description: 'Grow your business through reviews' },
    { icon: DollarSign, title: 'Transparent Pricing', description: 'Set your own competitive rates' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      {step === 1 && (
        <section className="bg-black text-white py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Truck className="w-8 h-8" />
              </div>
              <h1 className="text-4xl font-bold mb-4">
                Partner with House Moves
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join our network of verified moving companies and grow your business 
                with access to thousands of customers.
              </p>
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-gray-100 h-14 px-8"
                onClick={() => setStep(2)}
              >
                Start Application
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-center mb-12">
              Why Partner With Us?
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={benefit.title} className="border-0 shadow-sm">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <benefit.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-gray-500">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Application Form */}
      {step >= 2 && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Progress */}
          <div className="flex items-center justify-between mb-8">
            {[2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  step >= s ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s - 1}
                </div>
                {s < 4 && (
                  <div className={`flex-1 h-px mx-2 ${step > s ? 'bg-black' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 2: Company Info */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-2xl font-bold mb-2">Company Information</h2>
              <p className="text-gray-500 mb-8">Tell us about your moving company</p>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    placeholder="Your Moving Company (Pty) Ltd"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="registration_number">Registration Number</Label>
                  <Input
                    id="registration_number"
                    value={formData.registration_number}
                    onChange={(e) => handleChange('registration_number', e.target.value)}
                    placeholder="2024/123456/07"
                    className="mt-1.5"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_person">Contact Person *</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => handleChange('contact_person', e.target.value)}
                      placeholder="John Smith"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_phone">Phone Number *</Label>
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone}
                      onChange={(e) => handleChange('contact_phone', e.target.value)}
                      placeholder="072 123 4567"
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="contact_email">Email Address *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleChange('contact_email', e.target.value)}
                    placeholder="info@yourcompany.co.za"
                    className="mt-1.5"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={() => setStep(3)}
                    disabled={!formData.company_name || !formData.contact_person || !formData.contact_phone}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Services & Fleet */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-2xl font-bold mb-2">Services & Fleet</h2>
              <p className="text-gray-500 mb-8">Define your service capabilities</p>

              <div className="space-y-8">
                {/* Service Regions */}
                <div>
                  <Label className="mb-3 block">Service Regions *</Label>
                  <div className="flex flex-wrap gap-2">
                    {REGIONS.map(region => (
                      <Badge
                        key={region}
                        variant={formData.service_regions.includes(region) ? "default" : "outline"}
                        className={`cursor-pointer ${
                          formData.service_regions.includes(region) 
                            ? 'bg-black text-white' 
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => toggleRegion(region)}
                      >
                        {region}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Capability Classes */}
                <div>
                  <Label className="mb-3 block">Move Types You Handle *</Label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {CAPABILITY_CLASSES.map(cap => (
                      <Card 
                        key={cap.id}
                        className={`cursor-pointer transition-all ${
                          formData.capability_classes.includes(cap.id)
                            ? 'border-2 border-black bg-gray-50'
                            : 'border-2 border-transparent hover:border-gray-200'
                        }`}
                        onClick={() => toggleCapability(cap.id)}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <Checkbox checked={formData.capability_classes.includes(cap.id)} />
                          <div>
                            <p className="font-medium">{cap.label}</p>
                            <p className="text-sm text-gray-500">{cap.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Fleet */}
                <div>
                  <Label className="mb-3 block">Your Fleet *</Label>
                  {formData.fleet.map((vehicle, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg mb-2">
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
                        <span className="text-gray-500">{vehicle.capacity_m3}m³</span>
                        <span className="text-gray-500">{vehicle.plate_number}</span>
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
                    </div>
                  ))}
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <Select
                        value={newVehicle.vehicle_type}
                        onValueChange={(v) => setNewVehicle(prev => ({ ...prev, vehicle_type: v }))}
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
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, make: e.target.value }))}
                      />
                      <Input
                        placeholder="Model"
                        value={newVehicle.model}
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, model: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      <Input
                        placeholder="Year"
                        type="number"
                        value={newVehicle.year}
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, year: e.target.value }))}
                      />
                      <Input
                        placeholder="Capacity (m³)"
                        type="number"
                        value={newVehicle.capacity_m3}
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, capacity_m3: e.target.value }))}
                      />
                      <Input
                        placeholder="Crew size"
                        type="number"
                        value={newVehicle.crew_size}
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, crew_size: e.target.value }))}
                      />
                      <Input
                        placeholder="Plate #"
                        value={newVehicle.plate_number}
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, plate_number: e.target.value }))}
                      />
                      <Button onClick={addVehicle} disabled={!newVehicle.vehicle_type || !newVehicle.capacity_m3 || !newVehicle.front_photo_url || !newVehicle.back_photo_url}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-sm text-gray-600">Front Photo *</Label>
                        <div className="mt-1">
                          {newVehicle.front_photo_url ? (
                            <div className="relative">
                              <img src={newVehicle.front_photo_url} alt="Front" className="w-full h-24 object-cover rounded" />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 bg-white"
                                onClick={() => setNewVehicle(prev => ({ ...prev, front_photo_url: '' }))}
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
                        <Label className="text-sm text-gray-600">Back Photo *</Label>
                        <div className="mt-1">
                          {newVehicle.back_photo_url ? (
                            <div className="relative">
                              <img src={newVehicle.back_photo_url} alt="Back" className="w-full h-24 object-cover rounded" />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 bg-white"
                                onClick={() => setNewVehicle(prev => ({ ...prev, back_photo_url: '' }))}
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
                </div>



                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button 
                    onClick={() => setStep(4)}
                    disabled={formData.service_regions.length === 0 || formData.capability_classes.length === 0 || formData.fleet.length === 0}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Documents & Agreement */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-2xl font-bold mb-2">Documents & Agreement</h2>
              <p className="text-gray-500 mb-8">Upload required documents and accept our terms</p>

              <div className="space-y-6">
                {/* Document Uploads */}
                <div>
                  <Label className="mb-3 block">Insurance Document *</Label>
                  <div className="border-2 border-dashed rounded-xl p-6 text-center">
                    {formData.insurance_doc_url ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Document uploaded</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 mb-2">
                          Upload your insurance certificate
                        </p>
                        <Label className="cursor-pointer">
                          <span className="text-black underline">Choose file</span>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleFileUpload(e.target.files[0], 'insurance_doc_url');
                              }
                            }}
                          />
                        </Label>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Business Owner ID *</Label>
                  <div className="border-2 border-dashed rounded-xl p-6 text-center">
                    {formData.compliance_doc_url ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Document uploaded</span>
                      </div>
                    ) : (
                      <>
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 mb-2">
                          Upload business owner ID document
                        </p>
                        <Label className="cursor-pointer">
                          <span className="text-black underline">Choose file</span>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleFileUpload(e.target.files[0], 'compliance_doc_url');
                              }
                            }}
                          />
                        </Label>
                      </>
                    )}
                  </div>
                </div>

                {/* Terms Agreement */}
                <Card className="bg-gray-50 border-0">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="agreement"
                        checked={formData.agreement_accepted}
                        onCheckedChange={(v) => handleChange('agreement_accepted', v)}
                      />
                      <div>
                        <Label htmlFor="agreement" className="font-medium cursor-pointer">
                          I agree to the Supplier Terms & Conditions
                        </Label>
                        <p className="text-sm text-gray-500 mt-1">
                          By checking this box, you agree to our{' '}
                          <a href="#" className="text-black underline">Supplier Agreement</a>,{' '}
                          <a href="#" className="text-black underline">Service Standards</a>, and{' '}
                          <a href="#" className="text-black underline">Payment Terms</a>.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={!formData.agreement_accepted || !formData.insurance_doc_url || !formData.compliance_doc_url || loading}
                    className="bg-black text-white hover:bg-gray-800 min-w-[150px]"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      'Submit Application'
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}