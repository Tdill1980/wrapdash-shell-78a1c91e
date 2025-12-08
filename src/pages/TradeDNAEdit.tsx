import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/layouts/MainLayout';
import { useTradeDNA, TradeDNAProfile } from '@/hooks/useTradeDNA';
import { ArrowLeft, Save, Download, Sparkles, RefreshCw, Mail, MessageCircle, FileText, Shield } from 'lucide-react';

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
      <MainLayout userName="Admin">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout userName="Admin">
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
              <div className="space-y-2">
                <Label>Formality</Label>
                <Input
                  value={profile.tone?.formality || ''}
                  onChange={(e) => updateField(['tone', 'formality'], e.target.value)}
                  placeholder="formal, casual-professional, casual"
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

          {/* Sentence Style - NEW */}
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Sentence Style
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Length</Label>
                <Input
                  value={profile.sentence_style?.length || ''}
                  onChange={(e) => updateField(['sentence_style', 'length'], e.target.value)}
                  placeholder="short, medium, long"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Complexity</Label>
                <Input
                  value={profile.sentence_style?.complexity || ''}
                  onChange={(e) => updateField(['sentence_style', 'complexity'], e.target.value)}
                  placeholder="simple, moderate, complex"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Cadence</Label>
                <Input
                  value={profile.sentence_style?.cadence || ''}
                  onChange={(e) => updateField(['sentence_style', 'cadence'], e.target.value)}
                  placeholder="Direct, punchy, step-by-step"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label>Example Sentences (one per line)</Label>
                <Textarea
                  value={profile.sentence_style?.examples?.join('\n') || ''}
                  onChange={(e) => updateArrayField(['sentence_style', 'examples'], e.target.value)}
                  placeholder="We print high-quality wraps fast.&#10;Send your file—we'll handle the rest."
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
                  placeholder="low, medium, high"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Confidence Level</Label>
                <Input
                  value={profile.sales_style?.confidence || ''}
                  onChange={(e) => updateField(['sales_style', 'confidence'], e.target.value)}
                  placeholder="low, medium, high"
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
              <div className="space-y-2 md:col-span-2">
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
                <div className="space-y-2">
                  <Label>Emotional Triggers (one per line)</Label>
                  <Textarea
                    value={profile.customer_profile?.emotional_triggers?.join('\n') || ''}
                    onChange={(e) => updateArrayField(['customer_profile', 'emotional_triggers'], e.target.value)}
                    placeholder="Trust&#10;Speed&#10;Industry credibility"
                    rows={3}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Objection Patterns (one per line)</Label>
                  <Textarea
                    value={profile.customer_profile?.objection_patterns?.join('\n') || ''}
                    onChange={(e) => updateArrayField(['customer_profile', 'objection_patterns'], e.target.value)}
                    placeholder="Too expensive&#10;Takes too long"
                    rows={3}
                    className="bg-background/50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Communication Rules - NEW */}
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Communication Rules by Channel
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              {/* Email Rules */}
              <div className="space-y-3 p-4 rounded-lg bg-background/30 border">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="w-4 h-4" />
                  Email Communication
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Greeting Style</Label>
                    <Input
                      value={profile.communication_rules?.email?.greeting || ''}
                      onChange={(e) => updateField(['communication_rules', 'email', 'greeting'], e.target.value)}
                      placeholder="Hey [Name]!"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Sign-off</Label>
                    <Input
                      value={profile.communication_rules?.email?.sign_off || ''}
                      onChange={(e) => updateField(['communication_rules', 'email', 'sign_off'], e.target.value)}
                      placeholder="Cheers, The Team"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Max Length (words)</Label>
                    <Input
                      type="number"
                      value={profile.communication_rules?.email?.max_length || ''}
                      onChange={(e) => updateField(['communication_rules', 'email', 'max_length'], parseInt(e.target.value) || 150)}
                      placeholder="150"
                      className="bg-background/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Email Rules (one per line)</Label>
                  <Textarea
                    value={profile.communication_rules?.email?.rules?.join('\n') || ''}
                    onChange={(e) => updateArrayField(['communication_rules', 'email', 'rules'], e.target.value)}
                    placeholder="Always start with customer name&#10;Keep paragraphs short&#10;End with clear CTA"
                    rows={2}
                    className="bg-background/50"
                  />
                </div>
              </div>

              {/* DM Rules */}
              <div className="space-y-3 p-4 rounded-lg bg-background/30 border">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageCircle className="w-4 h-4" />
                  DM / Chat Communication
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Response Time Promise</Label>
                    <Input
                      value={profile.communication_rules?.dm?.response_time_promise || ''}
                      onChange={(e) => updateField(['communication_rules', 'dm', 'response_time_promise'], e.target.value)}
                      placeholder="Within 1 hour"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Emoji Usage</Label>
                    <Input
                      value={profile.communication_rules?.dm?.emoji_usage || ''}
                      onChange={(e) => updateField(['communication_rules', 'dm', 'emoji_usage'], e.target.value)}
                      placeholder="minimal, moderate, heavy"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Casual Level</Label>
                    <Input
                      value={profile.communication_rules?.dm?.casual_level || ''}
                      onChange={(e) => updateField(['communication_rules', 'dm', 'casual_level'], e.target.value)}
                      placeholder="low, medium, high"
                      className="bg-background/50"
                    />
                  </div>
                </div>
              </div>

              {/* Quote Rules */}
              <div className="space-y-3 p-4 rounded-lg bg-background/30 border">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="w-4 h-4" />
                  Quote Communication
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Quote Opening Line</Label>
                    <Input
                      value={profile.communication_rules?.quote?.opening || ''}
                      onChange={(e) => updateField(['communication_rules', 'quote', 'opening'], e.target.value)}
                      placeholder="Thanks for reaching out! Here's your quote..."
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Quote Closing Line</Label>
                    <Input
                      value={profile.communication_rules?.quote?.closing || ''}
                      onChange={(e) => updateField(['communication_rules', 'quote', 'closing'], e.target.value)}
                      placeholder="Ready when you are—let's make it happen!"
                      className="bg-background/50"
                    />
                  </div>
                </div>
              </div>

              {/* ApproveFlow Rules */}
              <div className="space-y-3 p-4 rounded-lg bg-background/30 border">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Shield className="w-4 h-4" />
                  ApproveFlow Communication
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Proof Introduction</Label>
                    <Input
                      value={profile.communication_rules?.approveflow?.proof_intro || ''}
                      onChange={(e) => updateField(['communication_rules', 'approveflow', 'proof_intro'], e.target.value)}
                      placeholder="Your design proof is ready for review!"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Revision Response Style</Label>
                    <Input
                      value={profile.communication_rules?.approveflow?.revision_response || ''}
                      onChange={(e) => updateField(['communication_rules', 'approveflow', 'revision_response'], e.target.value)}
                      placeholder="No problem! We'll get that updated for you."
                      className="bg-background/50"
                    />
                  </div>
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
                  placeholder="Do not sound generic&#10;Do not use corporate jargon&#10;Do not over-apologize"
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
                  placeholder="Speed&#10;Quality&#10;Reliability&#10;Honesty&#10;Industry expertise"
                  rows={4}
                  className="bg-background/50"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default TradeDNAEdit;
