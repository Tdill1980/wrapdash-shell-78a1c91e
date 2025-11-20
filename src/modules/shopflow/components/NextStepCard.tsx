import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { formatWooStatus } from "@/lib/woo-status-display";

interface NextStepCardProps {
  currentStatus: string; // Raw WooCommerce status
}

export const NextStepCard = ({ currentStatus }: NextStepCardProps) => {
  // Map WooCommerce status to next recommended action
  const nextActions: Record<string, string> = {
    'pending': 'Process payment and move to "processing" status',
    'processing': 'Send Dropbox link to customer for file upload',
    'on-hold': 'Resolve hold reason and update status',
    'dropbox-link-sent': 'Wait for customer files or follow up via email',
    'waiting-on-email-response': 'Follow up with customer via email',
    'in-design': 'Complete design and upload proof to ApproveFlow',
    'file-error': 'Contact customer to fix file issues',
    'missing-file': 'Request missing files from customer',
    'design-complete': 'Send proof to customer for approval',
    'waiting-to-place-order': 'Confirm order details with customer',
    'work-order-printed': 'Begin production process',
    'ready-for-print': 'Move to print production',
    'pre-press': 'Complete pre-press checks and start printing',
    'print-production': 'Monitor print progress and quality',
    'lamination': 'Complete lamination process',
    'finishing': 'Complete finishing and quality check',
    'ready-for-pickup': 'Notify customer for pickup or arrange shipping',
    'shipping-cost': 'Calculate and confirm shipping costs',
    'shipped': 'Update tracking information',
    'completed': 'Order is complete',
  };

  const nextStep = nextActions[currentStatus] || "Review order and update status as needed";

  return (
    <Card className="bg-[#1a1a24] border-white/5 p-6">
      <div className="flex items-start gap-3 mb-4">
        <ArrowRight className="h-5 w-5 text-[#15D1FF] mt-0.5 flex-shrink-0" />
        <h3 className="text-lg font-semibold text-white">What Happens Next</h3>
      </div>
      <p className="text-white/80 leading-relaxed">
        {nextStep}
      </p>
      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-sm text-white/40">
          Current: <span className="text-white/60 font-medium">{formatWooStatus(currentStatus)}</span>
        </p>
      </div>
    </Card>
  );
};
