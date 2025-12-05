import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AITemplateGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateGenerated: (design: any) => void;
}

const AITemplateGeneratorModal: React.FC<AITemplateGeneratorModalProps> = ({
  open,
  onOpenChange,
  onTemplateGenerated
}) => {
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('installer');
  const [templateType, setTemplateType] = useState('general');
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeHeroImage, setIncludeHeroImage] = useState(true);
  const [includeCta, setIncludeCta] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast({
        title: 'Description Required',
        description: 'Please describe the email template you want to create',
        variant: 'destructive'
      });
      return;
    }

    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-template', {
        body: {
          description,
          tone,
          templateType,
          includeHeader,
          includeHeroImage,
          includeCta
        }
      });

      if (error) throw error;

      if (data?.design) {
        onTemplateGenerated(data.design);
        toast({
          title: 'Template Generated!',
          description: 'AI has created your email template'
        });
        onOpenChange(false);
        setDescription('');
      } else {
        throw new Error('No template design received');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate template',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Template Generator
          </DialogTitle>
          <DialogDescription>
            Describe the email you want and AI will create a complete template
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="description">What kind of email do you need?</Label>
            <Textarea
              id="description"
              placeholder="e.g., A follow-up email for customers who received a quote but haven't responded in 3 days. Should emphasize the quality of our work and include a special limited-time discount."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="installer">🔧 Installer</SelectItem>
                  <SelectItem value="luxury">✨ Luxury</SelectItem>
                  <SelectItem value="hype">🔥 Hype</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Template Type</Label>
              <Select value={templateType} onValueChange={setTemplateType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="quote">Quote</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="order">Order Status</SelectItem>
                  <SelectItem value="proof">Proof Delivery</SelectItem>
                  <SelectItem value="welcome">Welcome</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Include Sections</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeHeader"
                  checked={includeHeader}
                  onCheckedChange={(checked) => setIncludeHeader(checked as boolean)}
                />
                <Label htmlFor="includeHeader" className="text-sm cursor-pointer">Header</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeHeroImage"
                  checked={includeHeroImage}
                  onCheckedChange={(checked) => setIncludeHeroImage(checked as boolean)}
                />
                <Label htmlFor="includeHeroImage" className="text-sm cursor-pointer">Hero Image</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeCta"
                  checked={includeCta}
                  onCheckedChange={(checked) => setIncludeCta(checked as boolean)}
                />
                <Label htmlFor="includeCta" className="text-sm cursor-pointer">CTA Button</Label>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={generating || !description.trim()}
            className="w-full bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] hover:from-[#5B7FFF] hover:via-[#9B59B6] hover:to-[#F56A9E]"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Template...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Template
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AITemplateGeneratorModal;
