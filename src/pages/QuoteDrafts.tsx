import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, lovableFunctions } from "@/integrations/supabase/client";
import { AppLayout } from "@/layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Check, X, Pencil, Send, MessageSquare, Instagram, Mail, 
  AlertTriangle, Clock, DollarSign, Car, User
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface QuoteDraft {
  id: string;
  source_agent: string;
  confidence: number;
  customer_name: string | null;
  customer_email: string;
  customer_phone: string | null;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  material: string | null;
  sqft: number | null;
  price_per_sqft: number | null;
  total_price: number | null;
  original_message: string | null;
  source: string | null;
  status: string;
  created_at: string;
}

const sourceIcons: Record<string, typeof MessageSquare> = {
  instagram: Instagram,
  email: Mail,
  chat: MessageSquare,
  dm: Instagram,
};

export default function QuoteDrafts() {
  const queryClient = useQueryClient();
  const [editingDraft, setEditingDraft] = useState<QuoteDraft | null>(null);
  const [editForm, setEditForm] = useState({
    customer_name: '',
    customer_email: '',
    vehicle_year: '',
    vehicle_make: '',
    vehicle_model: '',
    sqft: 0,
  });
  const [rejectingDraft, setRejectingDraft] = useState<QuoteDraft | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch drafts
  const { data: drafts, isLoading } = useQuery({
    queryKey: ['quote-drafts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_drafts')
        .select('*')
        .eq('status', 'draft')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as QuoteDraft[];
    }
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (draftId: string) => {
      const { data, error } = await lovableFunctions.functions.invoke('execute-quote-draft', {
        body: { draft_id: draftId, approving_agent: 'ops_desk' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Quote approved!');
      queryClient.invalidateQueries({ queryKey: ['quote-drafts'] });
    },
    onError: (error: Error) => {
      toast.error(`Approval failed: ${error.message}`);
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ draftId, reason }: { draftId: string; reason: string }) => {
      const { error } = await supabase
        .from('quote_drafts')
        .update({ status: 'rejected', rejected_reason: reason })
        .eq('id', draftId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Draft rejected');
      setRejectingDraft(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['quote-drafts'] });
    },
    onError: (error: Error) => {
      toast.error(`Rejection failed: ${error.message}`);
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ draftId, updates }: { draftId: string; updates: Partial<QuoteDraft> }) => {
      // Recalculate price if sqft changed
      const sqft = updates.sqft || 0;
      const pricePerSqft = 5.27;
      const totalPrice = Math.round(sqft * pricePerSqft * 100) / 100;

      const { error } = await supabase
        .from('quote_drafts')
        .update({ 
          ...updates, 
          price_per_sqft: pricePerSqft,
          total_price: totalPrice 
        })
        .eq('id', draftId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Draft updated');
      setEditingDraft(null);
      queryClient.invalidateQueries({ queryKey: ['quote-drafts'] });
    },
    onError: (error: Error) => {
      toast.error(`Update failed: ${error.message}`);
    }
  });

  // Handle edit click
  const handleEdit = (draft: QuoteDraft) => {
    setEditingDraft(draft);
    setEditForm({
      customer_name: draft.customer_name || '',
      customer_email: draft.customer_email,
      vehicle_year: draft.vehicle_year || '',
      vehicle_make: draft.vehicle_make || '',
      vehicle_model: draft.vehicle_model || '',
      sqft: draft.sqft || 0,
    });
  };

  const handleSaveEdit = () => {
    if (!editingDraft) return;
    updateMutation.mutate({
      draftId: editingDraft.id,
      updates: {
        customer_name: editForm.customer_name,
        customer_email: editForm.customer_email,
        vehicle_year: editForm.vehicle_year,
        vehicle_make: editForm.vehicle_make,
        vehicle_model: editForm.vehicle_model,
        sqft: editForm.sqft,
      }
    });
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return <Badge className="bg-green-500/20 text-green-400">High ({Math.round(confidence * 100)}%)</Badge>;
    if (confidence >= 0.7) return <Badge className="bg-yellow-500/20 text-yellow-400">Medium ({Math.round(confidence * 100)}%)</Badge>;
    return <Badge className="bg-red-500/20 text-red-400">Low ({Math.round(confidence * 100)}%)</Badge>;
  };

  const SourceIcon = (source: string | null) => {
    const Icon = sourceIcons[source || 'chat'] || MessageSquare;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quote Drafts</h1>
            <p className="text-muted-foreground">
              Review and approve AI-generated quotes before sending
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {drafts?.length || 0} Pending
          </Badge>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading drafts...</div>
        ) : !drafts?.length ? (
          <Card className="bg-muted/30">
            <CardContent className="py-12 text-center">
              <Check className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-medium">All caught up!</h3>
              <p className="text-muted-foreground">No pending quote drafts to review</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {drafts.map((draft) => (
              <Card key={draft.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Customer & Vehicle Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        {SourceIcon(draft.source)}
                        <span className="font-medium">{draft.customer_name || 'Unknown'}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{draft.customer_email}</span>
                        {getConfidenceBadge(draft.confidence)}
                        <Badge variant="outline" className="text-xs">
                          {draft.source_agent}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Car className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {draft.vehicle_year && draft.vehicle_make && draft.vehicle_model
                              ? `${draft.vehicle_year} ${draft.vehicle_make} ${draft.vehicle_model}`
                              : <span className="text-yellow-500 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> Missing vehicle info
                                </span>
                            }
                          </span>
                        </div>
                        <span className="text-muted-foreground">•</span>
                        <span>{draft.sqft || 0} sqft @ ${draft.price_per_sqft}/sqft</span>
                      </div>

                      {draft.original_message && (
                        <div className="bg-muted/50 rounded-lg p-3 text-sm">
                          <p className="text-muted-foreground line-clamp-2">
                            "{draft.original_message}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right: Price & Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-2xl font-bold text-primary">
                        {formatPrice(draft.total_price)}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(draft)}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setRejectingDraft(draft)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(draft.id)}
                          disabled={approveMutation.isPending}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Approve & Send
                        </Button>
                      </div>

                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(draft.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingDraft} onOpenChange={() => setEditingDraft(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Quote Draft</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Customer Name</label>
                  <Input
                    value={editForm.customer_name}
                    onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    value={editForm.customer_email}
                    onChange={(e) => setEditForm({ ...editForm, customer_email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Year</label>
                  <Input
                    value={editForm.vehicle_year}
                    onChange={(e) => setEditForm({ ...editForm, vehicle_year: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Make</label>
                  <Input
                    value={editForm.vehicle_make}
                    onChange={(e) => setEditForm({ ...editForm, vehicle_make: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Model</label>
                  <Input
                    value={editForm.vehicle_model}
                    onChange={(e) => setEditForm({ ...editForm, vehicle_model: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Square Footage</label>
                <Input
                  type="number"
                  value={editForm.sqft}
                  onChange={(e) => setEditForm({ ...editForm, sqft: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Price: {formatPrice(editForm.sqft * 5.27)} @ $5.27/sqft
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingDraft(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={!!rejectingDraft} onOpenChange={() => setRejectingDraft(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Quote Draft</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium">Reason for rejection</label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Spam, incomplete info, test message..."
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectingDraft(null)}>Cancel</Button>
              <Button 
                variant="destructive"
                onClick={() => rejectingDraft && rejectMutation.mutate({ 
                  draftId: rejectingDraft.id, 
                  reason: rejectReason 
                })}
                disabled={rejectMutation.isPending}
              >
                Reject Draft
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
