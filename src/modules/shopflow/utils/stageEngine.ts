// WrapCommand ShopFlow Stage Engine
// Maps WooCommerce statuses to internal stages and provides stage logic

export type InternalStage =
  | 'order_received'
  | 'files_received'
  | 'file_error'
  | 'in_design'
  | 'awaiting_approval'
  | 'ready_to_print'
  | 'printing'
  | 'laminating'
  | 'cutting'
  | 'qc'
  | 'shipped'
  | 'completed';

// Map WooCommerce status to internal stage
export function getStageFromWoo(wooStatus: string): InternalStage {
  const statusMap: Record<string, InternalStage> = {
    'pending': 'order_received',
    'processing': 'order_received',
    'on-hold': 'files_received',
    'file-error': 'file_error',
    'files-received': 'files_received',
    'in-design': 'in_design',
    'awaiting-approval': 'awaiting_approval',
    'ready-to-print': 'ready_to_print',
    'printing': 'printing',
    'laminating': 'laminating',
    'cutting': 'cutting',
    'qc': 'qc',
    'shipped': 'shipped',
    'completed': 'completed',
  };

  return statusMap[wooStatus] || 'order_received';
}

// Get the next logical stage
export function getNextStage(currentStage: InternalStage): InternalStage | null {
  const stageFlow: Record<InternalStage, InternalStage | null> = {
    'order_received': 'files_received',
    'files_received': 'in_design',
    'file_error': 'files_received',
    'in_design': 'awaiting_approval',
    'awaiting_approval': 'ready_to_print',
    'ready_to_print': 'printing',
    'printing': 'laminating',
    'laminating': 'cutting',
    'cutting': 'qc',
    'qc': 'shipped',
    'shipped': 'completed',
    'completed': null,
  };

  return stageFlow[currentStage];
}

// Get human-readable stage description
export function getStageDescription(stage: InternalStage): string {
  const descriptions: Record<InternalStage, string> = {
    'order_received': 'Order has been received and is awaiting file upload from customer.',
    'files_received': 'Customer files have been received and are being reviewed for print readiness.',
    'file_error': 'There is an issue with the uploaded files. Customer action required.',
    'in_design': 'Design team is working on preparing the artwork for production.',
    'awaiting_approval': 'Proof has been sent to customer for approval before printing.',
    'ready_to_print': 'Artwork is approved and ready to enter production.',
    'printing': 'Currently being printed on vinyl material.',
    'laminating': 'Print is being laminated for durability and protection.',
    'cutting': 'Laminated vinyl is being precision cut to specifications.',
    'qc': 'Final quality control inspection before packaging.',
    'shipped': 'Order has been shipped to customer with tracking information.',
    'completed': 'Order is complete and delivered.',
  };

  return descriptions[stage] || 'Status unknown';
}

// Detect missing items based on current stage
export function detectMissing(order: any): string[] {
  const missing: string[] = [];
  const stage = getStageFromWoo(order.status);

  // Check for missing files
  if (stage === 'order_received' || stage === 'file_error') {
    if (!order.files || order.files.length === 0) {
      missing.push('Customer artwork files not uploaded');
    }
  }

  // Check for missing proof approval
  if (stage === 'awaiting_approval') {
    // Could check for proof approval metadata here
    const hasApproval = order.meta_data?.some((m: any) => 
      m.key === '_proof_approved' && m.value === 'yes'
    );
    if (!hasApproval) {
      missing.push('Waiting for customer proof approval');
    }
  }

  // Check for missing vehicle info
  if (!order.vehicle_info || Object.keys(order.vehicle_info).length === 0) {
    missing.push('Vehicle information not provided');
  }

  return missing;
}

// Build timeline from order events/metadata
export function buildTimeline(order: any): Array<{
  stage: string;
  timestamp: string;
  description: string;
  active: boolean;
}> {
  const timeline: Array<{
    stage: string;
    timestamp: string;
    description: string;
    active: boolean;
  }> = [];

  const currentStage = getStageFromWoo(order.status);

  // Always add order received
  timeline.push({
    stage: 'Order Received',
    timestamp: order.created_at || new Date().toISOString(),
    description: 'Order placed by customer',
    active: currentStage === 'order_received',
  });

  // Check for files received
  if (order.files && order.files.length > 0) {
    timeline.push({
      stage: 'Files Received',
      timestamp: order.updated_at || new Date().toISOString(),
      description: `${order.files.length} file(s) uploaded`,
      active: currentStage === 'files_received',
    });
  }

  // Add current stage if not already in timeline
  const stageLabels: Record<InternalStage, string> = {
    'order_received': 'Order Received',
    'files_received': 'Files Received',
    'file_error': 'File Issue',
    'in_design': 'In Design',
    'awaiting_approval': 'Awaiting Approval',
    'ready_to_print': 'Ready to Print',
    'printing': 'Printing',
    'laminating': 'Laminating',
    'cutting': 'Cutting',
    'qc': 'Quality Control',
    'shipped': 'Shipped',
    'completed': 'Completed',
  };

  const currentStageLabel = stageLabels[currentStage];
  if (!timeline.some(t => t.stage === currentStageLabel)) {
    timeline.push({
      stage: currentStageLabel,
      timestamp: order.updated_at || new Date().toISOString(),
      description: getStageDescription(currentStage),
      active: true,
    });
  }

  return timeline;
}
