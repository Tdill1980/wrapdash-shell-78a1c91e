import { useState, useEffect } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, QrCode, Code, Copy, Eye, Trash2, ExternalLink, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useToast } from "@/hooks/use-toast";

interface LeadGenerator {
  id: string;
  name: string;
  description: string | null;
  fields: any[];
  embed_code: string | null;
  redirect_url: string | null;
  qr_code_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
}

const defaultFields: FormField[] = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone', type: 'phone', required: false },
  { name: 'vehicle', label: 'Vehicle (Year Make Model)', type: 'text', required: true },
  { name: 'wrap_type', label: 'Wrap Type', type: 'select', required: true, options: ['Color Change', 'Printed Wrap', 'Commercial Fleet', 'Custom Design'] }
];

const LeadGeneratorPage = () => {
  const { currentOrganization: organization } = useOrganization();
  const { toast } = useToast();
  const [generators, setGenerators] = useState<LeadGenerator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedGenerator, setSelectedGenerator] = useState<LeadGenerator | null>(null);
  
  // Create form state
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newFields, setNewFields] = useState<FormField[]>(defaultFields);
  const [newRedirectUrl, setNewRedirectUrl] = useState("");

  useEffect(() => {
    fetchGenerators();
  }, [organization?.id]);

  const fetchGenerators = async () => {
    if (!organization?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('lead_generators')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Cast the data to our interface type
      setGenerators((data || []) as LeadGenerator[]);
    } catch (error) {
      console.error('Error fetching generators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!organization?.id || !newName.trim()) return;

    try {
      // Generate embed code
      const embedCode = `<script src="https://wrapcommandai.com/embed/lead-form.js" data-generator-id="PLACEHOLDER"></script>`;
      
      const { data, error } = await supabase
        .from('lead_generators')
        .insert([{
          organization_id: organization.id,
          name: newName,
          description: newDescription,
          fields: newFields as unknown as Record<string, unknown>,
          redirect_url: newRedirectUrl,
          embed_code: embedCode,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      // Update embed code with actual ID
      const updatedEmbedCode = embedCode.replace('PLACEHOLDER', data.id);
      await supabase
        .from('lead_generators')
        .update({ embed_code: updatedEmbedCode })
        .eq('id', data.id);

      toast({
        title: "Lead Generator Created",
        description: `${newName} is ready to capture leads`
      });

      setShowCreateDialog(false);
      setNewName("");
      setNewDescription("");
      setNewFields(defaultFields);
      setNewRedirectUrl("");
      fetchGenerators();
    } catch (error) {
      console.error('Error creating generator:', error);
      toast({
        title: "Error",
        description: "Failed to create lead generator",
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await supabase
        .from('lead_generators')
        .update({ is_active: !isActive })
        .eq('id', id);
      
      fetchGenerators();
    } catch (error) {
      console.error('Error toggling generator:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase
        .from('lead_generators')
        .delete()
        .eq('id', id);
      
      toast({
        title: "Deleted",
        description: "Lead generator removed"
      });
      fetchGenerators();
    } catch (error) {
      console.error('Error deleting generator:', error);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: "Embed code copied to clipboard"
    });
  };

  const handlePreview = (generator: LeadGenerator) => {
    setSelectedGenerator(generator);
    setShowPreviewDialog(true);
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C]">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                <span className="text-foreground">Lead</span>
                <span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent"> Generators</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Create embeddable forms, QR codes, and capture links
              </p>
            </div>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Generator
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Lead Generator</DialogTitle>
                <DialogDescription>
                  Build a form to capture leads from your website, IG bio, or QR codes
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Generator Name</Label>
                    <Input
                      placeholder="e.g., Website Quote Form"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Redirect URL (optional)</Label>
                    <Input
                      placeholder="https://yoursite.com/thank-you"
                      value={newRedirectUrl}
                      onChange={(e) => setNewRedirectUrl(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="What is this form for?"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Form Fields</Label>
                  <div className="border rounded-lg p-4 space-y-3">
                    {newFields.map((field, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Input
                          value={field.label}
                          onChange={(e) => {
                            const updated = [...newFields];
                            updated[index].label = e.target.value;
                            setNewFields(updated);
                          }}
                          className="flex-1"
                        />
                        <Select
                          value={field.type}
                          onValueChange={(value: FormField['type']) => {
                            const updated = [...newFields];
                            updated[index].type = value;
                            setNewFields(updated);
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                            <SelectItem value="textarea">Textarea</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={field.required}
                            onCheckedChange={(checked) => {
                              const updated = [...newFields];
                              updated[index].required = checked;
                              setNewFields(updated);
                            }}
                          />
                          <Label className="text-xs">Required</Label>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNewFields([...newFields, { name: '', label: 'New Field', type: 'text', required: false }])}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Field
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={!newName.trim()}>
                    Create Generator
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Generators List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-48" />
              </Card>
            ))}
          </div>
        ) : generators.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Lead Generators Yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first lead generator to capture leads from your website or social media
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Generator
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generators.map((generator) => (
              <Card key={generator.id} className={!generator.is_active ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{generator.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {generator.description || 'No description'}
                      </CardDescription>
                    </div>
                    <Badge variant={generator.is_active ? 'default' : 'secondary'}>
                      {generator.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {(generator.fields as FormField[])?.slice(0, 3).map((field, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {field.label}
                      </Badge>
                    ))}
                    {(generator.fields as FormField[])?.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{(generator.fields as FormField[]).length - 3} more
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(generator)}
                      className="col-span-1"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyCode(generator.embed_code || '')}
                      className="col-span-1"
                    >
                      <Code className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="col-span-1"
                    >
                      <QrCode className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(generator.id)}
                      className="col-span-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      Created {new Date(generator.created_at).toLocaleDateString()}
                    </span>
                    <Switch
                      checked={generator.is_active}
                      onCheckedChange={() => handleToggleActive(generator.id, generator.is_active)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Form Preview: {selectedGenerator?.name}</DialogTitle>
              <DialogDescription>
                This is how your lead form will appear
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {(selectedGenerator?.fields as FormField[])?.map((field, idx) => (
                <div key={idx} className="space-y-2">
                  <Label>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {field.type === 'textarea' ? (
                    <Textarea placeholder={`Enter ${field.label.toLowerCase()}`} />
                  ) : field.type === 'select' ? (
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((opt, optIdx) => (
                          <SelectItem key={optIdx} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={field.type}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}
              <Button className="w-full">Get My Quote</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default LeadGeneratorPage;