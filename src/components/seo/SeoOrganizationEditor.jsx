import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Plus, Trash2 } from 'lucide-react';

export default function SeoOrganizationEditor() {
  const [form, setForm] = useState({
    org_name: '', org_type: 'LocalBusiness', website_url: '', logo_url: '',
    description: '', phone: '', email: '',
    address_street: '', address_city: '', address_region: '',
    address_postal_code: '', address_country: 'ZA',
    service_area: '', social_profiles: [], contact_type: 'customer service',
    founding_year: '', price_range: '', robots_txt_custom: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgId, setOrgId] = useState(null);
  const [socialInput, setSocialInput] = useState('');

  useEffect(() => {
    base44.entities.SeoOrganization.list().then(data => {
      if (data?.[0]) {
        setForm({ ...form, ...data[0], social_profiles: data[0].social_profiles || [] });
        setOrgId(data[0].id);
      }
    }).finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (orgId) {
        await base44.entities.SeoOrganization.update(orgId, form);
      } else {
        const created = await base44.entities.SeoOrganization.create(form);
        setOrgId(created.id);
      }
    } finally {
      setSaving(false);
    }
  };

  const addSocial = () => {
    if (socialInput.trim()) {
      set('social_profiles', [...form.social_profiles, socialInput.trim()]);
      setSocialInput('');
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Organisation Name</Label>
          <Input value={form.org_name} onChange={e => set('org_name', e.target.value)} placeholder="House Movers" />
        </div>
        <div className="space-y-1">
          <Label>Organisation Type</Label>
          <Select value={form.org_type} onValueChange={v => set('org_type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Organization">Organization</SelectItem>
              <SelectItem value="LocalBusiness">LocalBusiness</SelectItem>
              <SelectItem value="MovingCompany">MovingCompany</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Website URL</Label>
          <Input value={form.website_url} onChange={e => set('website_url', e.target.value)} placeholder="https://..." />
        </div>
        <div className="space-y-1">
          <Label>Logo URL</Label>
          <Input value={form.logo_url} onChange={e => set('logo_url', e.target.value)} placeholder="https://..." />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Phone</Label>
          <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+27..." />
        </div>
        <div className="space-y-1">
          <Label>Email</Label>
          <Input value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Address</Label>
        <div className="grid grid-cols-2 gap-3">
          <Input value={form.address_street} onChange={e => set('address_street', e.target.value)} placeholder="Street address" />
          <Input value={form.address_city} onChange={e => set('address_city', e.target.value)} placeholder="City" />
          <Input value={form.address_region} onChange={e => set('address_region', e.target.value)} placeholder="Province/Region" />
          <Input value={form.address_postal_code} onChange={e => set('address_postal_code', e.target.value)} placeholder="Postal code" />
          <Input value={form.address_country} onChange={e => set('address_country', e.target.value)} placeholder="Country code (e.g. ZA)" />
          <Input value={form.service_area} onChange={e => set('service_area', e.target.value)} placeholder="Service area (e.g. South Africa)" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Founding Year</Label>
          <Input type="number" value={form.founding_year} onChange={e => set('founding_year', parseInt(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label>Price Range</Label>
          <Input value={form.price_range} onChange={e => set('price_range', e.target.value)} placeholder="e.g. $$, R500-R5000" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Contact Type</Label>
          <Select value={form.contact_type} onValueChange={v => set('contact_type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="customer service">Customer Service</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="technical support">Technical Support</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Social Profiles (sameAs)</Label>
        <div className="flex gap-2">
          <Input value={socialInput} onChange={e => setSocialInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addSocial()} placeholder="https://facebook.com/..." />
          <Button type="button" variant="outline" onClick={addSocial}><Plus className="w-4 h-4" /></Button>
        </div>
        <div className="space-y-1 mt-2">
          {form.social_profiles.map((url, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="flex-1 truncate text-blue-600">{url}</span>
              <Button type="button" variant="ghost" size="icon" className="text-red-500 h-6 w-6"
                onClick={() => set('social_profiles', form.social_profiles.filter((_, idx) => idx !== i))}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1 border-t pt-4">
        <Label>Custom Robots.txt Content</Label>
        <Textarea rows={6} value={form.robots_txt_custom} onChange={e => set('robots_txt_custom', e.target.value)}
          className="font-mono text-sm"
          placeholder={'User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: https://yourdomain.com/sitemap.xml'} />
        <p className="text-xs text-gray-400">This will be shown as download/copy in the Sitemap section.</p>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving} className="bg-black text-white hover:bg-gray-800">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Organisation Schema'}
        </Button>
      </div>
    </div>
  );
}