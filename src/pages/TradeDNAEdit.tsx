import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { MobileDrawer } from '@/components/MobileDrawer';
import { useTradeDNA, TradeDNAProfile } from '@/hooks/useTradeDNA';
import { ArrowLeft, Save, Download, Sparkles, RefreshCw } from 'lucide-react';

const TradeDNAEdit = () => {
  const navigate = useNavigate();
  const { tradeDNA, isLoading, isSaving, saveTradeDNA, exportTradeDNA, analyzeBrandVoice } = useTradeDNA();
  const [profile, setProfile] = useState<TradeDNAProfile>({});
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  useEffect(() => {
    if (tradeDNA?.tradedna_profile) {
      setProfile(tradeDNA.tradedna_profile);
    }
  }, [tradeDNA]);

  const handleSave = async () => {
    await saveTradeDNA({
      tradedna_profile: profile
    });
  };

  const handleReanalyze = async () => {
    if (tradeDNA?.scraped_content) {
      setIsReanalyzing(true);
      await analyzeBrandVoice(tradeDNA.scraped_content as any);
      setIsReanalyzing(false);
    }
  };

  const updateField = (path: string[], value: any) => {
    setProfile(prev => {
      const newProfile = { ...prev };
      let current: any = newProfile;
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newProfile;
    });
  };

  const updateArrayField = (path: string[], value: string) => {
    const items = value.split('\n').map(s => s.trim()).filter(Boolean);
    updateField(path, items);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden lg:block w-[260px] border-r border-border">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <div className="lg:hidden">
          <MobileDrawer>
            <Sidebar onMobileClose={() => {}} />
          </MobileDrawer>
        </div>
        <TopBar />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/tradedna')}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-primary" />
                    Edit TradeDNA Profile
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {tradeDNA?.business_name || 'Your Brand'} • Version {tradeDNA?.version || 1}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleReanalyze} disabled={isReanalyzing}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isReanalyzing ? 'animate-spin' : ''}`} />
                  Re-analyze
                </Button>
                <Button variant="outline" onClick={exportTradeDNA}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>

            <div className="grid gap-6">
              {/* Tone & Persona */}
              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Tone & Persona</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Primary Tone</Label>
                    <Input
                      value={profile.tone?.primary || ''}
                      onChange={(e) => updateField(['tone', 'primary'], e.target.value)}
                      placeholder="Bold, friendly, expert"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Energy Level</Label>
                    <Input
                      value={profile.tone?.energy_level || ''}
                      onChange={(e) => updateField(['tone', 'energy_level'], e.target.value)}
                      placeholder="High, Medium, Low"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Persona Description</Label>
                    <Textarea
                      value={profile.persona || ''}
                      onChange={(e) => updateField(['persona'], e.target.value)}
                      placeholder="Describe your brand's persona..."
                      rows={2}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Brand Voice Summary</Label>
                    <Textarea
                      value={profile.brand_voice_summary || ''}
                      onChange={(e) => updateField(['brand_voice_summary'], e.target.value)}
                      placeholder="A one-paragraph summary of your brand voice..."
                      rows={3}
                      className="bg-background/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Vocabulary */}
              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Vocabulary</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Signature Phrases (one per line)</Label>
                    <Textarea
                      value={profile.vocabulary?.signature_phrases?.join('\n') || ''}
                      onChange={(e) => updateArrayField(['vocabulary', 'signature_phrases'], e.target.value)}
                      placeholder="We've got you&#10;Order your wrap today&#10;Printed fast, shipped fast"
                      rows={4}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Common Words (one per line)</Label>
                    <Textarea
                      value={profile.vocabulary?.common_words?.join('\n') || ''}
                      onChange={(e) => updateArrayField(['vocabulary', 'common_words'], e.target.value)}
                      placeholder="print&#10;wrap&#10;quality"
                      rows={3}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Words to Avoid (one per line)</Label>
                    <Textarea
                      value={profile.vocabulary?.words_to_avoid?.join('\n') || ''}
                      onChange={(e) => updateArrayField(['vocabulary', 'words_to_avoid'], e.target.value)}
                      placeholder="cheap&#10;slow&#10;discount"
                      rows={3}
                      className="bg-background/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sales Style */}
              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Sales Style</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Sales Approach</Label>
                    <Input
                      value={profile.sales_style?.approach || ''}
                      onChange={(e) => updateField(['sales_style', 'approach'], e.target.value)}
                      placeholder="Confidence-driven, value-forward"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pressure Level</Label>
                    <Input
                      value={profile.sales_style?.pressure || ''}
                      onChange={(e) => updateField(['sales_style', 'pressure'], e.target.value)}
                      placeholder="Low-pressure but persuasive"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA Style</Label>
                    <Input
                      value={profile.sales_style?.cta_style || ''}
                      onChange={(e) => updateField(['sales_style', 'cta_style'], e.target.value)}
                      placeholder="Direct action CTAs"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Closing Flavor</Label>
                    <Input
                      value={profile.sales_style?.closing_flavor || ''}
                      onChange={(e) => updateField(['sales_style', 'closing_flavor'], e.target.value)}
                      placeholder="Reassuring and trust-building"
                      className="bg-background/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Customer Profile */}
              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Customer Profile</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Target Demographics</Label>
                    <Input
                      value={profile.customer_profile?.demographics || ''}
                      onChange={(e) => updateField(['customer_profile', 'demographics'], e.target.value)}
                      placeholder="Wrap installers, shop owners, resellers"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Pain Points (one per line)</Label>
                      <Textarea
                        value={profile.customer_profile?.pain_points?.join('\n') || ''}
                        onChange={(e) => updateArrayField(['customer_profile', 'pain_points'], e.target.value)}
                        placeholder="Slow printers&#10;Unreliable vendors"
                        rows={3}
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Desires (one per line)</Label>
                      <Textarea
                        value={profile.customer_profile?.desires?.join('\n') || ''}
                        onChange={(e) => updateArrayField(['customer_profile', 'desires'], e.target.value)}
                        placeholder="Fast turnaround&#10;Consistent quality"
                        rows={3}
                        className="bg-background/50"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Things to Avoid */}
              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Things to Avoid</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Do Not Do (one per line)</Label>
                    <Textarea
                      value={profile.do_not_do?.join('\n') || ''}
                      onChange={(e) => updateArrayField(['do_not_do'], e.target.value)}
                      placeholder="Do not sound generic&#10;Do not use corporate jargon"
                      rows={4}
                      className="bg-background/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Brand Values */}
              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Brand Values</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Core Values (one per line)</Label>
                    <Textarea
                      value={profile.brand_values?.join('\n') || ''}
                      onChange={(e) => updateArrayField(['brand_values'], e.target.value)}
                      placeholder="Speed&#10;Quality&#10;Reliability"
                      rows={4}
                      className="bg-background/50"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TradeDNAEdit;
