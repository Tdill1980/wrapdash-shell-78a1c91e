import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, Upload, Image, Video, Layers, Download, 
  RefreshCw, CheckCircle, Clock, AlertCircle, Zap,
  Target, MessageSquare, TrendingUp, Award, Timer
} from "lucide-react";
import { lovableFunctions } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AD_ANGLES = [
  { id: 'problem_solution', name: 'Problem → Solution', icon: Target, description: 'Address pain points, offer the fix' },
  { id: 'social_proof', name: 'Social Proof', icon: Award, description: 'Leverage reviews, testimonials, numbers' },
  { id: 'urgency', name: 'Urgency / Scarcity', icon: Timer, description: 'Limited time, limited stock, FOMO' },
  { id: 'transformation', name: 'Transformation', icon: TrendingUp, description: 'Before/after, the journey, results' },
  { id: 'authority', name: 'Authority / Quality', icon: Award, description: 'Premium, pro-grade, trusted' },
];

const AD_FORMATS = [
  { id: 'static', name: 'Static Image', icon: Image, sizes: ['1080x1080', '1080x1350', '1200x628'] },
  { id: 'carousel', name: 'Carousel', icon: Layers, sizes: ['1080x1080'] },
  { id: 'reel', name: 'Reel / Video', icon: Video, sizes: ['1080x1920'] },
];

interface RenderStatus {
  variation_index: number;
  render_id: string;
  status: 'pending' | 'completed' | 'failed';
  hook: string;
  cta: string;
  image_url?: string;
}

