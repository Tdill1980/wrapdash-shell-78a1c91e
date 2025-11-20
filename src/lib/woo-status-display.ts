import { Package, Upload, AlertCircle, Palette, CheckCircle, Clock, Printer, Truck, CreditCard, XCircle, Mail } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Convert WooCommerce hyphenated status to readable format
 * @example "waiting-on-email-response" → "Waiting on Email Response"
 */
export function formatWooStatus(status: string): string {
  return status
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get color for WooCommerce status badge
 */
export function getWooStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    'pending': 'from-orange-500 to-amber-500',
    'processing': 'from-blue-500 to-cyan-500',
    'on-hold': 'from-yellow-500 to-amber-500',
    'dropbox-link-sent': 'from-blue-400 to-indigo-500',
    'waiting-to-place-order': 'from-amber-500 to-orange-500',
    'waiting-on-email-response': 'from-amber-400 to-yellow-500',
    'add-on': 'from-purple-500 to-pink-500',
    'in-design': 'from-purple-600 to-indigo-600',
    'file-error': 'from-red-500 to-orange-500',
    'missing-file': 'from-red-600 to-rose-500',
    'design-complete': 'from-green-500 to-emerald-500',
    'work-order-printed': 'from-blue-500 to-cyan-400',
    'ready-for-print': 'from-cyan-500 to-blue-500',
    'pre-press': 'from-indigo-500 to-blue-500',
    'print-production': 'from-blue-600 to-indigo-600',
    'lamination': 'from-blue-500 to-purple-500',
    'finishing': 'from-purple-500 to-indigo-500',
    'ready-for-pickup': 'from-emerald-500 to-green-500',
    'shipping-cost': 'from-green-400 to-emerald-400',
    'shipped': 'from-green-600 to-emerald-600',
    'completed': 'from-gray-500 to-slate-500',
    'refunded': 'from-gray-400 to-slate-400',
    'failed': 'from-red-700 to-rose-700',
    'credit': 'from-gray-500 to-zinc-500'
  };
  return statusColors[status] || 'from-gray-500 to-slate-500';
}

/**
 * Get icon for WooCommerce status
 */
export function getWooStatusIcon(status: string): LucideIcon {
  const statusIcons: Record<string, LucideIcon> = {
    'pending': Clock,
    'processing': Package,
    'on-hold': Clock,
    'dropbox-link-sent': Mail,
    'waiting-to-place-order': Clock,
    'waiting-on-email-response': Mail,
    'add-on': Package,
    'in-design': Palette,
    'file-error': AlertCircle,
    'missing-file': AlertCircle,
    'design-complete': CheckCircle,
    'work-order-printed': Printer,
    'ready-for-print': CheckCircle,
    'pre-press': Printer,
    'print-production': Printer,
    'lamination': Printer,
    'finishing': Printer,
    'ready-for-pickup': Truck,
    'shipping-cost': Truck,
    'shipped': Truck,
    'completed': CheckCircle,
    'refunded': CreditCard,
    'failed': XCircle,
    'credit': CreditCard
  };
  return statusIcons[status] || Package;
}

/**
 * WooCommerce status categories for progress tracking
 */
export const WOO_STATUS_FLOW = [
  // Order Flow
  { status: 'pending', label: 'Pending', category: 'order' },
  { status: 'processing', label: 'Processing', category: 'order' },
  { status: 'on-hold', label: 'On Hold', category: 'order' },
  { status: 'dropbox-link-sent', label: 'Dropbox Link Sent', category: 'order' },
  
  // Design Flow
  { status: 'waiting-on-email-response', label: 'Waiting on Email', category: 'design' },
  { status: 'in-design', label: 'In Design', category: 'design' },
  { status: 'file-error', label: 'File Error', category: 'design' },
  { status: 'missing-file', label: 'Missing File', category: 'design' },
  { status: 'design-complete', label: 'Design Complete', category: 'design' },
  
  // Approval Flow
  { status: 'waiting-to-place-order', label: 'Waiting to Place Order', category: 'approval' },
  { status: 'work-order-printed', label: 'Work Order Printed', category: 'approval' },
  
  // Production Flow
  { status: 'ready-for-print', label: 'Ready for Print', category: 'production' },
  { status: 'pre-press', label: 'Pre-Press', category: 'production' },
  { status: 'print-production', label: 'Print Production', category: 'production' },
  { status: 'lamination', label: 'Lamination', category: 'production' },
  { status: 'finishing', label: 'Finishing', category: 'production' },
  
  // Shipping Flow
  { status: 'ready-for-pickup', label: 'Ready for Pickup', category: 'shipping' },
  { status: 'shipping-cost', label: 'Shipping Cost', category: 'shipping' },
  { status: 'shipped', label: 'Shipped', category: 'shipping' },
  
  // Final
  { status: 'completed', label: 'Completed', category: 'final' }
];

/**
 * Get the progress index for a given WooCommerce status
 */
export function getWooStatusIndex(status: string): number {
  const index = WOO_STATUS_FLOW.findIndex(s => s.status === status);
  return index >= 0 ? index : 0;
}

/**
 * Check if a status is complete relative to current status
 */
export function isStatusComplete(currentStatus: string, checkStatus: string): boolean {
  const currentIndex = getWooStatusIndex(currentStatus);
  const checkIndex = getWooStatusIndex(checkStatus);
  return checkIndex <= currentIndex;
}
