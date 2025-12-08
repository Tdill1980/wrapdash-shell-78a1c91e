import { TradeDNAProfile } from '@/hooks/useTradeDNA';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, MessageSquare, Users, Zap, AlertTriangle, Quote, Mail, MessageCircle, FileText, Settings } from 'lucide-react';

interface WizardStepReviewProps {
  profile: TradeDNAProfile | undefined;
}

export const WizardStepReview = ({ profile }: WizardStepReviewProps) => {
  if (!profile) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No TradeDNA profile generated yet</p>
        <p className="text-sm text-muted-foreground mt-2">Go back and run the AI analysis</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Your TradeDNA Profile</h2>
          <p className="text-sm text-muted-foreground">7-Stage Brand Voice Extraction Complete</p>
        </div>
      </div>

      {/* Brand Voice Summary */}
      {profile.brand_voice_summary && (
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Quote className="w-8 h-8 text-primary flex-shrink-0" />
              <p className="text-foreground italic">{profile.brand_voice_summary}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Tone & Persona */}
        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Tone & Persona
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.tone?.primary && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Primary Tone</p>
                <Badge variant="secondary">{profile.tone.primary}</Badge>
              </div>
            )}
            {profile.tone?.energy_level && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Energy Level</p>
                <Badge variant="outline">{profile.tone.energy_level}</Badge>
              </div>
            )}
            {profile.persona && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Persona</p>
                <p className="text-sm">{profile.persona}</p>
              </div>
            )}
            {profile.brand_values && profile.brand_values.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Brand Values</p>
                <div className="flex flex-wrap gap-1">
                  {profile.brand_values.map((v, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vocabulary */}
        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Vocabulary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.vocabulary?.signature_phrases && profile.vocabulary.signature_phrases.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Signature Phrases</p>
                <div className="space-y-1">
                  {profile.vocabulary.signature_phrases.slice(0, 3).map((p, i) => (
                    <p key={i} className="text-sm italic text-primary">"{p}"</p>
                  ))}
                </div>
              </div>
            )}
            {profile.vocabulary?.words_to_avoid && profile.vocabulary.words_to_avoid.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Words to Avoid</p>
                <div className="flex flex-wrap gap-1">
                  {profile.vocabulary.words_to_avoid.map((w, i) => (
                    <Badge key={i} variant="destructive" className="text-xs">{w}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sentence Style - NEW */}
        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Sentence Style
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.sentence_style?.length && (
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">Length:</p>
                <Badge variant="outline" className="text-xs">{profile.sentence_style.length}</Badge>
              </div>
            )}
            {profile.sentence_style?.cadence && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Cadence</p>
                <p className="text-sm">{profile.sentence_style.cadence}</p>
              </div>
            )}
            {profile.sentence_style?.complexity && (
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">Complexity:</p>
                <Badge variant="outline" className="text-xs">{profile.sentence_style.complexity}</Badge>
              </div>
            )}
            {profile.sentence_style?.examples && profile.sentence_style.examples.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Example Sentences</p>
                <div className="space-y-1">
                  {profile.sentence_style.examples.slice(0, 2).map((ex, i) => (
                    <p key={i} className="text-xs italic text-muted-foreground">"{ex}"</p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Profile */}
        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Customer Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.customer_profile?.demographics && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Target Demographics</p>
                <p className="text-sm">{profile.customer_profile.demographics}</p>
              </div>
            )}
            {profile.customer_profile?.pain_points && profile.customer_profile.pain_points.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Pain Points</p>
                <ul className="text-sm list-disc list-inside space-y-0.5">
                  {profile.customer_profile.pain_points.slice(0, 3).map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
            {profile.customer_profile?.emotional_triggers && profile.customer_profile.emotional_triggers.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Emotional Triggers</p>
                <div className="flex flex-wrap gap-1">
                  {profile.customer_profile.emotional_triggers.map((t, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales Style */}
        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Sales Style
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.sales_style?.approach && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Approach</p>
                <p className="text-sm">{profile.sales_style.approach}</p>
              </div>
            )}
            {profile.sales_style?.cta_style && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">CTA Style</p>
                <p className="text-sm">{profile.sales_style.cta_style}</p>
              </div>
            )}
            <div className="flex gap-2">
              {profile.sales_style?.pressure && (
                <Badge variant="outline" className="text-xs">Pressure: {profile.sales_style.pressure}</Badge>
              )}
              {profile.sales_style?.confidence && (
                <Badge variant="outline" className="text-xs">Confidence: {profile.sales_style.confidence}</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Communication Rules - NEW */}
        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              Communication Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.communication_rules?.email && (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Mail className="w-3 h-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Email</p>
                </div>
                <p className="text-xs">Greeting: {profile.communication_rules.email.greeting}</p>
                <p className="text-xs">Sign-off: {profile.communication_rules.email.sign_off}</p>
              </div>
            )}
            {profile.communication_rules?.dm && (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <MessageCircle className="w-3 h-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">DM</p>
                </div>
                <p className="text-xs">Emoji: {profile.communication_rules.dm.emoji_usage}</p>
                <p className="text-xs">Casual: {profile.communication_rules.dm.casual_level}</p>
              </div>
            )}
            {profile.communication_rules?.quote && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Quote Style</p>
                <p className="text-xs italic">"{profile.communication_rules.quote.opening}"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Do Not Do */}
      {profile.do_not_do && profile.do_not_do.length > 0 && (
        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Things to Avoid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              {profile.do_not_do.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
