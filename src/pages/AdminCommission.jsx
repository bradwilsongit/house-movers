import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { DollarSign, Save, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminCommission() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [commissionRate, setCommissionRate] = useState(10);
  const [googleMapsKey, setGoogleMapsKey] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const allSettings = await base44.entities.AppSettings.list();
      if (allSettings.length > 0) {
        setSettings(allSettings[0]);
        setCommissionRate(allSettings[0].commission_rate || 10);
        setGoogleMapsKey(allSettings[0].google_maps_api_key || '');
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        ...settings,
        commission_rate: parseFloat(commissionRate),
        google_maps_api_key: googleMapsKey,
      };

      if (settings) {
        await base44.entities.AppSettings.update(settings.id, data);
      } else {
        const newSettings = await base44.entities.AppSettings.create(data);
        setSettings(newSettings);
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Error saving settings:', e);
    } finally {
      setSaving(false);
    }
  };

  const calculateExample = () => {
    const supplierPrice = 1000;
    const commission = (supplierPrice * commissionRate) / 100;
    const total = supplierPrice + commission;
    return { supplierPrice, commission, total };
  };

  const example = calculateExample();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Platform Commission</h1>
            <p className="text-gray-500 mt-1">Configure commission rate and pricing settings</p>
          </div>
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

        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            Commission is applied on top of the supplier's base price and stored per booking for audit purposes.
          </AlertDescription>
        </Alert>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Commission Rate
            </CardTitle>
            <CardDescription>
              Set the platform commission percentage applied to all bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="commission_rate">Commission Percentage (%)</Label>
              <Input
                id="commission_rate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="mt-1.5 max-w-xs"
              />
              <p className="text-xs text-gray-500 mt-1">Default: 10%</p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-3">Pricing Formula</p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Supplier Base Price:</span>
                  <span className="font-medium">distance_km × supplier_km_rate</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform Commission:</span>
                  <span className="font-medium">base_price × {commissionRate}%</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600 font-medium">Total Customer Price:</span>
                  <span className="font-semibold">base_price + commission</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-3">Example Calculation</p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Supplier Price:</span>
                  <span className="font-medium">R {example.supplierPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Commission ({commissionRate}%):</span>
                  <span className="font-medium">R {example.commission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600 font-medium">Customer Pays:</span>
                  <span className="font-semibold text-lg">R {example.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Google Maps API</CardTitle>
            <CardDescription>
              Required for distance and duration calculations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="google_maps_key">Google Maps API Key</Label>
              <Input
                id="google_maps_key"
                type="password"
                value={googleMapsKey}
                onChange={(e) => setGoogleMapsKey(e.target.value)}
                placeholder="Enter your Google Maps API key"
                className="mt-1.5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enable Distance Matrix API in your Google Cloud Console
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}