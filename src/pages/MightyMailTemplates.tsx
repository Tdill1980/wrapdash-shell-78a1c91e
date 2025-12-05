import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Edit, Trash2, Copy, Mail, Sparkles, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import TemplateGallery from '@/components/mightymail/TemplateGallery';

interface EmailTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

const MightyMailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('id, name, description, category, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      setTemplates(templates.filter(t => t.id !== deleteId));
      toast({
        title: "Template Deleted",
        description: "The template has been removed"
      });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    try {
      // Fetch full template with design
      const { data: fullTemplate, error: fetchError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', template.id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('email_templates')
        .insert({
          name: `${fullTemplate.name} (Copy)`,
          description: fullTemplate.description,
          category: fullTemplate.category,
          design_json: fullTemplate.design_json,
          html: fullTemplate.html
        });

      if (error) throw error;

      fetchTemplates();
      toast({
        title: "Template Duplicated",
        description: "A copy has been created"
      });
    } catch (error: any) {
      toast({
        title: "Duplicate Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      quote: 'bg-blue-500/20 text-blue-400',
      order: 'bg-green-500/20 text-green-400',
      proof: 'bg-purple-500/20 text-purple-400',
      welcome: 'bg-yellow-500/20 text-yellow-400',
      followup: 'bg-orange-500/20 text-orange-400',
      general: 'bg-gray-500/20 text-gray-400'
    };
    return colors[category] || colors.general;
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              <span className="text-foreground">Mighty</span>
              <span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">Mail</span>
              <span className="text-foreground ml-2">Templates</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Professional email templates for wrap shops
            </p>
          </div>
          <Button onClick={() => navigate('/admin/mightymail/templates/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        {/* Main Tabs - Gallery vs My Templates */}
        <Tabs defaultValue="gallery" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="gallery" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Template Gallery
            </TabsTrigger>
            <TabsTrigger value="my-templates" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              My Templates ({templates.length})
            </TabsTrigger>
          </TabsList>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="mt-6">
            <TemplateGallery />
          </TabsContent>

          {/* My Templates Tab */}
          <TabsContent value="my-templates" className="mt-6 space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search your templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Templates Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-5 bg-muted rounded w-2/3" />
                      <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredTemplates.length === 0 ? (
              <Card className="p-12 text-center">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Templates Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by picking a template from the gallery, or create one from scratch
                </p>
                <Button onClick={() => navigate('/admin/mightymail/templates/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map(template => (
                  <Card key={template.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription className="mt-1">
                            Updated {format(new Date(template.updated_at), 'MMM d, yyyy')}
                          </CardDescription>
                        </div>
                        <Badge className={getCategoryColor(template.category)}>
                          {template.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/admin/mightymail/templates/${template.id}`)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicate(template)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteId(template.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Template?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The template will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
};

export default MightyMailTemplates;
