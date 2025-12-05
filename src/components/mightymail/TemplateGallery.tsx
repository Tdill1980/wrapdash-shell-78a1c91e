import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sparkles, ArrowRight, Check, Eye } from 'lucide-react';
import { PREBUILT_TEMPLATES, PrebuiltTemplate } from '@/lib/prebuilt-email-templates';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const TemplateGallery: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<PrebuiltTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<PrebuiltTemplate | null>(null);
  const [using, setUsing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const categories = [
    { id: 'all', label: 'All Templates', count: PREBUILT_TEMPLATES.length },
    { id: 'quote', label: 'Quotes', count: PREBUILT_TEMPLATES.filter(t => t.category === 'quote').length },
    { id: 'followup', label: 'Follow-ups', count: PREBUILT_TEMPLATES.filter(t => t.category === 'followup').length },
    { id: 'order', label: 'Orders', count: PREBUILT_TEMPLATES.filter(t => t.category === 'order').length },
    { id: 'proof', label: 'Proofs', count: PREBUILT_TEMPLATES.filter(t => t.category === 'proof').length },
    { id: 'welcome', label: 'Welcome', count: PREBUILT_TEMPLATES.filter(t => t.category === 'welcome').length },
    { id: 'promo', label: 'Promos', count: PREBUILT_TEMPLATES.filter(t => t.category === 'promo').length },
  ];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      quote: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      followup: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      order: 'bg-green-500/20 text-green-400 border-green-500/30',
      proof: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      welcome: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      promo: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    };
    return colors[category] || 'bg-muted text-muted-foreground';
  };

  const getToneColor = (tone: string) => {
    const colors: Record<string, string> = {
      installer: 'bg-slate-500/20 text-slate-400',
      luxury: 'bg-amber-500/20 text-amber-400',
      hype: 'bg-red-500/20 text-red-400',
    };
    return colors[tone] || 'bg-muted text-muted-foreground';
  };

  const handleUseTemplate = async () => {
    if (!selectedTemplate) return;
    
    setUsing(true);
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          name: selectedTemplate.name,
          description: selectedTemplate.description,
          category: selectedTemplate.category,
          design_json: selectedTemplate.design
        })
        .select('id')
        .single();

      if (error) throw error;

      toast({
        title: "Template Added!",
        description: "Opening editor to customize your template...",
      });

      // Navigate to edit the new template
      navigate(`/admin/mightymail/templates/${data.id}`);
    } catch (error: any) {
      console.error('Use template error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to use template",
        variant: "destructive"
      });
    } finally {
      setUsing(false);
      setSelectedTemplate(null);
    }
  };

  const renderTemplateCard = (template: PrebuiltTemplate) => (
    <Card 
      key={template.id} 
      className="group hover:border-primary/50 transition-all duration-200 hover:shadow-lg cursor-pointer overflow-hidden"
      onClick={() => setSelectedTemplate(template)}
    >
      {/* Thumbnail Preview */}
      <div className="h-32 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-5xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
          <Button size="sm" variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Use Template
          </Button>
        </div>
        <span className="transform group-hover:scale-110 transition-transform">{template.thumbnail}</span>
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">{template.name}</CardTitle>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className={`text-xs ${getCategoryColor(template.category)}`}>
            {template.category}
          </Badge>
          <Badge variant="outline" className={`text-xs ${getToneColor(template.tone)}`}>
            {template.tone}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Pre-Built Templates
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Professional wrap shop email templates – one-click to customize
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {PREBUILT_TEMPLATES.length} Templates
        </Badge>
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="flex-wrap h-auto gap-1 p-1 bg-muted/50">
          {categories.map(cat => (
            <TabsTrigger 
              key={cat.id} 
              value={cat.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {cat.label}
              <span className="ml-1.5 text-xs opacity-60">({cat.count})</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(cat => (
          <TabsContent key={cat.id} value={cat.id} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {PREBUILT_TEMPLATES
                .filter(t => cat.id === 'all' || t.category === cat.id)
                .map(renderTemplateCard)}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Use Template Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl">
                {selectedTemplate?.thumbnail}
              </div>
              <div>
                <DialogTitle>{selectedTemplate?.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={`text-xs ${getCategoryColor(selectedTemplate?.category || '')}`}>
                    {selectedTemplate?.category}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${getToneColor(selectedTemplate?.tone || '')}`}>
                    {selectedTemplate?.tone} tone
                  </Badge>
                </div>
              </div>
            </div>
            <DialogDescription className="text-left">
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                What's included:
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Professional drag-and-drop design</li>
                <li>• Pre-configured merge tags (customer name, vehicle, price, etc.)</li>
                <li>• Mobile-responsive layout</li>
                <li>• Matching header colors and branding</li>
              </ul>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm">
                <strong>One-click setup:</strong> This template will be added to your library and opened in the editor for customization.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
              Cancel
            </Button>
            <Button onClick={handleUseTemplate} disabled={using} className="gap-2">
              {using ? (
                <>Loading...</>
              ) : (
                <>
                  Use This Template
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateGallery;
