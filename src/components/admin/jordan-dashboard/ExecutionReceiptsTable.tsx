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

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("execution_receipts")
        .select("id, action_type, status, channel, error, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

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
  }, []);

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

  if (receipts.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        No execution history yet
      </div>
    );
  }

  return (
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
  );
}
