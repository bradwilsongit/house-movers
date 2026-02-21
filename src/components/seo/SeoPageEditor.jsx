import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Eye, Search, Share2, Code, Globe } from 'lucide-react';
import SchemaFieldsEditor from './SchemaFieldsEditor';

const CHAR_LIMITS = { title: 60, description: 160 };

function CharCounter({ value = '', limit }) {
  const len = value.length;
  const color = len > limit ? 'text-red-500' : len > limit * 0.85 ? 'text-yellow-500' : 'text-gray-400';
  return <span className={`text-xs ${color}`}>{len}/{limit}</span>;
}

function SerpPreview({ title, description, url }) {
  return (
    <div className="border rounded-xl p-4 bg-white space-y-1">
      <p className="text-xs text-gray-500 mb-2">SERP Preview</p>
      <p className="text-sm text-gray-400 truncate">{url || 'https://yourdomain.com/page'}</p>
      <p className="text-blue-600 text-lg font-medium truncate hover:underline cursor-pointer">
        {title || 'Page Title'}
      </p>
      <p className="text-sm text-gray-600 line-clamp-2">
        {description || 'Meta description will appear here...'}
      </p>
    </div>
  );
}

export default function SeoPageEditor({ seo, onSave }) {
  const [form, setForm] = useState({
    seo_title: '', meta_description: '', canonical_url: '', robots_directive: 'index, follow',
    h1_override: '', focus_keyword: '', secondary_keywords: [],
    og_title: '', og_description: '', og_image_url: '',
    twitter_title: '', twitter_description: '', twitter_image_url: '', twitter_card_type: 'summary_large_image',
    include_in_sitemap: true, sitemap_priority: 0.5, sitemap_changefreq: 'weekly',
    schema_type: 'WebPage', schema_fields: {}, custom_json_ld: '',
    is_indexable: true,
    ...seo,
    secondary_keywords: seo?.secondary_keywords || [],
  });
  const [saving, setSaving] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (seo?.id) {
        await base44.entities.SeoSettings.update(seo.id, form);
      } else {
        await base44.entities.SeoSettings.create({ ...form, page_name: seo.page_name, page_label: seo.page_label });
      }
      onSave?.();
    } finally {
      setSaving(false);
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim()) {
      set('secondary_keywords', [...form.secondary_keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (i) => set('secondary_keywords', form.secondary_keywords.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      <Tabs defaultValue="core">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="core"><Search className="w-3 h-3 mr-1" />Core SEO</TabsTrigger>
          <TabsTrigger value="social"><Share2 className="w-3 h-3 mr-1" />Social</TabsTrigger>
          <TabsTrigger value="schema"><Code className="w-3 h-3 mr-1" />Schema</TabsTrigger>
          <TabsTrigger value="sitemap"><Globe className="w-3 h-3 mr-1" />Sitemap</TabsTrigger>
        </TabsList>

        {/* ── Core SEO ─────────────────────────────────── */}
        <TabsContent value="core" className="space-y-4 pt-4">
          <SerpPreview
            title={form.seo_title}
            description={form.meta_description}
            url={form.canonical_url}
          />

          <div className="space-y-1">
            <div className="flex justify-between"><Label>SEO Title</Label><CharCounter value={form.seo_title} limit={CHAR_LIMITS.title} /></div>
            <Input value={form.seo_title} onChange={e => set('seo_title', e.target.value)} placeholder="Page title for search engines" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between"><Label>Meta Description</Label><CharCounter value={form.meta_description} limit={CHAR_LIMITS.description} /></div>
            <Textarea rows={3} value={form.meta_description} onChange={e => set('meta_description', e.target.value)} placeholder="Describe this page for search engines..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Canonical URL</Label>
              <Input value={form.canonical_url} onChange={e => set('canonical_url', e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <Label>H1 Override (optional)</Label>
              <Input value={form.h1_override} onChange={e => set('h1_override', e.target.value)} placeholder="Override page heading" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Robots Directive</Label>
            <Select value={form.robots_directive} onValueChange={v => set('robots_directive', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="index, follow">Index + Follow (default)</SelectItem>
                <SelectItem value="noindex, follow">Noindex + Follow</SelectItem>
                <SelectItem value="noindex, nofollow">Noindex + Nofollow</SelectItem>
                <SelectItem value="index, nofollow">Index + Nofollow</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Focus Keyword</Label>
            <Input value={form.focus_keyword} onChange={e => set('focus_keyword', e.target.value)} placeholder="Primary keyword" />
          </div>

          <div className="space-y-1">
            <Label>Secondary Keywords</Label>
            <div className="flex gap-2">
              <Input value={keywordInput} onChange={e => setKeywordInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addKeyword()} placeholder="Add keyword + Enter" />
              <Button type="button" variant="outline" onClick={addKeyword}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {form.secondary_keywords.map((kw, i) => (
                <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeKeyword(i)}>
                  {kw} ×
                </Badge>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Social ───────────────────────────────────── */}
        <TabsContent value="social" className="space-y-4 pt-4">
          <p className="text-sm text-gray-500">Leave blank to inherit from core SEO fields.</p>

          <div className="space-y-3">
            <p className="font-medium text-sm">Open Graph</p>
            <div className="space-y-1">
              <Label>OG Title</Label>
              <Input value={form.og_title} onChange={e => set('og_title', e.target.value)} placeholder={form.seo_title || 'Inherits SEO title'} />
            </div>
            <div className="space-y-1">
              <Label>OG Description</Label>
              <Textarea rows={2} value={form.og_description} onChange={e => set('og_description', e.target.value)} placeholder={form.meta_description || 'Inherits meta description'} />
            </div>
            <div className="space-y-1">
              <Label>OG Image URL</Label>
              <Input value={form.og_image_url} onChange={e => set('og_image_url', e.target.value)} placeholder="https://..." />
              {form.og_image_url && <img src={form.og_image_url} alt="OG Preview" className="mt-2 rounded-lg max-h-32 object-cover" />}
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <p className="font-medium text-sm">Twitter Card</p>
            <div className="space-y-1">
              <Label>Card Type</Label>
              <Select value={form.twitter_card_type} onValueChange={v => set('twitter_card_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                  <SelectItem value="summary">Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Twitter Title</Label>
              <Input value={form.twitter_title} onChange={e => set('twitter_title', e.target.value)} placeholder={form.og_title || form.seo_title || 'Inherits OG title'} />
            </div>
            <div className="space-y-1">
              <Label>Twitter Description</Label>
              <Textarea rows={2} value={form.twitter_description} onChange={e => set('twitter_description', e.target.value)} placeholder={form.og_description || form.meta_description || 'Inherits OG description'} />
            </div>
            <div className="space-y-1">
              <Label>Twitter Image URL</Label>
              <Input value={form.twitter_image_url} onChange={e => set('twitter_image_url', e.target.value)} placeholder={form.og_image_url || 'Inherits OG image'} />
            </div>
          </div>
        </TabsContent>

        {/* ── Schema ───────────────────────────────────── */}
        <TabsContent value="schema" className="space-y-4 pt-4">
          <div className="space-y-1">
            <Label>Schema Type</Label>
            <Select value={form.schema_type} onValueChange={v => set('schema_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="WebPage">WebPage</SelectItem>
                <SelectItem value="FAQPage">FAQPage</SelectItem>
                <SelectItem value="Article">Article / BlogPosting</SelectItem>
                <SelectItem value="LocalBusiness">LocalBusiness</SelectItem>
                <SelectItem value="Service">Service</SelectItem>
                <SelectItem value="Product">Product</SelectItem>
                <SelectItem value="BreadcrumbList">BreadcrumbList</SelectItem>
                <SelectItem value="Review">Review / AggregateRating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.schema_type && form.schema_type !== 'none' && (
            <SchemaFieldsEditor
              schemaType={form.schema_type}
              fields={form.schema_fields || {}}
              onChange={v => set('schema_fields', v)}
            />
          )}

          <div className="space-y-1 border-t pt-4">
            <Label>Custom JSON-LD (Advanced)</Label>
            <Textarea
              rows={8}
              value={form.custom_json_ld}
              onChange={e => set('custom_json_ld', e.target.value)}
              placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  ...\n}'}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-400">If set, this overrides the schema type selector above.</p>
          </div>
        </TabsContent>

        {/* ── Sitemap ──────────────────────────────────── */}
        <TabsContent value="sitemap" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Include in Sitemap</p>
              <p className="text-xs text-gray-400">Controls whether this page appears in sitemap.xml</p>
            </div>
            <Switch checked={form.include_in_sitemap} onCheckedChange={v => set('include_in_sitemap', v)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Priority (0.0 – 1.0)</Label>
              <Input type="number" min="0" max="1" step="0.1" value={form.sitemap_priority} onChange={e => set('sitemap_priority', parseFloat(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>Change Frequency</Label>
              <Select value={form.sitemap_changefreq} onValueChange={v => set('sitemap_changefreq', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['always','hourly','daily','weekly','monthly','yearly','never'].map(f => (
                    <SelectItem key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={saving} className="bg-black text-white hover:bg-gray-800">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save SEO Settings'}
        </Button>
      </div>
    </div>
  );
}