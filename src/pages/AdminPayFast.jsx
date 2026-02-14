import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CreditCard, Save, Check, AlertCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

export default function AdminPayFast() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    payfast_merchant_id: '',
    payfast_merchant_key: '',
    payfast_passphrase: '',
    payfast_environment: 'sandbox',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const allSettings = await base44.entities.AppSettings.list();
      if (allSettings.length > 0) {
        setSettings(allSettings[0]);
        setFormData({
          payfast_merchant_id: allSettings[0].payfast_merchant_id || '',
          payfast_merchant_key: allSettings[0].payfast_merchant_key || '',
          payfast_passphrase: allSettings[0].payfast_passphrase || '',
          payfast_environment: allSettings[0].payfast_environment || 'sandbox',
        });
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
        ...formData,
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const notifyUrl = `${window.location.origin}/api/payfast-itn`;
  const returnUrl = `${window.location.origin}/payment-return`;
  const cancelUrl = `${window.location.origin}/payment-cancelled`;

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
            <h1 className="text-2xl font-bold">PayFast Configuration</h1>
            <p className="text-gray-500 mt-1">Configure PayFast payment gateway credentials</p>
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
            Use sandbox mode for testing with test cards. Switch to live mode only when ready for production.
          </AlertDescription>
        </Alert>

        {/* Environment Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Environment</CardTitle>
            <CardDescription>
              Select sandbox for testing or live for production payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={formData.payfast_environment}
              onValueChange={(value) => setFormData({ ...formData, payfast_environment: value })}
            >
              <div className="flex items-center space-x-2 mb-3">
                <RadioGroupItem value="sandbox" id="sandbox" />
                <Label htmlFor="sandbox" className="cursor-pointer">
                  <span className="font-medium">Sandbox</span>
                  <span className="text-sm text-gray-500 ml-2">- Test mode with test cards</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="live" id="live" />
                <Label htmlFor="live" className="cursor-pointer">
                  <span className="font-medium">Live</span>
                  <span className="text-sm text-gray-500 ml-2">- Production mode with real payments</span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Credentials */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              PayFast Credentials
            </CardTitle>
            <CardDescription>
              Get these from your PayFast merchant dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="merchant_id">Merchant ID</Label>
              <Input
                id="merchant_id"
                value={formData.payfast_merchant_id}
                onChange={(e) => setFormData({ ...formData, payfast_merchant_id: e.target.value })}
                placeholder={formData.payfast_environment === 'sandbox' ? '10000100' : 'Enter your merchant ID'}
                className="mt-1.5"
              />
              {formData.payfast_environment === 'sandbox' && (
                <p className="text-xs text-gray-500 mt-1">Test Merchant ID: 10000100</p>
              )}
            </div>

            <div>
              <Label htmlFor="merchant_key">Merchant Key</Label>
              <Input
                id="merchant_key"
                type="password"
                value={formData.payfast_merchant_key}
                onChange={(e) => setFormData({ ...formData, payfast_merchant_key: e.target.value })}
                placeholder={formData.payfast_environment === 'sandbox' ? '46f0cd694581a' : 'Enter your merchant key'}
                className="mt-1.5"
              />
              {formData.payfast_environment === 'sandbox' && (
                <p className="text-xs text-gray-500 mt-1">Test Merchant Key: 46f0cd694581a</p>
              )}
            </div>

            <div>
              <Label htmlFor="passphrase">Security Passphrase (optional but recommended)</Label>
              <Input
                id="passphrase"
                type="password"
                value={formData.payfast_passphrase}
                onChange={(e) => setFormData({ ...formData, payfast_passphrase: e.target.value })}
                placeholder="Enter your security passphrase"
                className="mt-1.5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Set this in your PayFast account settings for enhanced security
              </p>
            </div>
          </CardContent>
        </Card>

        {/* URLs for PayFast Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Integration URLs</CardTitle>
            <CardDescription>
              Configure these URLs in your PayFast merchant dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Notify URL (ITN)</Label>
              <div className="flex gap-2">
                <Input value={notifyUrl} readOnly className="bg-gray-50" />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => copyToClipboard(notifyUrl)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                PayFast will POST transaction updates to this URL
              </p>
            </div>

            <div>
              <Label className="mb-2 block">Return URL</Label>
              <div className="flex gap-2">
                <Input value={returnUrl} readOnly className="bg-gray-50" />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => copyToClipboard(returnUrl)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Customer returns here after successful payment
              </p>
            </div>

            <div>
              <Label className="mb-2 block">Cancel URL</Label>
              <div className="flex gap-2">
                <Input value={cancelUrl} readOnly className="bg-gray-50" />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => copyToClipboard(cancelUrl)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Customer returns here if payment is cancelled
              </p>
            </div>
          </CardContent>
        </Card>

        {formData.payfast_environment === 'live' && (
          <Alert className="mt-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">
              <strong>Live Mode Warning:</strong> Real payments will be processed. Ensure all credentials are correct.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}