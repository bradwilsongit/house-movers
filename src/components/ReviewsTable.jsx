import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Star, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function ReviewsTable({ supplierId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [supplierId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const ratings = await base44.entities.Rating.filter(
        { supplier_id: supplierId },
        '-created_date'
      );
      setReviews(ratings);
    } catch (e) {
      console.error('Error loading reviews:', e);
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ rating }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={cn(
            'w-4 h-4',
            star <= rating
              ? 'fill-amber-400 text-amber-400'
              : 'text-gray-300'
          )}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <Card className="mt-6">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Customer Reviews</CardTitle>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No reviews yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="pb-3 font-medium">Overall</th>
                  <th className="pb-3 font-medium">Punctuality</th>
                  <th className="pb-3 font-medium">Care</th>
                  <th className="pb-3 font-medium">Communication</th>
                  <th className="pb-3 font-medium">Review</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(review => (
                  <tr key={review.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 text-sm font-medium text-gray-900">
                      {review.customer_name}
                    </td>
                    <td className="py-3">
                      <StarRating rating={review.overall_rating} />
                    </td>
                    <td className="py-3">
                      <StarRating rating={review.punctuality_rating} />
                    </td>
                    <td className="py-3">
                      <StarRating rating={review.care_rating} />
                    </td>
                    <td className="py-3">
                      <StarRating rating={review.communication_rating} />
                    </td>
                    <td className="py-3">
                      <p className="text-sm text-gray-600 max-w-xs truncate">
                        {review.review_text || '—'}
                      </p>
                    </td>
                    <td className="py-3 text-sm text-gray-500">
                      {new Date(review.created_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}