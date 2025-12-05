import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Copy, RefreshCw, Mail, Wand2 } from 'lucide-react';
import { useAIEmailGenerator, EmailTone, EmailType } from '@/hooks/useAIEmailGenerator';
import { toast } from 'sonner';

export function AIEmailGenerator() {
  const { generateEmail, isGenerating, generatedEmail, clearGenerated } = useAIEmailGenerator();
  
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [product, setProduct] = useState('');
  const [price, setPrice] = useState('');
  const [tone, setTone] = useState<EmailTone>('installer');
  const [emailType, setEmailType] = useState<EmailType>('quote_initial');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(0);

  const handleGenerate = async () => {
    if (!customerName.trim()) {
      toast.error('Please enter a customer name');
      return;
    }

    await generateEmail({
      customerName,
      customerEmail: customerEmail || undefined,
      companyName: companyName || undefined,
      vehicle: vehicleYear || vehicleMake || vehicleModel ? {
        year: vehicleYear || undefined,
        make: vehicleMake || undefined,
        model: vehicleModel || undefined
      } : undefined,
      product: product || undefined,
      price: price ? parseFloat(price) : undefined,
      tone,
      emailType,
      customPrompt: emailType === 'custom' ? customPrompt : undefined
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const copyFullEmail = () => {
    if (!generatedEmail) return;
    const fullEmail = `Subject: ${generatedEmail.subjectVariants[selectedSubject]}\n\n${generatedEmail.bodyHtml.replace(/<[^>]*>/g, '')}`;
    navigator.clipboard.writeText(fullEmail);
    toast.success('Full email copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Email Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input 
                placeholder="John Smith"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Customer Email</Label>
              <Input 
                type="email"
                placeholder="john@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input 
              placeholder="ABC Auto Shop"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          {/* Vehicle Info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Vehicle Year</Label>
              <Input 
                placeholder="2024"
                value={vehicleYear}
                onChange={(e) => setVehicleYear(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Make</Label>
              <Input 
                placeholder="Ford"
                value={vehicleMake}
                onChange={(e) => setVehicleMake(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Model</Label>
              <Input 
                placeholder="F-150"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
              />
            </div>
          </div>

          {/* Product & Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product/Service</Label>
              <Input 
                placeholder="Full Color Change Wrap"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Quote Amount</Label>
              <Input 
                type="number"
                placeholder="3500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Tone & Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Writing Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as EmailTone)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="installer">
                    <span className="flex items-center gap-2">
                      🔧 Installer - Friendly & Professional
                    </span>
                  </SelectItem>
                  <SelectItem value="luxury">
                    <span className="flex items-center gap-2">
                      ✨ Luxury - Elegant & Premium
                    </span>
                  </SelectItem>
                  <SelectItem value="hype">
                    <span className="flex items-center gap-2">
                      🔥 Hype - Energetic & Exciting
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email Type</Label>
              <Select value={emailType} onValueChange={(v) => setEmailType(v as EmailType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quote_initial">Initial Quote Email</SelectItem>
                  <SelectItem value="quote_followup">Quote Follow-up</SelectItem>
                  <SelectItem value="proof_ready">Proof Ready</SelectItem>
                  <SelectItem value="order_confirmation">Order Confirmation</SelectItem>
                  <SelectItem value="shipping_notification">Shipping Notification</SelectItem>
                  <SelectItem value="custom">Custom Prompt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Prompt */}
          {emailType === 'custom' && (
            <div className="space-y-2">
              <Label>Custom Prompt</Label>
              <Textarea 
                placeholder="Describe what kind of email you want to generate..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] hover:opacity-90"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating with AI...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Email Content
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Content */}
      {generatedEmail && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5 text-green-500" />
                Generated Email
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyFullEmail}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy All
                </Button>
                <Button variant="outline" size="sm" onClick={clearGenerated}>
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Subject Line Variants */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Subject Lines (A/B Test)</Label>
              <div className="space-y-2">
                {generatedEmail.subjectVariants.map((subject, i) => (
                  <div 
                    key={i}
                    onClick={() => setSelectedSubject(i)}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSubject === i 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={selectedSubject === i ? 'default' : 'secondary'}>
                        {String.fromCharCode(65 + i)}
                      </Badge>
                      <span className="text-sm">{subject}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(subject, 'Subject line');
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Text */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preview Text</Label>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                <span className="text-sm text-muted-foreground">{generatedEmail.previewText}</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(generatedEmail.previewText, 'Preview text')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Email Body */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email Body</Label>
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="html">HTML</TabsTrigger>
                </TabsList>
                <TabsContent value="preview" className="mt-4">
                  <div 
                    className="p-4 rounded-lg border border-border bg-background prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: generatedEmail.bodyHtmlPreview }}
                  />
                </TabsContent>
                <TabsContent value="html" className="mt-4">
                  <div className="relative">
                    <pre className="p-4 rounded-lg border border-border bg-muted/30 text-xs overflow-x-auto">
                      {generatedEmail.bodyHtml}
                    </pre>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(generatedEmail.bodyHtml, 'HTML')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* CTA Button */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Call-to-Action Button</Label>
              <div className="flex items-center gap-4">
                <Button className="bg-gradient-to-r from-[#405DE6] to-[#E1306C]">
                  {generatedEmail.ctaText}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(generatedEmail.ctaText, 'CTA text')}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
