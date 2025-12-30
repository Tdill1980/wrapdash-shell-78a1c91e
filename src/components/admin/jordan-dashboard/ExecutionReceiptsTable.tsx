import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow } from "date-fns";

interface ExecutionReceipt {
  id: string;
  action_type: string;
  status: string;
  channel: string;
  error: string | null;
  created_at: string;
}

export function ExecutionReceiptsTable() {
  const [receipts, setReceipts] = useState<ExecutionReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFailedOnly, setShowFailedOnly] = useState(false);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("execution_receipts")
        .select("id, action_type, status, channel, error, created_at")
        .order("created_at", { ascending: false });

      if (showFailedOnly) {
        // Filter to failed in last 48h
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        query = query
          .eq("status", "failed")
          .gte("created_at", twoDaysAgo);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setReceipts(data || []);
    } catch (e) {
      console.error("Failed to fetch execution receipts:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [showFailedOnly]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
      case "success":
      case "executed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "failed":
      case "error":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        Loading execution history...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Failed Sends Toggle */}
      <div className="flex items-center space-x-2">
        <Switch
          id="failed-only"
          checked={showFailedOnly}
          onCheckedChange={setShowFailedOnly}
        />
        <Label htmlFor="failed-only" className="text-sm text-muted-foreground">
          Failed Sends (48h) Only
        </Label>
      </div>

      {receipts.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          {showFailedOnly ? "No failed sends in last 48h" : "No execution history yet"}
        </div>
      ) : (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {receipt.action_type}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(receipt.status)}>
                      {receipt.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {receipt.channel || "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-red-400">
                    {receipt.error || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(receipt.created_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
