import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';

interface WizardStepIdentityProps {
  data: {
    business_name: string;
    tagline: string;
    business_category: string;
  };
  onChange: (field: string, value: string) => void;
}

const categories = [
  { value: 'wrap_shop', label: 'Wrap Shop' },
  { value: 'print_brand', label: 'Print Brand / Wholesaler' },
  { value: 'media_brand', label: 'Media Brand / Magazine' },
  { value: 'content_creator', label: 'Content Creator' },
  { value: 'manufacturer', label: 'Manufacturer / Supplier' },
  { value: 'installer', label: 'Independent Installer' },
  { value: 'other', label: 'Other' }
];

export const WizardStepIdentity = ({ data, onChange }: WizardStepIdentityProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Business Identity</h2>
          <p className="text-sm text-muted-foreground">Tell us about your business</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="business_name">Business Name</Label>
          <Input
            id="business_name"
            placeholder="WePrintWraps.com"
            value={data.business_name}
            onChange={(e) => onChange('business_name', e.target.value)}
            className="bg-background/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="business_category">Business Category</Label>
          <Select value={data.business_category} onValueChange={(v) => onChange('business_category', v)}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="Select your business type" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline">Describe Your Business</Label>
          <Textarea
            id="tagline"
            placeholder="We print high-quality commercial and custom wraps fast for wrap professionals across the USA."
            value={data.tagline}
            onChange={(e) => onChange('tagline', e.target.value)}
            rows={3}
            className="bg-background/50 resize-none"
          />
          <p className="text-xs text-muted-foreground">One sentence that captures what you do</p>
        </div>
      </div>
    </div>
  );
};