export default function MetaAdFactory() {
  const [activeTab, setActiveTab] = useState('create');
  const [format, setFormat] = useState('static');
  const [angle, setAngle] = useState('problem_solution');
  const [numVariations, setNumVariations] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [renders, setRenders] = useState<RenderStatus[]>([]);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  // Form state
  const [productName, setProductName] = useState('');
  const [productBenefit, setProductBenefit] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [templateId, setTemplateId] = useState('');

  // Custom variations
  const [customHooks, setCustomHooks] = useState('');

  const handleGenerate = async () => {
    if (!templateId) {
      toast.error('Please enter a Bannerbear template ID');
      return;
    }

    setIsGenerating(true);
    setRenders([]);

    try {
      // Parse custom hooks if provided
      let variations = undefined;
      if (customHooks.trim()) {
        const hooks = customHooks.split('\n').filter(h => h.trim());
        variations = hooks.map(hook => ({
          hook: hook.trim(),
          cta: 'Shop Now', // Default CTA
        }));
      }

      const { data, error } = await lovableFunctions.functions.invoke('create-meta-ad', {
        body: {
          action: 'bulk_create',
          template_id: templateId,
          format,
          hero_image_url: heroImageUrl || undefined,
          logo_url: logoUrl || undefined,
          product_name: productName || undefined,
          product_benefit: productBenefit || undefined,
          target_audience: targetAudience || undefined,
          ad_angle: angle,
          num_variations: numVariations,
          variations,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setRenders(data.renders);
      toast.success(`Created ${data.renders.length} ad variations!`);

      // Start polling for completion
      const interval = setInterval(() => pollStatus(data.render_ids), 3000);
      setPollInterval(interval);

    } catch (err: any) {
      console.error('Generate error:', err);
      toast.error(err.message || 'Failed to generate ads');
    } finally {
      setIsGenerating(false);
    }
  };

  const pollStatus = async (renderIds: string[]) => {
    try {
      const { data, error } = await lovableFunctions.functions.invoke('create-meta-ad', {
        body: {
          action: 'get_status',
          render_ids: renderIds,
        },
      });

      if (error || !data.success) return;

      // Update renders with new status
      setRenders(prev => prev.map(r => {
        const updated = data.renders.find((u: any) => u.id === r.render_id);
        if (updated) {
          return {
            ...r,
            status: updated.status,
            image_url: updated.image_url,
          };
        }
        return r;
      }));

      // Check if all done
      const allDone = data.renders.every((r: any) => r.status === 'completed' || r.status === 'failed');
      if (allDone && pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
        toast.success('All ads ready!');
      }

    } catch (err) {
      console.error('Poll error:', err);
    }
  };

  const downloadAll = () => {
    const completed = renders.filter(r => r.status === 'completed' && r.image_url);
    completed.forEach((r, i) => {
      const link = document.createElement('a');
      link.href = r.image_url!;
      link.download = `meta-ad-${i + 1}.png`;
      link.click();
    });
    toast.success(`Downloading ${completed.length} ads`);
  };

  const completedCount = renders.filter(r => r.status === 'completed').length;
  const progress = renders.length > 0 ? (completedCount / renders.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Zap className="h-8 w-8 text-yellow-400" />
              Meta Ad Factory
            </h1>
            <p className="text-gray-400 mt-1">Bulk create high-converting Facebook & Instagram ads</p>
          </div>
          {renders.length > 0 && completedCount > 0 && (
            <Button onClick={downloadAll} className="gap-2">
              <Download className="h-4 w-4" />
              Download All ({completedCount})
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-800/50">
            <TabsTrigger value="create">Create Ads</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Configuration */}
              <div className="lg:col-span-2 space-y-6">
                {/* Ad Format */}
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Image className="h-5 w-5 text-blue-400" />
                      Ad Format
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {AD_FORMATS.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setFormat(f.id)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            format === f.id 
                              ? 'border-blue-500 bg-blue-500/10' 
                              : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                          }`}
                        >
                          <f.icon className={`h-8 w-8 mx-auto mb-2 ${format === f.id ? 'text-blue-400' : 'text-gray-400'}`} />
                          <div className="text-sm font-medium text-white">{f.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{f.sizes.join(', ')}</div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Ad Angle */}
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-purple-400" />
                      Ad Angle / Framework
                    </CardTitle>
                    <CardDescription>Choose the psychological approach for your ad copy</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {AD_ANGLES.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => setAngle(a.id)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            angle === a.id 
                              ? 'border-purple-500 bg-purple-500/10' 
                              : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <a.icon className={`h-4 w-4 ${angle === a.id ? 'text-purple-400' : 'text-gray-400'}`} />
                            <span className="font-medium text-white text-sm">{a.name}</span>
                          </div>
                          <p className="text-xs text-gray-500">{a.description}</p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Product Info */}
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Product Details</CardTitle>
                    <CardDescription>Help AI write better hooks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Product Name</Label>
                        <Input 
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                          placeholder="e.g., Premium Vinyl Wrap"
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Target Audience</Label>
                        <Input 
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          placeholder="e.g., Car enthusiasts, wrap shops"
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-300">Key Benefit / Pain Point</Label>
                      <Input 
                        value={productBenefit}
                        onChange={(e) => setProductBenefit(e.target.value)}
                        placeholder="e.g., fading paint, expensive repaints, dull vehicles"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Custom Hooks */}
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Custom Hooks (Optional)</CardTitle>
                    <CardDescription>Enter your own hooks, one per line. Leave blank for AI generation.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      value={customHooks}
                      onChange={(e) => setCustomHooks(e.target.value)}
                      placeholder="Stop settling for boring paint&#10;Your car deserves better&#10;The secret wrap shops don't want you to know"
                      className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Right: Assets & Generate */}
              <div className="space-y-6">
                {/* Template ID */}
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Bannerbear Template</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input 
                      value={templateId}
                      onChange={(e) => setTemplateId(e.target.value)}
                      placeholder="Template ID from Bannerbear"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Create templates at bannerbear.com with layers named: hook_text, cta_text, hero_image, logo
                    </p>
                  </CardContent>
                </Card>

                {/* Assets */}
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Assets</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-gray-400 text-xs">Hero Image URL</Label>
                      <Input 
                        value={heroImageUrl}
                        onChange={(e) => setHeroImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="bg-gray-800 border-gray-700 text-white text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400 text-xs">Logo URL</Label>
                      <Input 
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://..."
                        className="bg-gray-800 border-gray-700 text-white text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Variations */}
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Number of Variations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={String(numVariations)} onValueChange={(v) => setNumVariations(Number(v))}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 variations</SelectItem>
                        <SelectItem value="5">5 variations</SelectItem>
                        <SelectItem value="10">10 variations</SelectItem>
                        <SelectItem value="20">20 variations</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Generate Button */}
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !templateId}
                  className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generate {numVariations} Ads
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Results */}
            {renders.length > 0 && (
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Generated Ads</CardTitle>
                    <Badge variant={completedCount === renders.length ? "default" : "secondary"}>
                      {completedCount} / {renders.length} ready
                    </Badge>
                  </div>
                  <Progress value={progress} className="mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {renders.map((render, i) => (
                      <div 
                        key={render.render_id}
                        className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700"
                      >
                        <div className="aspect-square bg-gray-900 flex items-center justify-center">
                          {render.status === 'completed' && render.image_url ? (
                            <img 
                              src={render.image_url} 
                              alt={`Ad ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : render.status === 'failed' ? (
                            <AlertCircle className="h-8 w-8 text-red-400" />
                          ) : (
                            <Clock className="h-8 w-8 text-gray-500 animate-pulse" />
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-xs text-white truncate" title={render.hook}>
                            {render.hook}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <Badge variant="outline" className="text-[10px]">{render.cta}</Badge>
                            {render.status === 'completed' ? (
                              <CheckCircle className="h-3 w-3 text-green-400" />
                            ) : (
                              <Clock className="h-3 w-3 text-gray-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="templates">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-12 text-center">
                <Layers className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Bannerbear Templates</h3>
                <p className="text-gray-400 mb-4">Create templates at bannerbear.com with these layer names:</p>
                <div className="bg-gray-800 rounded-lg p-4 text-left max-w-md mx-auto">
                  <code className="text-sm text-green-400">
                    hook_text - Main headline<br/>
                    body_text - Supporting copy<br/>
                    cta_text - Call to action<br/>
                    offer_text - Discount/offer<br/>
                    hero_image - Product/lifestyle image<br/>
                    logo - Your brand logo
                  </code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-12 text-center text-gray-400">
                Coming soon - view past ad generation batches
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
