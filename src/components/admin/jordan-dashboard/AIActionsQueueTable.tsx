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

interface AIAction {
  id: string;
  action_type: string;
  status: string | null;
  channel: string | null;
  preview: string | null;
  created_at: string | null;
  priority: string | null;
}

export function AIActionsQueueTable() {
  const [actions, setActions] = useState<AIAction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_actions")
        .select("id, action_type, status, channel, preview, created_at, priority")
        .in("status", ["pending", "processing", "failed"])
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setActions(data || []);
    } catch (e) {
      console.error("Failed to fetch AI actions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "processing":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "executed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getActionTypeColor = (type: string) => {
    switch (type) {
      case "approve_message":
        return "text-blue-400";
      case "create_quote":
      case "auto_quote_generated":
        return "text-green-400";
      case "dm_send":
      case "email_send":
        return "text-purple-400";
      case "file_review":
        return "text-orange-400";
      default:
        return "text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        Loading AI actions...
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-green-400">
        No pending AI actions
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
            <TableHead>Preview</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {actions.map((action) => (
            <TableRow key={action.id}>
              <TableCell className={`font-mono text-xs ${getActionTypeColor(action.action_type)}`}>
                {action.action_type}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusColor(action.status)}>
                  {action.status || "unknown"}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {action.channel || "—"}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                {action.preview || "—"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {action.created_at
                  ? formatDistanceToNow(new Date(action.created_at), { addSuffix: true })
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
