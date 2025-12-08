import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Loader2, MessageCircle, ExternalLink } from "lucide-react";
import { useAIDesignGenerator, DesignStyle } from "@/hooks/useAIDesignGenerator";
import { useNavigate } from "react-router-dom";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  priority: string | null;
}

interface AIDesignOpportunitiesWidgetProps {
  leads: Lead[];
  organizationId: string | null;
}

const DESIGN_STYLES: { value: DesignStyle; label: string }[] = [
  { value: "luxury", label: "Luxury" },
  { value: "bold", label: "Bold" },
  { value: "gradient", label: "Gradient" },
  { value: "camo", label: "Camo" },
  { value: "abstract", label: "Abstract" },
  { value: "corporate", label: "Corporate" },
];

export function AIDesignOpportunitiesWidget({ leads, organizationId }: AIDesignOpportunitiesWidgetProps) {
  const navigate = useNavigate();
  const { generateDesign, isGenerating } = useAIDesignGenerator();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<DesignStyle>("bold");

  // Filter leads that might want design previews (high priority or design-related)
  const designOpportunityLeads = leads.filter(l => l.priority === 'high' || l.priority === 'urgent');

  const handleGenerateDesign = async (lead: Lead) => {
    if (!organizationId) return;

    setSelectedLeadId(lead.id);
    
    // Generate design with placeholder vehicle (customer can update later)
    const result = await generateDesign({
      organization_id: organizationId,
      style: selectedStyle,
      customer_name: lead.name,
      customer_email: lead.email || undefined,
      vehicle: {
        year: "2024",
        make: "Vehicle",
        model: "TBD",
      },
    });

    setSelectedLeadId(null);

    if (result?.approveflow_id) {
      navigate(`/approveflow/${result.approveflow_id}`);
    }
  };

  if (designOpportunityLeads.length === 0) {
    return null;
  }

  return (
    <Card className="border-pink-500/50 bg-pink-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wand2 className="w-5 h-5 text-pink-400" />
          AI Design Opportunities
        </CardTitle>
        <CardDescription>Generate wrap concepts for interested leads</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Style Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Default style:</span>
            <Select value={selectedStyle} onValueChange={(v) => setSelectedStyle(v as DesignStyle)}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DESIGN_STYLES.map((style) => (
                  <SelectItem key={style.value} value={style.value} className="text-xs">
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lead Cards */}
          {designOpportunityLeads.slice(0, 3).map((lead) => (
            <div 
              key={lead.id} 
              className="flex items-center justify-between p-3 bg-background rounded-lg border border-pink-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/10">
                  <MessageCircle className="w-4 h-4 text-pink-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">{lead.name}</p>
                  <p className="text-xs text-muted-foreground">{lead.email || lead.phone}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate('/mightychat')}
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Chat
                </Button>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  disabled={isGenerating && selectedLeadId === lead.id}
                  onClick={() => handleGenerateDesign(lead)}
                >
                  {isGenerating && selectedLeadId === lead.id ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3 h-3 mr-1" />
                      Generate Design
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
