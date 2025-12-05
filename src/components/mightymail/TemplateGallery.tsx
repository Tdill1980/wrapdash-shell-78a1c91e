import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sparkles, ArrowRight, Check, Mail, Clock, Package, Palette, Gift, Megaphone, ImageIcon, Upload } from 'lucide-react';
import { PREBUILT_TEMPLATES, PrebuiltTemplate } from '@/lib/prebuilt-email-templates';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const TemplateGallery: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<PrebuiltTemplate | null>(null);
  const [using, setUsing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const categories = [
    { id: 'all', label: 'All', icon: Sparkles, count: PREBUILT_TEMPLATES.length },
    { id: 'quote', label: 'Quotes', icon: Mail, count: PREBUILT_TEMPLATES.filter(t => t.category === 'quote').length },
    { id: 'followup', label: 'Follow-ups', icon: Clock, count: PREBUILT_TEMPLATES.filter(t => t.category === 'followup').length },
    { id: 'order', label: 'Orders', icon: Package, count: PREBUILT_TEMPLATES.filter(t => t.category === 'order').length },
    { id: 'proof', label: 'Proofs', icon: Palette, count: PREBUILT_TEMPLATES.filter(t => t.category === 'proof').length },
    { id: 'welcome', label: 'Welcome', icon: Gift, count: PREBUILT_TEMPLATES.filter(t => t.category === 'welcome').length },
    { id: 'promo', label: 'Promos', icon: Megaphone, count: PREBUILT_TEMPLATES.filter(t => t.category === 'promo').length },
  ];

  const getCategoryGradient = (category: string) => {
    const gradients: Record<string, string> = {
      quote: 'from-blue-600 to-blue-400',
      followup: 'from-orange-600 to-amber-400',
      order: 'from-emerald-600 to-green-400',
      proof: 'from-violet-600 to-purple-400',
      welcome: 'from-cyan-600 to-teal-400',
      promo: 'from-pink-600 to-rose-400',
    };
    return gradients[category] || 'from-gray-600 to-gray-400';
  };

  const getCategoryBadgeStyle = (category: string) => {
    const styles: Record<string, string> = {
      quote: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      followup: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      order: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      proof: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
      welcome: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      promo: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    };
    return styles[category] || 'bg-muted text-muted-foreground';
  };

  const getToneBadgeStyle = (tone: string) => {
    const styles: Record<string, string> = {
      installer: 'bg-slate-800 text-slate-200',
      luxury: 'bg-gradient-to-r from-amber-900 to-yellow-700 text-amber-100',
      hype: 'bg-gradient-to-r from-red-700 to-orange-600 text-white',
    };
    return styles[tone] || 'bg-muted text-muted-foreground';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      quote: Mail,
      followup: Clock,
      order: Package,
      proof: Palette,
      welcome: Gift,
      promo: Megaphone,
    };
    return icons[category] || Mail;
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
        description: "Opening editor to customize...",
      });

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

  const renderTemplateCard = (template: PrebuiltTemplate) => {
    const CategoryIcon = getCategoryIcon(template.category);
    
    return (
      <Card 
        key={template.id} 
        className="group relative overflow-hidden border-0 bg-card/50 backdrop-blur hover:bg-card transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10"
        onClick={() => setSelectedTemplate(template)}
      >
        {/* Preview Header with Gradient */}
        <div className={`relative h-36 bg-gradient-to-br ${getCategoryGradient(template.category)} p-4 flex flex-col justify-between`}>
          {/* Mock email preview */}
          <div className="absolute inset-2 top-3 bg-white/95 rounded-md shadow-lg overflow-hidden">
            <div className="h-8 bg-gray-100 flex items-center gap-1.5 px-2">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="ml-2 text-[10px] text-gray-500 truncate">{template.name}</span>
            </div>
            <div className="p-2 space-y-1.5">
              <div className={`h-4 w-full rounded bg-gradient-to-r ${getCategoryGradient(template.category)}`} />
              <div className="space-y-1">
                <div className="h-1.5 bg-gray-200 rounded w-3/4" />
                <div className="h-1.5 bg-gray-200 rounded w-full" />
                <div className="h-1.5 bg-gray-200 rounded w-2/3" />
              </div>
              <div className={`h-4 w-20 rounded bg-gradient-to-r ${getCategoryGradient(template.category)} mt-2`} />
            </div>
          </div>
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button size="sm" className="bg-white text-gray-900 hover:bg-gray-100 gap-2">
              <Sparkles className="h-4 w-4" />
              Use Template
            </Button>
          </div>
        </div>
        
        {/* Card Content */}
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                {template.name}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {template.description}
              </p>
            </div>
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${getCategoryGradient(template.category)}`}>
              <CategoryIcon className="h-4 w-4 text-white" />
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${getCategoryBadgeStyle(template.category)}`}>
              {template.category}
            </Badge>
            <Badge className={`text-[10px] px-1.5 py-0 h-5 border-0 ${getToneBadgeStyle(template.tone)}`}>
              {template.tone}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span>Template Gallery</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Professional wrap shop templates • One-click to customize
          </p>
        </div>
        <Badge variant="secondary" className="text-sm font-medium">
          {PREBUILT_TEMPLATES.length} Templates
        </Badge>
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full flex flex-wrap justify-start h-auto gap-1 p-1.5 bg-muted/30 border rounded-xl">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <Icon className="h-4 w-4" />
                <span>{cat.label}</span>
                <span className="text-xs text-muted-foreground">({cat.count})</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map(cat => (
          <TabsContent key={cat.id} value={cat.id} className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {PREBUILT_TEMPLATES
                .filter(t => cat.id === 'all' || t.category === cat.id)
                .map(renderTemplateCard)}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Use Template Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${getCategoryGradient(selectedTemplate?.category || '')} flex items-center justify-center shadow-lg`}>
                {selectedTemplate && React.createElement(getCategoryIcon(selectedTemplate.category), { className: "h-7 w-7 text-white" })}
              </div>
              <div className="flex-1">
                <DialogTitle className="text-lg">{selectedTemplate?.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="outline" className={`text-xs ${getCategoryBadgeStyle(selectedTemplate?.category || '')}`}>
                    {selectedTemplate?.category}
                  </Badge>
                  <Badge className={`text-xs border-0 ${getToneBadgeStyle(selectedTemplate?.tone || '')}`}>
                    {selectedTemplate?.tone}
                  </Badge>
                </div>
              </div>
            </div>
            <DialogDescription className="text-left text-sm">
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Preview */}
            <div className={`relative h-40 bg-gradient-to-br ${getCategoryGradient(selectedTemplate?.category || '')} rounded-xl overflow-hidden`}>
              <div className="absolute inset-3 bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="h-6 bg-gray-100 flex items-center gap-1 px-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                </div>
                <div className="p-3 space-y-2">
                  <div className={`h-5 w-full rounded bg-gradient-to-r ${getCategoryGradient(selectedTemplate?.category || '')}`} />
                  <div className="space-y-1">
                    <div className="h-2 bg-gray-200 rounded w-4/5" />
                    <div className="h-2 bg-gray-200 rounded w-full" />
                    <div className="h-2 bg-gray-200 rounded w-3/5" />
                  </div>
                  <div className={`h-5 w-24 rounded-md bg-gradient-to-r ${getCategoryGradient(selectedTemplate?.category || '')} mt-2`} />
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 border">
              <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-500" />
                What's included:
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary" />
                  Professional drag-and-drop design
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary" />
                  Pre-configured merge tags
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary" />
                  Mobile-responsive layout
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary" />
                  Customizable colors & images
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setSelectedTemplate(null)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleUseTemplate} disabled={using} className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/80">
              {using ? (
                <>Loading...</>
              ) : (
                <>
                  Use Template
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
