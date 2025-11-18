import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useShopFlow } from "@/hooks/useShopFlow";
import { ArrowLeft, Clock, User, Package, Calendar, Truck, ExternalLink, FileText, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { wooToInternalStatus, InternalStatus } from "@/lib/status-mapping";

// Internal status options for staff
const internalStatusOptions: { value: string; label: string; stage: string }[] = [
  { value: 'pending', label: 'Pending', stage: 'Order Received' },
  { value: 'processing', label: 'Processing', stage: 'Order Received' },
  { value: 'missing-file', label: 'Missing File', stage: 'File Required' },
  { value: 'file-error', label: 'File Error', stage: 'File Issue' },
  { value: 'in-design', label: 'In Design', stage: 'In Design' },
  { value: 'design-complete', label: 'Design Complete', stage: 'Awaiting Approval' },
  { value: 'ready-for-print', label: 'Ready for Print', stage: 'Preflight' },
  { value: 'pre-press', label: 'Pre-Press', stage: 'Preflight' },
  { value: 'print-production', label: 'Print Production', stage: 'Printing' },
  { value: 'lamination', label: 'Lamination', stage: 'Lamination' },
  { value: 'finishing', label: 'Finishing', stage: 'Cut/Weed' },
  { value: 'ready-for-pickup', label: 'Ready for Pickup', stage: 'Packaging' },
  { value: 'shipped', label: 'Shipped', stage: 'Shipped' },
  { value: 'completed', label: 'Completed', stage: 'Completed' },
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { value: 'high', label: 'High', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
];

export default function ShopFlowJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Check if ID is valid
  if (!id || id === ':id') {
    return (
      <div className="space-y-6 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate('/shopflow')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Invalid order ID. Please select an order from the list.</p>
          <Button onClick={() => navigate('/shopflow')} className="mt-4">
            View All Orders
          </Button>
        </Card>
      </div>
    );
  }

  const { order, logs, loading, updateOrderStatus, updateOrderDetails, addTracking } = useShopFlow(id);
  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [addingTracking, setAddingTracking] = useState(false);

  if (loading || !order) {
    return (
      <div className="space-y-6 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate('/shopflow')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Loading order...</p>
        </Card>
      </div>
    );
  }

  const handleSaveNotes = () => {
    updateOrderDetails({ notes });
    setEditingNotes(false);
  };

  const handleAddTracking = async () => {
    if (!trackingNumber.trim()) return;
    setAddingTracking(true);
    await addTracking(trackingNumber.trim());
    setTrackingNumber('');
    setAddingTracking(false);
  };

  const internalStatus = wooToInternalStatus[order.status] || "order_received";
  const currentStatusOption = internalStatusOptions.find(opt => opt.value === order.status);
  const isFileIssue = internalStatus === "action_required";

  return (
    <div className="space-y-6 max-w-6xl">
      <Button variant="ghost" onClick={() => navigate('/shopflow')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Orders
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Order #{order.order_number}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {order.customer_name}
          </p>
          {currentStatusOption && (
            <Badge variant="outline" className="mt-2 bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] border-0 text-white">
              {currentStatusOption.stage}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {order.approveflow_project_id && (
            <Button
              variant="outline"
              onClick={() => navigate(`/approveflow/${order.approveflow_project_id}`)}
            >
              View in ApproveFlow
            </Button>
          )}
        </div>
      </div>

      {/* File Issue Alert */}
      {isFileIssue && (
        <Card className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground">File Issue Detected</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Customer needs to upload a corrected file. Status: {order.status}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Details */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Order Details</h2>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Product:</span>
                <span className="font-medium">{order.product_type}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">{format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}</span>
              </div>

              {order.assigned_to && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Assigned to:</span>
                  <span className="font-medium">{order.assigned_to}</span>
                </div>
              )}

              {order.estimated_completion_date && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Est. Completion:</span>
                  <span className="font-medium">{format(new Date(order.estimated_completion_date), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Priority</h2>
            <Select 
              value={order.priority || 'normal'} 
              onValueChange={(value) => updateOrderDetails({ priority: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    <Badge variant="outline" className={priority.color}>
                      {priority.label}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        </div>

        {/* Center Column - Production Workflow */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Production Workflow
            </h2>
            
            <div className="space-y-3">
              <div>
                <Label>WooCommerce Status (Internal)</Label>
                <Select value={order.status} onValueChange={updateOrderStatus}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {internalStatusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{status.label}</span>
                          <span className="text-xs text-muted-foreground">Stage: {status.stage}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Current Stage: <span className="font-medium">{currentStatusOption?.stage || 'Unknown'}</span>
                </p>
              </div>
            </div>
          </Card>

          {/* Production Notes */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Production Notes</h2>
              {!editingNotes && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNotes(order.notes || '');
                    setEditingNotes(true);
                  }}
                >
                  Edit
                </Button>
              )}
            </div>
            
            {editingNotes ? (
              <div className="space-y-3">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add production notes..."
                  className="min-h-[120px]"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSaveNotes} size="sm">
                    Save Notes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingNotes(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {order.notes || 'No production notes yet.'}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Shipping & Tracking
        </h2>
        
        {order.tracking_number ? (
          <div className="space-y-3">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tracking Number</p>
                  <p className="font-mono font-medium">{order.tracking_number}</p>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  Shipped
                </Badge>
              </div>
              {order.shipped_at && (
                <p className="text-xs text-muted-foreground">
                  Shipped on {format(new Date(order.shipped_at), 'MMM d, yyyy h:mm a')}
                </p>
              )}
            </div>
            {order.tracking_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(order.tracking_url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Track Package
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Add UPS tracking number when package is shipped
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="1Z999AA10123456784"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTracking();
                }}
              />
              <Button 
                onClick={handleAddTracking}
                disabled={!trackingNumber.trim() || addingTracking}
              >
                {addingTracking ? 'Adding...' : 'Add Tracking'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Production Notes</h2>
          {!editingNotes && (
            <Button variant="outline" size="sm" onClick={() => {
              setNotes(order.notes || '');
              setEditingNotes(true);
            }}>
              Edit
            </Button>
          )}
        </div>
        
        {editingNotes ? (
          <div className="space-y-3">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add production notes, special instructions, or tracking information..."
              rows={4}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveNotes}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingNotes(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {order.notes || 'No notes added yet'}
          </p>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Activity Log</h2>
        
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-sm border-l-2 border-border pl-4 py-2">
                <div className="flex-1">
                  <p className="font-medium">{log.event_type.replace(/_/g, ' ').toUpperCase()}</p>
                  {log.payload && (
                    <p className="text-muted-foreground text-xs mt-1">
                      {JSON.stringify(log.payload, null, 2)}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(log.created_at), 'MMM d, h:mm a')}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
