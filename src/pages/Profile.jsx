import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { User, Mail, Phone, MapPin, Plus, Trash2, Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    saved_addresses: [],
    notification_preferences: {
      email: true,
      sms: false,
      push: true,
    },
  });
  const [newAddress, setNewAddress] = useState({
    label: '',
    address: '',
    city: '',
    postal_code: '',
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setLoading(true);
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(createPageUrl('Profile'));
        return;
      }

      const userData = await base44.auth.me();
      setUser(userData);
      setFormData({
        phone: userData.phone || '',
        saved_addresses: userData.saved_addresses || [],
        notification_preferences: userData.notification_preferences || {
          email: true,
          sms: false,
          push: true,
        },
      });
    } catch (e) {
      console.error('Error loading user:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Error saving profile:', e);
    } finally {
      setSaving(false);
    }
  };

  const addAddress = () => {
    if (newAddress.label && newAddress.address) {
      setFormData({
        ...formData,
        saved_addresses: [...formData.saved_addresses, { ...newAddress }],
      });
      setNewAddress({ label: '', address: '', city: '', postal_code: '' });
    }
  };

  const removeAddress = (index) => {
    setFormData({
      ...formData,
      saved_addresses: formData.saved_addresses.filter((_, i) => i !== index),
    });
  };

  const updateNotificationPref = (key, value) => {
    setFormData({
      ...formData,
      notification_preferences: {
        ...formData.notification_preferences,
        [key]: value,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 rounded-xl mb-6" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Profile</h1>
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

        {/* Basic Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <div className="flex items-center gap-2 mt-1.5 p-3 bg-gray-50 rounded-lg">
                <User className="w-4 h-4 text-gray-400" />
                <span>{user?.full_name || 'Not set'}</span>
              </div>
            </div>

            <div>
              <Label>Email</Label>
              <div className="flex items-center gap-2 mt-1.5 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{user?.email}</span>
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Phone className="w-4 h-4 text-gray-400" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="072 123 4567"
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saved Addresses */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Saved Addresses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.saved_addresses.map((address, index) => (
              <div key={index} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">{address.label}</p>
                    <p className="text-sm text-gray-600">{address.address}</p>
                    <p className="text-sm text-gray-500">
                      {address.city} {address.postal_code}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAddress(index)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Add New Address</p>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Label (e.g. Home)"
                  value={newAddress.label}
                  onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                />
                <Input
                  placeholder="City"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                />
                <Input
                  placeholder="Street Address"
                  value={newAddress.address}
                  onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                  className="col-span-2"
                />
                <Input
                  placeholder="Postal Code"
                  value={newAddress.postal_code}
                  onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                />
                <Button 
                  onClick={addAddress}
                  disabled={!newAddress.label || !newAddress.address}
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Address
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive updates via email</p>
              </div>
              <Switch
                checked={formData.notification_preferences.email}
                onCheckedChange={(v) => updateNotificationPref('email', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">SMS Notifications</p>
                <p className="text-sm text-gray-500">Receive urgent updates via SMS</p>
              </div>
              <Switch
                checked={formData.notification_preferences.sms}
                onCheckedChange={(v) => updateNotificationPref('sms', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-gray-500">Receive in-app notifications</p>
              </div>
              <Switch
                checked={formData.notification_preferences.push}
                onCheckedChange={(v) => updateNotificationPref('push', v)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}