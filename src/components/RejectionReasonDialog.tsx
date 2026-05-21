import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { XCircle } from 'lucide-react';

interface RejectionReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hostelName: string;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

export const RejectionReasonDialog = ({
  open,
  onOpenChange,
  hostelName,
  onConfirm,
  isLoading = false,
}: RejectionReasonDialogProps) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason.trim());
    setReason('');
  };

  const handleCancel = () => {
    setReason('');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Reject Hostel?
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to reject <strong>"{hostelName}"</strong>. The owner will see this rejection and your reason on their dashboard.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-1">
          <Label htmlFor="rejection-reason" className="text-sm font-medium">
            Reason for rejection <span className="text-muted-foreground font-normal">(optional but recommended)</span>
          </Label>
          <Textarea
            id="rejection-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Images are too blurry, Address is incomplete, Missing contact details..."
            rows={3}
            className="resize-none rounded-xl text-sm"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} className="rounded-xl">
            Cancel
          </AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isLoading ? 'Rejecting…' : 'Reject Hostel'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
