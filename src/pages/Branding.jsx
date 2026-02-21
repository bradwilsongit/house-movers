import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Image, Save, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Branding() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [formData, setFormData] = useState({
    logo_url: '',
    icon_url: '',
    company_name: '',
    logo_height: 40,
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
          logo_url: allSettings[0].logo_url || '',
          icon_url: allSettings[0].icon_url || '',
          company_name: allSettings[0].company_name || '',
          logo_height: allSettings[0].logo_height || 40,
        });
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, logo_url: file_url });
    } catch (e) {
      console.error('Error uploading logo:', e);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings) {
        await base44.entities.AppSettings.update(settings.id, formData);
      } else {
        const newSettings = await base44.entities.AppSettings.create(formData);
        setSettings(newSettings);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setTimeout(() => window.location.reload(), 500);
    } catch (e) {
      console.error('Error saving settings:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleIconUpload = async (file) => {
    setUploadingIcon(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, icon_url: file_url });
    } catch (e) {
      console.error('Error uploading icon:', e);
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logo_url: '' });
  };

  const handleRemoveIcon = () => {
    setFormData({ ...formData, icon_url: '' });
  };

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
            <h1 className="text-2xl font-bold">Branding</h1>
            <p className="text-gray-500 mt-1">Customize your app's logo and name</p>
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

        {/* Logo Upload */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Logo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-3 block">Current Logo</Label>
              {formData.logo_url ? (
                <div className="relative inline-block">
                  <img 
                    src={formData.logo_url} 
                    alt="Logo" 
                    className="h-16 object-contain rounded-lg border-2 border-gray-200 p-2 bg-white"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 bg-white border shadow-sm hover:bg-red-50"
                    onClick={handleRemoveLogo}
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-16 w-16 bg-black rounded-xl">
                  <span className="text-white text-2xl font-bold">
                    {formData.company_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            <div>
              <Label className="mb-3 block">Upload New Logo</Label>
              <div className="border-2 border-dashed rounded-xl p-6 text-center">
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Uploading...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-2">
                      Upload your logo (PNG, JPG, or SVG)
                    </p>
                    <p className="text-xs text-gray-400 mb-4">
                      Recommended: Square format, 200x200px minimum
                    </p>
                    <Label className="cursor-pointer">
                      <span className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                        Choose File
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleLogoUpload(e.target.files[0]);
                          }
                        }}
                      />
                    </Label>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Name */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Company Name</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="company_name">Name displayed in header (optional)</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Leave blank to show only logo"
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Logo Size */}
        {formData.logo_url && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Logo Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="logo_height">Logo height (pixels)</Label>
                <Input
                  id="logo_height"
                  type="number"
                  value={formData.logo_height}
                  onChange={(e) => setFormData({ ...formData, logo_height: parseInt(e.target.value) || 40 })}
                  min="20"
                  max="100"
                  className="mt-1.5 w-32"
                />
                <p className="text-xs text-gray-500 mt-1">Recommended: 40-60px</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview */}
        <Card className="bg-gray-100 border-0">
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                {formData.logo_url ? (
                  <img 
                    src={formData.logo_url} 
                    alt="Logo" 
                    className="object-contain"
                    style={{ height: `${formData.logo_height}px` }}
                  />
                ) : (
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">
                      {formData.company_name?.charAt(0) || 'H'}
                    </span>
                  </div>
                )}
                {formData.company_name && (
                  <span className="font-semibold text-xl tracking-tight">
                    {formData.company_name}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}