import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useShopFlow } from "@/hooks/useShopFlow";
import { ArrowLeft, Clock, User, Package, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusOptions = [
  { value: 'design_requested', label: 'Design Requested' },
  { value: 'awaiting_feedback', label: 'Awaiting Feedback' },
  { value: 'revision_sent', label: 'Revision Sent' },
  { value: 'ready_for_print', label: 'Ready for Print' },
  { value: 'in_production', label: 'In Production' },
  { value: 'completed', label: 'Completed' },
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { value: 'high', label: 'High', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
];

export default function ShopFlowJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { order, logs, loading, updateOrderStatus, updateOrderDetails } = useShopFlow(id);
  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);

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

  return (
    <div className="space-y-6 max-w-5xl">
      <Button variant="ghost" onClick={() => navigate('/shopflow')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Orders
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Order #{order.order_number}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {order.customer_name}
          </p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <h2 className="text-lg font-semibold">Status & Priority</h2>
          
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select value={order.status} onValueChange={updateOrderStatus}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select 
                value={order.priority || 'normal'} 
                onValueChange={(value) => updateOrderDetails({ priority: value })}
              >
                <SelectTrigger className="mt-2">
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
            </div>
          </div>
        </Card>
      </div>

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
