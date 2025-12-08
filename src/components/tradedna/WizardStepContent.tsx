import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, MessageSquare, Mail, ClipboardPaste } from 'lucide-react';

interface WizardStepContentProps {
  data: {
    website_text: string;
    instagram_captions: string;
    sample_emails: string;
    additional_content: string;
  };
  onChange: (field: string, value: string) => void;
}

export const WizardStepContent = ({ data, onChange }: WizardStepContentProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <ClipboardPaste className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Content Collection</h2>
          <p className="text-sm text-muted-foreground">Paste your existing content for AI analysis</p>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-6">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Tip:</strong> The more content you provide, the more accurate your TradeDNA profile will be. 
          Copy and paste text from your website, social media posts, emails, and other communications.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="website_text" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Website Copy
          </Label>
          <Textarea
            id="website_text"
            placeholder="Paste your homepage copy, about page, service descriptions, testimonials, etc."
            value={data.website_text}
            onChange={(e) => onChange('website_text', e.target.value)}
            rows={5}
            className="bg-background/50 resize-none"
          />
          <p className="text-xs text-muted-foreground">Homepage, About, Services, FAQs, Reviews</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagram_captions" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Social Media Captions
          </Label>
          <Textarea
            id="instagram_captions"
            placeholder="Paste your top 5-10 Instagram/Facebook post captions..."
            value={data.instagram_captions}
            onChange={(e) => onChange('instagram_captions', e.target.value)}
            rows={5}
            className="bg-background/50 resize-none"
          />
          <p className="text-xs text-muted-foreground">Instagram, Facebook, TikTok captions</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sample_emails" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Sample Emails
          </Label>
          <Textarea
            id="sample_emails"
            placeholder="Paste sample emails you've sent to customers (quotes, follow-ups, order updates)..."
            value={data.sample_emails}
            onChange={(e) => onChange('sample_emails', e.target.value)}
            rows={5}
            className="bg-background/50 resize-none"
          />
          <p className="text-xs text-muted-foreground">Quotes, Follow-ups, Order confirmations</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="additional_content">Additional Content (optional)</Label>
          <Textarea
            id="additional_content"
            placeholder="Any other text that represents your brand voice: brochures, pricing sheets, DM conversations..."
            value={data.additional_content}
            onChange={(e) => onChange('additional_content', e.target.value)}
            rows={4}
            className="bg-background/50 resize-none"
          />
        </div>
      </div>
    </div>
  );
};
