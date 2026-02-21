import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

export default function SchemaFieldsEditor({ schemaType, fields, onChange }) {
  const set = (k, v) => onChange({ ...fields, [k]: v });

  switch (schemaType) {
    case 'FAQPage':
      return (
        <div className="space-y-3">
          <p className="text-sm font-medium">FAQ Items</p>
          {(fields.faqs || []).map((faq, i) => (
            <div key={i} className="border rounded-lg p-3 space-y-2">
              <Input value={faq.question} onChange={e => {
                const faqs = [...(fields.faqs || [])];
                faqs[i] = { ...faqs[i], question: e.target.value };
                set('faqs', faqs);
              }} placeholder="Question" />
              <Textarea rows={2} value={faq.answer} onChange={e => {
                const faqs = [...(fields.faqs || [])];
                faqs[i] = { ...faqs[i], answer: e.target.value };
                set('faqs', faqs);
              }} placeholder="Answer" />
              <Button type="button" variant="ghost" size="sm" className="text-red-500"
                onClick={() => set('faqs', (fields.faqs || []).filter((_, idx) => idx !== i))}>
                <Trash2 className="w-3 h-3 mr-1" /> Remove
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm"
            onClick={() => set('faqs', [...(fields.faqs || []), { question: '', answer: '' }])}>
            <Plus className="w-3 h-3 mr-1" /> Add FAQ
          </Button>
        </div>
      );

    case 'Article':
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Author Name</Label>
            <Input value={fields.author || ''} onChange={e => set('author', e.target.value)} placeholder="Author full name" />
          </div>
          <div className="space-y-1">
            <Label>Date Published</Label>
            <Input type="date" value={fields.date_published || ''} onChange={e => set('date_published', e.target.value)} />
          </div>
        </div>
      );

    case 'Service':
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Service Type</Label>
            <Input value={fields.service_type || ''} onChange={e => set('service_type', e.target.value)} placeholder="e.g. Moving Service" />
          </div>
          <div className="space-y-1">
            <Label>Provider Name</Label>
            <Input value={fields.provider_name || ''} onChange={e => set('provider_name', e.target.value)} placeholder="Company name" />
          </div>
          <div className="space-y-1">
            <Label>Area Served</Label>
            <Input value={fields.area_served || ''} onChange={e => set('area_served', e.target.value)} placeholder="e.g. South Africa" />
          </div>
        </div>
      );

    case 'BreadcrumbList':
      return (
        <div className="space-y-3">
          <p className="text-sm font-medium">Breadcrumb Items</p>
          {(fields.breadcrumbs || []).map((b, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input value={b.name} onChange={e => {
                const bc = [...(fields.breadcrumbs || [])];
                bc[i] = { ...bc[i], name: e.target.value };
                set('breadcrumbs', bc);
              }} placeholder="Label" />
              <Input value={b.url} onChange={e => {
                const bc = [...(fields.breadcrumbs || [])];
                bc[i] = { ...bc[i], url: e.target.value };
                set('breadcrumbs', bc);
              }} placeholder="https://..." />
              <Button type="button" variant="ghost" size="icon" className="text-red-500"
                onClick={() => set('breadcrumbs', (fields.breadcrumbs || []).filter((_, idx) => idx !== i))}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm"
            onClick={() => set('breadcrumbs', [...(fields.breadcrumbs || []), { name: '', url: '' }])}>
            <Plus className="w-3 h-3 mr-1" /> Add Item
          </Button>
        </div>
      );

    case 'Product':
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Product Name</Label>
            <Input value={fields.product_name || ''} onChange={e => set('product_name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Price</Label>
              <Input type="number" value={fields.price || ''} onChange={e => set('price', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Currency</Label>
              <Input value={fields.currency || 'ZAR'} onChange={e => set('currency', e.target.value)} />
            </div>
          </div>
        </div>
      );

    default:
      return (
        <p className="text-sm text-gray-400 italic">No additional fields required for {schemaType}.</p>
      );
  }
}