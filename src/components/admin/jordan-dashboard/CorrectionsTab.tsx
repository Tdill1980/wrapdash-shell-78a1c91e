import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, FileEdit, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Correction {
  id: string;
  trigger_phrase: string;
  approved_response: string;
  category: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

export function CorrectionsTab() {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newTrigger, setNewTrigger] = useState("");
  const [newResponse, setNewResponse] = useState("");

  const fetchCorrections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_corrections")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCorrections(data || []);
    } catch (error) {
      console.error("Error fetching corrections:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrections();
  }, []);

  const addCorrection = async () => {
    if (!newTrigger.trim() || !newResponse.trim()) {
      toast.error("Please fill in both fields");
      return;
    }

    try {
      const { error } = await supabase
        .from("ai_corrections")
        .insert({
          trigger_phrase: newTrigger,
          approved_response: newResponse,
          is_active: true,
        });

      if (error) throw error;

      toast.success("Correction added");
      setNewTrigger("");
      setNewResponse("");
      fetchCorrections();
    } catch (error) {
      toast.error("Failed to add correction");
    }
  };

  const deleteCorrection = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ai_corrections")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Correction deleted");
      fetchCorrections();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const filteredCorrections = corrections.filter(c =>
    c.trigger_phrase.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.approved_response.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Add New Correction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add AI Correction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Trigger Phrase</label>
              <Input
                placeholder="e.g., how much for a wrap"
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Approved Response</label>
              <Textarea
                placeholder="The correct response Jordan should give..."
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <Button onClick={addCorrection}>
            <Plus className="h-4 w-4 mr-2" />
            Add Correction
          </Button>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search corrections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Corrections List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5 text-primary" />
            Active Corrections ({filteredCorrections.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trigger Phrase</TableHead>
                <TableHead>Approved Response</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredCorrections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No corrections found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCorrections.map((correction) => (
                  <TableRow key={correction.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {correction.trigger_phrase}
                    </TableCell>
                    <TableCell className="max-w-[400px] truncate">
                      {correction.approved_response}
                    </TableCell>
                    <TableCell>
                      <Badge className={correction.is_active 
                        ? "bg-green-500/10 text-green-500 border-green-500/30"
                        : "bg-gray-500/10 text-gray-500 border-gray-500/30"
                      }>
                        {correction.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCorrection(correction.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
