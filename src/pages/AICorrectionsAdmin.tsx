import { useState, useEffect } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Save, Brain, BookOpen, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Correction {
  id: string;
  trigger_phrase: string;
  flagged_response: string | null;
  approved_response: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

interface KnowledgeItem {
  id: string;
  category: string;
  question: string | null;
  answer: string;
  keywords: string[];
  is_active: boolean;
  created_at: string;
}

export default function AICorrectionsAdmin() {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New correction form
  const [newTrigger, setNewTrigger] = useState("");
  const [newFlagged, setNewFlagged] = useState("");
  const [newApproved, setNewApproved] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  
  // New knowledge item form
  const [newKnowledgeCategory, setNewKnowledgeCategory] = useState("pricing");
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newKeywords, setNewKeywords] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    const [correctionsRes, knowledgeRes] = await Promise.all([
      supabase.from('ai_corrections').select('*').order('created_at', { ascending: false }),
      supabase.from('knowledge_items').select('*').order('created_at', { ascending: false })
    ]);

    if (correctionsRes.data) setCorrections(correctionsRes.data);
    if (knowledgeRes.data) setKnowledgeItems(knowledgeRes.data);
    
    setLoading(false);
  };

  const addCorrection = async () => {
    if (!newTrigger || !newApproved) {
      toast.error("Trigger phrase and approved response are required");
      return;
    }

    const { error } = await supabase.from('ai_corrections').insert({
      trigger_phrase: newTrigger,
      flagged_response: newFlagged || null,
      approved_response: newApproved,
      category: newCategory
    });

    if (error) {
      toast.error("Failed to add correction");
      return;
    }

    toast.success("Correction added!");
    setNewTrigger("");
    setNewFlagged("");
    setNewApproved("");
    loadData();
  };

  const toggleCorrection = async (id: string, isActive: boolean) => {
    await supabase.from('ai_corrections').update({ is_active: !isActive }).eq('id', id);
    loadData();
  };

  const deleteCorrection = async (id: string) => {
    await supabase.from('ai_corrections').delete().eq('id', id);
    toast.success("Correction deleted");
    loadData();
  };

  const addKnowledgeItem = async () => {
    if (!newAnswer) {
      toast.error("Answer is required");
      return;
    }

    const keywords = newKeywords.split(',').map(k => k.trim()).filter(Boolean);

    const { error } = await supabase.from('knowledge_items').insert({
      category: newKnowledgeCategory,
      question: newQuestion || null,
      answer: newAnswer,
      keywords
    });

    if (error) {
      toast.error("Failed to add knowledge item");
      return;
    }

    toast.success("Knowledge item added!");
    setNewQuestion("");
    setNewAnswer("");
    setNewKeywords("");
    loadData();
  };

  const toggleKnowledge = async (id: string, isActive: boolean) => {
    await supabase.from('knowledge_items').update({ is_active: !isActive }).eq('id', id);
    loadData();
  };

  const deleteKnowledge = async (id: string) => {
    await supabase.from('knowledge_items').delete().eq('id', id);
    toast.success("Knowledge item deleted");
    loadData();
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Brain className="h-8 w-8 text-primary" />
                AI Corrections & Knowledge Base
              </h1>
              <p className="text-muted-foreground mt-1">
                Prevent hallucinations by adding corrections and grounding facts
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-lg py-2 px-4">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                {corrections.filter(c => c.is_active).length} Active Corrections
              </Badge>
              <Badge variant="outline" className="text-lg py-2 px-4">
                <BookOpen className="h-4 w-4 mr-2 text-blue-500" />
                {knowledgeItems.filter(k => k.is_active).length} Knowledge Items
              </Badge>
            </div>
          </div>

          <Tabs defaultValue="corrections" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="corrections" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Corrections
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Knowledge Base
              </TabsTrigger>
            </TabsList>

            {/* Corrections Tab */}
            <TabsContent value="corrections" className="space-y-6">
              {/* Add New Correction */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add New Correction
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Trigger Phrase</Label>
                      <Input
                        placeholder="e.g., 'What colors do you have?'"
                        value={newTrigger}
                        onChange={(e) => setNewTrigger(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        When customer asks this, use the approved response
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={newCategory} onValueChange={setNewCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="pricing">Pricing</SelectItem>
                          <SelectItem value="products">Products</SelectItem>
                          <SelectItem value="installation">Installation</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Flagged Response (Optional)</Label>
                    <Textarea
                      placeholder="The wrong answer AI gave that prompted this correction..."
                      value={newFlagged}
                      onChange={(e) => setNewFlagged(e.target.value)}
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Approved Response *</Label>
                    <Textarea
                      placeholder="The correct answer to use when this trigger is detected..."
                      value={newApproved}
                      onChange={(e) => setNewApproved(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <Button onClick={addCorrection} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save Correction
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Corrections */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Corrections ({corrections.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {corrections.map((correction) => (
                    <div 
                      key={correction.id} 
                      className={`p-4 rounded-lg border ${correction.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{correction.category}</Badge>
                            <span className="font-medium">"{correction.trigger_phrase}"</span>
                          </div>
                          {correction.flagged_response && (
                            <div className="text-sm">
                              <span className="text-red-500">❌ Wrong:</span>{" "}
                              <span className="text-muted-foreground">{correction.flagged_response}</span>
                            </div>
                          )}
                          <div className="text-sm">
                            <span className="text-green-500">✓ Correct:</span>{" "}
                            {correction.approved_response}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={correction.is_active}
                            onCheckedChange={() => toggleCorrection(correction.id, correction.is_active)}
                          />
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deleteCorrection(correction.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {corrections.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No corrections yet. Add one above to prevent AI hallucinations.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Knowledge Base Tab */}
            <TabsContent value="knowledge" className="space-y-6">
              {/* Add New Knowledge Item */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add Knowledge Item
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={newKnowledgeCategory} onValueChange={setNewKnowledgeCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pricing">Pricing</SelectItem>
                          <SelectItem value="products">Products</SelectItem>
                          <SelectItem value="installation">Installation</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="care">Care & Maintenance</SelectItem>
                          <SelectItem value="faq">FAQ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Keywords (comma separated)</Label>
                      <Input
                        placeholder="e.g., price, cost, wrap, full"
                        value={newKeywords}
                        onChange={(e) => setNewKeywords(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Question (Optional)</Label>
                    <Input
                      placeholder="e.g., 'How much does a full wrap cost?'"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Answer *</Label>
                    <Textarea
                      placeholder="The factual answer the AI should use..."
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <Button onClick={addKnowledgeItem} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Add to Knowledge Base
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Knowledge Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Knowledge Items ({knowledgeItems.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {knowledgeItems.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-lg border ${item.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">{item.category}</Badge>
                            {item.keywords?.map((keyword, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                          {item.question && (
                            <p className="font-medium">Q: {item.question}</p>
                          )}
                          <p className="text-sm text-muted-foreground">A: {item.answer}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.is_active}
                            onCheckedChange={() => toggleKnowledge(item.id, item.is_active)}
                          />
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deleteKnowledge(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {knowledgeItems.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No knowledge items yet. Add factual information above.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
