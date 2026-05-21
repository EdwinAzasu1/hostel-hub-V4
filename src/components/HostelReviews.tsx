import { useState, useEffect } from 'react';
import { Star, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Review {
  id: string;
  student_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface HostelReviewsProps {
  hostelId: string;
  readOnly?: boolean;
}

export const HostelReviews = ({ hostelId, readOnly = false }: HostelReviewsProps) => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [hostelId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, student_name, rating, comment, created_at')
        .eq('hostel_id', hostelId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReviews(data || []);
    } catch {
      console.error('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || rating === 0) {
      toast({ title: 'Missing fields', description: 'Please fill in your name, email, and select a rating.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        hostel_id: hostelId,
        student_name: name.trim(),
        student_email: email.trim(),
        rating,
        comment: comment.trim() || null,
      });
      if (error) throw error;

      toast({ title: 'Review submitted!', description: 'Thank you for your feedback.' });
      setName('');
      setEmail('');
      setRating(0);
      setComment('');
      fetchReviews();
    } catch {
      toast({ title: 'Error', description: 'Failed to submit review.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, interactive = false }: { value: number; interactive?: boolean }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 transition-colors ${
            star <= (interactive ? (hoverRating || rating) : value)
              ? 'fill-accent text-accent'
              : 'text-muted-foreground/30'
          } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          onClick={interactive ? () => setRating(star) : undefined}
          onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Reviews & Ratings</h3>
        {avgRating && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="font-bold text-foreground">{avgRating}</span>
            <span className="text-sm text-muted-foreground">({reviews.length})</span>
          </div>
        )}
      </div>

      {/* Review Form (for students) */}
      {!readOnly && (
        <>
          <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
            <p className="text-sm font-medium text-foreground">Leave a Review</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="review-name" className="text-xs">Your Name *</Label>
                <Input id="review-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="review-email" className="text-xs">Email *</Label>
                <Input id="review-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@email.com" className="h-9" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Rating *</Label>
              <StarRating value={rating} interactive />
            </div>
            <div className="space-y-1">
              <Label htmlFor="review-comment" className="text-xs">Comment (optional)</Label>
              <Textarea id="review-comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." rows={2} className="text-sm" />
            </div>
            <Button type="submit" size="sm" disabled={submitting} className="gap-2">
              <Send className="h-3.5 w-3.5" />
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </form>
          <Separator />
        </>
      )}

      {/* Reviews List */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-4">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No reviews yet.</p>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {reviews.map((review) => (
            <div key={review.id} className="p-3 rounded-lg border border-border bg-card/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{review.student_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${star <= review.rating ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`}
                    />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground pl-9">{review.comment}</p>
              )}
              <p className="text-xs text-muted-foreground/60 pl-9">
                {new Date(review.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Small component to show avg rating inline on cards
export const HostelRatingBadge = ({ hostelId }: { hostelId: string }) => {
  const [avg, setAvg] = useState<number | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('reviews')
        .select('rating')
        .eq('hostel_id', hostelId);
      if (data && data.length > 0) {
        setAvg(data.reduce((s, r) => s + r.rating, 0) / data.length);
        setCount(data.length);
      }
    };
    fetch();
  }, [hostelId]);

  if (avg === null) return null;

  return (
    <div className="flex items-center gap-1 text-sm">
      <Star className="h-3.5 w-3.5 fill-accent text-accent" />
      <span className="font-medium text-foreground">{avg.toFixed(1)}</span>
      <span className="text-muted-foreground text-xs">({count})</span>
    </div>
  );
};
