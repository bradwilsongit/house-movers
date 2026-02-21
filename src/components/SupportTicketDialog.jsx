import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { emailCustomerSupportTicketCreated } from '@/components/emailUtils';

export default function SupportTicketDialog({ open, onOpenChange, bookingId }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    description: '',
  });

  const handleSubmit = async () => {
    if (!form.subject || !form.description) return;

    setLoading(true);
    try {
      const user = await base44.auth.me();
      const ticket = await base44.entities.SupportTicket.create({
        booking_id: bookingId,
        customer_id: user.id,
        ticket_type: 'general',
        subject: form.subject,
        description: form.description,
      });

      // Notify all admins via backend function (bypasses RLS)
      await base44.functions.invoke('notifyAdmins', {
        title: 'New Support Ticket',
        message: `A customer has raised a new support ticket: "${form.subject}"`,
        type: 'support',
        link_page: 'AdminSupport',
        link_id: ticket.id,
        emailSubject: `🎫 New Support Ticket – "${form.subject}"`,
        emailBody: `Hi {adminName},\n\nA new support ticket has been submitted by <strong>${user.full_name || 'a customer'}</strong>.\n\n<strong>Subject:</strong> ${form.subject}<br/><strong>Description:</strong> ${form.description}\n\n<a href="https://app.base44.app/AdminSupport">View in dashboard</a>`,
      });

      // Send email to customer
      emailCustomerSupportTicketCreated({ customerEmail: user.email, customerName: user.full_name, subject: form.subject });

      setForm({ subject: '', description: '' });
      onOpenChange(false);
    } catch (e) {
      console.error('Error creating support ticket:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact Support</DialogTitle>
          <DialogDescription>
            Describe your issue and our team will get back to you shortly.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Brief description of your issue"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Provide more details about your issue..."
              rows={4}
              className="mt-1.5"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !form.subject || !form.description}
            className="bg-black text-white hover:bg-gray-800"
          >
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}