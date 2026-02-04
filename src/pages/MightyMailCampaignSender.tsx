import { useState, useMemo } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase, lovableFunctions } from "@/integrations/supabase/client";
import { Send, Eye, Loader2, CheckCircle, Sparkles, Calendar, AlertTriangle, ShieldCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { EmailCalendar } from "@/components/email/EmailCalendar";
import { 
  FRANCHISES, 
  FRANCHISE_OPTIONS,
  generateCampaignName,
  generateSubject,
  getRecommendedFranchise,
  getCurrentWeekSlot,
  type FranchiseId,
  type EmailContent
} from "@/lib/email-content/franchises";

// Import email content
import declarationEmailHtml from "@/lib/email-templates/ink-edge-declaration.html?raw";
import canonicalTemplateHtml from "@/lib/email-templates/canonical-template.html?raw";
import { testLabColorSheen } from "@/lib/email-content/month-1/email-2-testlab-color-sheen";
import { onTheRoadChelsea } from "@/lib/email-content/month-1/email-3-execution-chelsea";
import { wotwFirst } from "@/lib/email-content/month-1/email-4-wotw-first";

// Pre-built content map
const PREBUILT_CONTENT: Record<string, EmailContent> = {
  'test_lab_color_sheen': testLabColorSheen,
  'on_the_road_chelsea': onTheRoadChelsea,
  'wotw_first': wotwFirst,
};

// Dual logo URLs
const WPW_LOGO_URL = 'https://wzwqhfbmymrengjqikjl.supabase.co/storage/v1/object/public/media-library/email-images/wpw-logo.png';
const INK_EDGE_LOGO_URL = 'https://wzwqhfbmymrengjqikjl.supabase.co/storage/v1/object/public/media-library/email-images/ink-edge-logo.png';

// Pre-send checklist items
const PRE_SEND_CHECKLIST = [
  { id: 'wpw_logo', label: 'WPW logo visible at top', required: true },
  { id: 'ink_edge_logo', label: 'Ink & Edge logo visible (editorial)', required: true },
  { id: 'hero_image', label: 'Real shop/vehicle photo before text', required: true },
  { id: 'content_proves', label: 'Content visually proves what copy says', required: true },
  { id: 'footer_branded', label: 'Footer clearly branded WPW', required: true },
];

function renderTemplate(template: string, content: EmailContent): string {
  return template
    .replace(/\{\{wpw_logo_url\}\}/g, WPW_LOGO_URL)
    .replace(/\{\{ink_edge_logo_url\}\}/g, INK_EDGE_LOGO_URL)
    .replace(/\{\{hero_image_url\}\}/g, content.heroImageUrl)
    .replace(/\{\{hero_image_alt\}\}/g, content.heroImageAlt)
    .replace(/\{\{headline\}\}/g, content.headline)
    .replace(/\{\{subheadline\}\}/g, content.subheadline)
    .replace(/\{\{opening_copy\}\}/g, content.openingCopy)
    .replace(/\{\{section_1_title\}\}/g, content.section1Title)
    .replace(/\{\{section_1_copy\}\}/g, content.section1Copy)
    .replace(/\{\{section_1_image_url\}\}/g, content.section1ImageUrl || '')
    .replace(/\{\{section_1_image_alt\}\}/g, content.section1ImageAlt || '')
    .replace(/\{\{section_2_title\}\}/g, content.section2Title)
    .replace(/\{\{section_2_copy\}\}/g, content.section2Copy)
    .replace(/\{\{cta_url\}\}/g, content.ctaUrl)
    .replace(/\{\{cta_text\}\}/g, content.ctaText)
    .replace(/\{\{unsubscribe_url\}\}/g, '{{ unsubscribe_url|default:\"#\" }}')
    // Handle optional image section
    .replace(/\{\{#section_1_image_url\}\}[\s\S]*?\{\{\/section_1_image_url\}\}/g, 
      content.section1ImageUrl ? 
        `<tr><td style="padding: 0 0 24px;"><img src="${content.section1ImageUrl}" width="600" style="width: 100%; display: block; max-width: 600px;" alt="${content.section1ImageAlt || ''}" /></td></tr>` 
        : ''
    );
}

const MightyMailCampaignSender = () => {
  const recommendedFranchise = getRecommendedFranchise();
  const currentWeek = getCurrentWeekSlot();

  // State
  const [selectedFranchise, setSelectedFranchise] = useState<FranchiseId>('declaration');
  const [selectedContent, setSelectedContent] = useState<string>('declaration');
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState("Why We Went Quiet (and What We Built Instead)");
  const [previewText, setPreviewText] = useState("We weren't gone — we were building something worth your time.");
  const [campaignName, setCampaignName] = useState("Declaration-InkEdge-Dec24");
  const [segmentId, setSegmentId] = useState("");
  const [listId, setListId] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  // Check if all required checklist items are checked
  const allChecklistPassed = PRE_SEND_CHECKLIST.every(item => checklist[item.id] === true);

  // Get franchise details
  const franchise = FRANCHISES[selectedFranchise];

  // Content options based on franchise
  const contentOptions = useMemo(() => {
    if (selectedFranchise === 'declaration') {
      return [{ id: 'declaration', label: 'Ink & Edge Declaration Email' }];
    }
    if (selectedFranchise === 'test_lab') {
      return [{ id: 'test_lab_color_sheen', label: 'Color & Sheen Under Real Light' }];
    }
    if (selectedFranchise === 'on_the_road') {
      return [{ id: 'on_the_road_chelsea', label: 'Mobile Wrapping in 28°F Weather' }];
    }
    if (selectedFranchise === 'wotw') {
      return [{ id: 'wotw_first', label: 'Matte Military Green F-150' }];
    }
    return [{ id: 'custom', label: 'Custom Content' }];
  }, [selectedFranchise]);

  // Generate email HTML
  const emailHtml = useMemo(() => {
    if (selectedContent === 'declaration') {
      return declarationEmailHtml;
    }
    const content = PREBUILT_CONTENT[selectedContent];
    if (content) {
      return renderTemplate(canonicalTemplateHtml, content);
    }
    return canonicalTemplateHtml;
  }, [selectedContent]);

  // Handle franchise change
  const handleFranchiseChange = (franchiseId: FranchiseId) => {
    setSelectedFranchise(franchiseId);
    const newFranchise = FRANCHISES[franchiseId];
    
    // Auto-populate based on franchise
    if (franchiseId === 'declaration') {
      setSelectedContent('declaration');
      setSubject("Why We Went Quiet (and What We Built Instead)");
      setPreviewText("We weren't gone — we were building something worth your time.");
      setCampaignName("Declaration-InkEdge-Dec24");
    } else {
      // Set first available content for this franchise
      const options = franchiseId === 'test_lab' ? 'test_lab_color_sheen' :
                      franchiseId === 'on_the_road' ? 'on_the_road_chelsea' :
                      franchiseId === 'wotw' ? 'wotw_first' : 'custom';
      setSelectedContent(options);
      
      const content = PREBUILT_CONTENT[options];
      if (content) {
        setSubject(content.subject);
        setPreviewText(content.previewText);
        setTopic(content.topic);
        setCampaignName(generateCampaignName(newFranchise, content.topic, new Date()));
      } else {
        setSubject(generateSubject(newFranchise, 'Topic'));
        setPreviewText('');
        setTopic('');
        setCampaignName(generateCampaignName(newFranchise, 'Topic', new Date()));
      }
    }
    setSent(false);
    setChecklist({}); // Reset checklist on franchise change
  };

  // Handle content change
  const handleContentChange = (contentId: string) => {
    setSelectedContent(contentId);
    const content = PREBUILT_CONTENT[contentId];
    if (content) {
      setSubject(content.subject);
      setPreviewText(content.previewText);
      setTopic(content.topic);
      setCampaignName(generateCampaignName(franchise, content.topic, new Date()));
    }
    setSent(false);
    setChecklist({}); // Reset checklist on content change
  };

  const handleSendCampaign = async () => {
    if (!subject || !campaignName) {
      toast.error("Please fill in campaign name and subject line");
      return;
    }
    
    if (!allChecklistPassed) {
      toast.error("Please complete the pre-send checklist before sending");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await lovableFunctions.functions.invoke('create-klaviyo-campaign', {
        body: {
          campaignType: selectedFranchise === 'declaration' ? 'newsletter' : selectedFranchise,
          name: campaignName,
          subject: subject,
          previewText: previewText,
          html: emailHtml,
          segmentId: segmentId || undefined,
          listId: listId || undefined,
        }
      });

      if (error) throw error;

      if (data.success) {
        setSent(true);
        toast.success(data.message || "Campaign sent successfully!");
      } else {
        throw new Error(data.error || "Failed to send campaign");
      }
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error(error instanceof Error ? error.message : "Failed to send campaign");
    } finally {
      setSending(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                <span className="text-[#FF1493]">MightyMail</span> Campaign Sender
              </h1>
              <p className="text-muted-foreground mt-1">
                Canonical email system • Week {currentWeek} recommended: {recommendedFranchise.name}
              </p>
            </div>
            {sent && (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Campaign Sent!</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Settings Panel */}
            <div className="xl:col-span-1 space-y-6">
              {/* Franchise Selector */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-[#FFD700]" />
                    Select Franchise
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={selectedFranchise} onValueChange={(v) => handleFranchiseChange(v as FranchiseId)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose franchise" />
                    </SelectTrigger>
                    <SelectContent>
                      {FRANCHISE_OPTIONS.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: option.color }} />
                            <span>{option.name}</span>
                            {option.host && (
                              <span className="text-muted-foreground text-xs">— {option.host}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Franchise badge */}
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: franchise.color }} />
                    <span className="font-medium">{franchise.name}</span>
                    <Badge variant="outline" className="text-xs">
                      Week {franchise.weekSlot}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{franchise.description}</p>

                  {/* Content selector */}
                  {contentOptions.length > 0 && selectedFranchise !== 'declaration' && (
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <Label>Pre-built Content</Label>
                      <Select value={selectedContent} onValueChange={handleContentChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select content" />
                        </SelectTrigger>
                        <SelectContent>
                          {contentOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Campaign Settings */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Send className="h-4 w-4 text-[#FF1493]" />
                    Campaign Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaignName">Campaign Name</Label>
                    <Input
                      id="campaignName"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="Internal campaign name"
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: Franchise-Topic-MonthYear
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject Line</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Email subject"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="previewText">Preview Text</Label>
                    <Textarea
                      id="previewText"
                      value={previewText}
                      onChange={(e) => setPreviewText(e.target.value)}
                      placeholder="Text shown in inbox preview"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="segmentId">Klaviyo Segment ID</Label>
                    <Input
                      id="segmentId"
                      value={segmentId}
                      onChange={(e) => setSegmentId(e.target.value)}
                      placeholder="e.g., YpP4RM"
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="listId">Klaviyo List ID (fallback)</Label>
                    <Input
                      id="listId"
                      value={listId}
                      onChange={(e) => setListId(e.target.value)}
                      placeholder="e.g., XyZ123"
                      className="font-mono"
                    />
                  </div>

                  {/* Pre-Send Checklist */}
                  <div className="pt-4 border-t border-border/50 space-y-3">
                    <div className="flex items-center gap-2">
                      {allChecklistPassed ? (
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-[#FFD700]" />
                      )}
                      <Label className="font-medium">Pre-Send Checklist</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      All items must be checked before sending. No logos + no real photos = no send.
                    </p>
                    <div className="space-y-2">
                      {PRE_SEND_CHECKLIST.map((item) => (
                        <div key={item.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={item.id}
                            checked={checklist[item.id] || false}
                            onCheckedChange={(checked) => 
                              setChecklist(prev => ({ ...prev, [item.id]: checked === true }))
                            }
                          />
                          <label
                            htmlFor={item.id}
                            className="text-sm text-muted-foreground cursor-pointer"
                          >
                            {item.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <Button
                      onClick={handleSendCampaign}
                      disabled={sending || sent || !allChecklistPassed}
                      className="w-full bg-gradient-to-r from-[#FF1493] to-[#FF69B4] hover:from-[#FF1493]/90 hover:to-[#FF69B4]/90 disabled:opacity-50"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending to Klaviyo...
                        </>
                      ) : sent ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Campaign Sent
                        </>
                      ) : !allChecklistPassed ? (
                        <>
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Complete Checklist to Send
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Campaign
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Calendar */}
              <EmailCalendar 
                onSelectFranchise={handleFranchiseChange}
              />
            </div>

            {/* Email Preview */}
            <Card className="xl:col-span-2 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-[#FFD700]" />
                  Email Preview
                  <Badge variant="outline" className="ml-auto" style={{ borderColor: franchise.color + '40', color: franchise.color }}>
                    {franchise.name}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-[#0A0A0A] rounded-lg overflow-hidden border border-[#333]">
                  {/* Email Header Preview */}
                  <div className="bg-[#1a1a1a] p-3 border-b border-[#333]">
                    <p className="text-xs text-[#888] mb-1">From: WePrintWraps &lt;hello@weprintwraps.com&gt;</p>
                    <p className="text-sm font-medium text-white truncate">{subject}</p>
                    <p className="text-xs text-[#666] mt-1 truncate">{previewText}</p>
                  </div>
                  {/* Email Body Preview */}
                  <iframe
                    srcDoc={emailHtml}
                    className="w-full h-[700px] bg-[#0A0A0A]"
                    title="Email Preview"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MightyMailCampaignSender;
