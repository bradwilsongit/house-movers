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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';

export default function RatingDialog({ open, onOpenChange, booking, supplier, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    overall_rating: 0,
    punctuality_rating: 0,
    care_rating: 0,
    communication_rating: 0,
    review_text: '',
  });

  const handleSubmit = async () => {
    if (form.overall_rating === 0) return;

    setLoading(true);
    try {
      const user = await base44.auth.me();
      
      // Create rating
       const rating = await base44.entities.Rating.create({
         booking_id: booking.id,
         supplier_id: booking.supplier_id,
         customer_id: user.id,
         customer_name: user.full_name || user.email,
         overall_rating: form.overall_rating,
         punctuality_rating: form.punctuality_rating || form.overall_rating,
         care_rating: form.care_rating || form.overall_rating,
         communication_rating: form.communication_rating || form.overall_rating,
         review_text: form.review_text,
       });

      // Get supplier email
      const suppliers = await base44.entities.Supplier.filter({ id: booking.supplier_id });
      const supplier = suppliers.length > 0 ? suppliers[0] : null;

      // Notify supplier
      if (supplier?.contact_email) {
        await base44.entities.Notification.create({
          user_email: supplier.contact_email,
          title: 'New Rating Received',
          message: `You received a ${form.overall_rating}-star rating on booking ${booking.booking_reference}`,
          type: 'booking',
          link_page: 'SupplierJobDetails',
          link_id: booking.id,
        });
      }

      // Notify admins
      const adminUsers = await base44.entities.User.list();
      const admins = adminUsers.filter(u => u.role === 'admin');
      for (const admin of admins) {
        await base44.entities.Notification.create({
          user_email: admin.email,
          title: 'New Rating Submitted',
          message: `A new ${form.overall_rating}-star rating was submitted for ${supplier?.company_name || 'a supplier'} on booking ${booking.booking_reference}`,
          type: 'booking',
          link_page: 'AdminBookings',
        });
      }

      if (onSuccess) onSuccess();
    } catch (e) {
      console.error('Error submitting rating:', e);
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ value, onChange, label }) => (
    <div>
      <Label className="text-sm text-gray-500 mb-2 block">{label}</Label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(star)}
            className="transition-all"
          >
            <Star
              className={`w-6 h-6 ${
                star <= value
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your Move</DialogTitle>
          <DialogDescription>
            Help others by sharing your experience with {supplier?.company_name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <StarRating
            label="Overall Rating"
            value={form.overall_rating}
            onChange={(v) => setForm({ ...form, overall_rating: v })}
          />
          <StarRating
            label="Punctuality"
            value={form.punctuality_rating}
            onChange={(v) => setForm({ ...form, punctuality_rating: v })}
          />
          <StarRating
            label="Care of Items"
            value={form.care_rating}
            onChange={(v) => setForm({ ...form, care_rating: v })}
          />
          <StarRating
            label="Communication"
            value={form.communication_rating}
            onChange={(v) => setForm({ ...form, communication_rating: v })}
          />
          <div>
            <Label htmlFor="review">Review (optional)</Label>
            <Textarea
              id="review"
              value={form.review_text}
              onChange={(e) => setForm({ ...form, review_text: e.target.value })}
              placeholder="Share your experience..."
              rows={3}
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
            disabled={loading || form.overall_rating === 0}
            className="bg-black text-white hover:bg-gray-800"
          >
            {loading ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}