import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ArrowRight, Save } from 'lucide-react';

const EMPTY = { from_path: '', to_path: '', redirect_type: '301', is_active: true, notes: '' };

export default function SeoRedirectsManager() {
  const [redirects, setRedirects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.SeoRedirect.list('-created_date').then(setRedirects).finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!form.from_path || !form.to_path) return;
    setSaving(true);
    try {
      const created = await base44.entities.SeoRedirect.create(form);
      setRedirects(r => [created, ...r]);
      setForm(EMPTY);
      setAdding(false);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (redirect) => {
    await base44.entities.SeoRedirect.update(redirect.id, { is_active: !redirect.is_active });
    setRedirects(rs => rs.map(r => r.id === redirect.id ? { ...r, is_active: !r.is_active } : r));
  };

  const handleDelete = async (id) => {
    await base44.entities.SeoRedirect.delete(id);
    setRedirects(rs => rs.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{redirects.length} redirect{redirects.length !== 1 ? 's' : ''} configured</p>
        <Button onClick={() => setAdding(!adding)} variant={adding ? 'outline' : 'default'} className={adding ? '' : 'bg-black text-white hover:bg-gray-800'}>
          <Plus className="w-4 h-4 mr-2" />
          Add Redirect
        </Button>
      </div>

      {adding && (
        <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>From Path</Label>
              <Input value={form.from_path} onChange={e => setForm(f => ({ ...f, from_path: e.target.value }))} placeholder="/old-page" />
            </div>
            <div className="space-y-1">
              <Label>To Path / URL</Label>
              <Input value={form.to_path} onChange={e => setForm(f => ({ ...f, to_path: e.target.value }))} placeholder="/new-page or https://..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Redirect Type</Label>
              <Select value={form.redirect_type} onValueChange={v => setForm(f => ({ ...f, redirect_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="301">301 – Permanent</SelectItem>
                  <SelectItem value="302">302 – Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Notes (optional)</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Reason for redirect" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setAdding(false); setForm(EMPTY); }}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving} className="bg-black text-white hover:bg-gray-800">
              <Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save Redirect'}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : redirects.length === 0 ? (
        <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-xl">
          No redirects configured yet
        </div>
      ) : (
        <div className="space-y-2">
          {redirects.map(r => (
            <div key={r.id} className={`flex items-center gap-3 p-3 border rounded-lg ${r.is_active ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
              <Badge variant="outline" className="shrink-0 text-xs">{r.redirect_type}</Badge>
              <div className="flex items-center gap-2 flex-1 min-w-0 text-sm font-mono">
                <span className="text-gray-600 truncate">{r.from_path}</span>
                <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                <span className="text-blue-600 truncate">{r.to_path}</span>
              </div>
              {r.notes && <span className="text-xs text-gray-400 hidden lg:block">{r.notes}</span>}
              <Switch checked={r.is_active} onCheckedChange={() => handleToggle(r)} />
              <Button variant="ghost" size="icon" className="text-red-500 shrink-0" onClick={() => handleDelete(r.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}