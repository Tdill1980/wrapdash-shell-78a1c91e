/**
 * ClubWPW Vault - Monthly Design Drop + Wrap of the Week
 * 
 * Embedded in ShopFlow tracker for customer engagement
 */

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Download, Eye, Clock, Trophy, Vote, ChevronLeft, ChevronRight, 
  Instagram, ExternalLink, Sparkles, Crown, Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Neon gradient colors (matching ShopFlow 2.0)
const NEON_GRADIENT = "from-[#FF00FF] via-[#9D4EDD] to-[#2F81F7]";
const MAGENTA = "#E91E8C";

interface VaultDrop {
  id: string;
  design_name: string;
  design_description: string;
  preview_image_url: string;
  hero_render_url: string;
  files: Record<string, string>;
  panel_type: string;
  featured_month: string;
  expires_at: string;
  is_exclusive: boolean;
  tags: string[];
  download_count: number;
}

interface WOTWNominee {
  id: string;
  wrap_title: string;
  artist_name: string;
  artist_instagram: string;
  hero_image_url: string;
  image_urls: string[];
  vehicle_make: string;
  vehicle_model: string;
  vote_count: number;
  is_winner: boolean;
}

export const ClubWPWVault = () => {
  const [activeTab, setActiveTab] = useState("monthly-drop");
  const [currentDrop, setCurrentDrop] = useState<VaultDrop | null>(null);
  const [nominees, setNominees] = useState<WOTWNominee[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadModal, setDownloadModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [downloadEmail, setDownloadEmail] = useState("");
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [hasVoted, setHasVoted] = useState(false);

  // Fetch current month's drop
  useEffect(() => {
    const fetchDrop = async () => {
      const currentMonth = new Date().toISOString().slice(0, 7); // "2026-02"
      
      const { data, error } = await supabase
        .from('clubwpw_vault_drops')
        .select('*')
        .eq('status', 'active')
        .eq('featured_month', currentMonth)
        .single();

      if (!error && data) {
        setCurrentDrop(data);
      }
      setLoading(false);
    };

    fetchDrop();
  }, []);

  // Fetch WOTW nominees
  useEffect(() => {
    const fetchNominees = async () => {
      const { data, error } = await supabase
        .from('wotw_nominees')
        .select('*')
        .eq('is_finalist', true)
        .order('vote_count', { ascending: false })
        .limit(4);

      if (!error && data) {
        setNominees(data);
      }
    };

    fetchNominees();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!currentDrop?.expires_at) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(currentDrop.expires_at).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [currentDrop]);

  const handleDownload = async () => {
    if (!currentDrop || !selectedSize || !downloadEmail) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    // Track download
    await supabase.from('clubwpw_downloads').insert({
      drop_id: currentDrop.id,
      email: downloadEmail,
      size_downloaded: selectedSize,
      source: 'shopflow',
    });

    // Increment counter
    await supabase
      .from('clubwpw_vault_drops')
      .update({ download_count: (currentDrop.download_count || 0) + 1 })
      .eq('id', currentDrop.id);

    // Open download URL
    const downloadUrl = currentDrop.files[selectedSize];
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }

    setDownloadModal(false);
    toast({ title: "Download started! 🎉", description: "Check your downloads folder" });
  };

  const handleVote = async (nomineeId: string) => {
    if (hasVoted) {
      toast({ title: "You've already voted this week!", variant: "destructive" });
      return;
    }

    // Generate fingerprint (simple version)
    const fingerprint = btoa(navigator.userAgent + new Date().toISOString().slice(0, 10));
    const weekOf = new Date().toISOString().slice(0, 4) + '-W' + 
      Math.ceil((new Date().getDate() + new Date(new Date().getFullYear(), 0, 1).getDay()) / 7)
        .toString().padStart(2, '0');

    const { error } = await supabase.from('wotw_votes').insert({
      nominee_id: nomineeId,
      voter_fingerprint: fingerprint,
      week_of: weekOf,
    });

    if (error) {
      toast({ title: "Vote failed", description: "You may have already voted", variant: "destructive" });
      return;
    }

    // Update vote count
    const nominee = nominees.find(n => n.id === nomineeId);
    if (nominee) {
      await supabase
        .from('wotw_nominees')
        .update({ vote_count: (nominee.vote_count || 0) + 1 })
        .eq('id', nomineeId);
    }

    setHasVoted(true);
    toast({ title: "Vote recorded! 🗳️", description: "Thanks for participating!" });
    
    // Refresh nominees
    setNominees(prev => prev.map(n => 
      n.id === nomineeId ? { ...n, vote_count: (n.vote_count || 0) + 1 } : n
    ));
  };

  const sizes = [
    { key: 'small', label: 'Small', desc: 'Up to 144"' },
    { key: 'medium', label: 'Medium', desc: '145" - 180"' },
    { key: 'large', label: 'Large', desc: '181" - 216"' },
    { key: 'xl', label: 'XL', desc: '217"+' },
  ];

  return (
    <div className="w-full">
      {/* ClubWPW Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <span className="text-amber-400 text-lg">🏆</span>
            <h2 className="text-lg font-bold ml-2">
              <span className="text-white">Club</span>
              <span className={`bg-gradient-to-r ${NEON_GRADIENT} bg-clip-text text-transparent`}>WPW</span>
            </h2>
          </div>
          <Badge className="bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30 text-[10px]">
            MEMBER PERKS
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full bg-black/50 border border-fuchsia-500/20 p-1 rounded-xl mb-4">
          <TabsTrigger 
            value="monthly-drop" 
            className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-500/30 data-[state=active]:to-purple-500/30 data-[state=active]:text-white rounded-lg"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Monthly Drop
          </TabsTrigger>
          <TabsTrigger 
            value="wotw" 
            className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-500/30 data-[state=active]:to-purple-500/30 data-[state=active]:text-white rounded-lg"
          >
            <Trophy className="w-3.5 h-3.5 mr-1.5" />
            Wrap of the Week
          </TabsTrigger>
        </TabsList>

        {/* Monthly Drop Tab */}
        <TabsContent value="monthly-drop" className="mt-0">
          {currentDrop ? (
            <Card className="bg-black border border-fuchsia-500/30 rounded-xl overflow-hidden">
              {/* Hero Image */}
              <div className="relative aspect-[16/9] bg-[#1a1a24]">
                <img 
                  src={currentDrop.hero_render_url || currentDrop.preview_image_url} 
                  alt={currentDrop.design_name}
                  className="w-full h-full object-cover"
                />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <div className="bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] text-white font-semibold uppercase tracking-wide flex items-center gap-1">
                    {currentDrop.panel_type === '2_sides' ? '2-SIDES PANEL' : 'FULL PANEL'}
                    <Info className="w-3 h-3" />
                  </div>
                </div>
                
                {currentDrop.is_exclusive && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-[#E91E8C] text-white border-0 text-[10px] px-2.5 py-1 rounded-full">
                      ✦ Exclusive
                    </Badge>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-lg text-white mb-1">{currentDrop.design_name}</h3>
                <p className="text-xs text-white/60 mb-3">
                  {currentDrop.panel_type === '2_sides' ? '2-sides Panel Design' : 'Full Panel Design'} • 
                  <span className="text-fuchsia-400 ml-1">restyle</span>
                </p>

                {/* Countdown */}
                <div className="flex items-center gap-1.5 text-[#E91E8C] mb-4">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-sm font-mono font-medium">
                    {countdown.days > 0 && `${countdown.days}d `}
                    {String(countdown.hours).padStart(2, '0')}:
                    {String(countdown.minutes).padStart(2, '0')}:
                    {String(countdown.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-xs text-white/40 ml-1">left to download</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mb-3">
                  <button className="flex-1 h-9 bg-[#1A1A1A] border border-white/10 rounded flex items-center justify-center hover:bg-white/5 transition-colors">
                    <Eye className="w-4 h-4 text-white" />
                  </button>
                  <button 
                    onClick={() => setDownloadModal(true)}
                    className="flex-1 h-9 bg-[#1A1A1A] border border-white/10 rounded flex items-center justify-center hover:bg-white/5 transition-colors"
                  >
                    <Download className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* CTA */}
                <Button
                  className="w-full h-11 bg-gradient-to-r from-[#E91E8C] to-[#9D4EDD] hover:opacity-90 text-white font-semibold rounded-lg transition-all"
                  onClick={() => window.open('https://restyleproai.com', '_blank')}
                >
                  🎨 See on Your Vehicle (Free)
                </Button>

                <p className="text-[10px] text-white/40 text-center mt-2">
                  Free mockup via RestyleProAI • Print-ready panel files included
                </p>
              </div>
            </Card>
          ) : (
            <Card className="bg-black/50 border border-fuchsia-500/20 rounded-xl p-8 text-center">
              <Sparkles className="w-8 h-8 text-fuchsia-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-1">Coming Soon</h3>
              <p className="text-white/50 text-sm">This month's design drop is being prepared</p>
            </Card>
          )}
        </TabsContent>

        {/* Wrap of the Week Tab */}
        <TabsContent value="wotw" className="mt-0">
          <Card className="bg-black border border-fuchsia-500/30 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-fuchsia-900/50 to-purple-900/50 p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-amber-400">🏆</span>
                <h3 className="text-lg font-bold text-white">Wrap of the Week</h3>
              </div>
              <p className="text-xs text-white/60">Curated by Paint Is Dead</p>
            </div>

            {/* Nominees Grid */}
            <div className="p-4">
              {nominees.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {nominees.map((nominee, index) => (
                    <div 
                      key={nominee.id}
                      className={`relative rounded-xl overflow-hidden border ${
                        nominee.is_winner 
                          ? 'border-amber-400 ring-2 ring-amber-400/30' 
                          : 'border-white/10 hover:border-fuchsia-500/30'
                      } transition-all`}
                    >
                      {/* Winner Crown */}
                      {nominee.is_winner && (
                        <div className="absolute top-2 right-2 z-10">
                          <Crown className="w-5 h-5 text-amber-400" />
                        </div>
                      )}

                      {/* Image */}
                      <div className="aspect-square bg-[#1a1a24]">
                        <img 
                          src={nominee.hero_image_url || nominee.image_urls?.[0]} 
                          alt={nominee.wrap_title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="p-2.5 bg-black">
                        <a 
                          href={`https://instagram.com/${nominee.artist_instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-fuchsia-400 hover:text-fuchsia-300 text-xs font-medium mb-1"
                        >
                          <Instagram className="w-3 h-3" />
                          @{nominee.artist_instagram.replace('@', '')}
                        </a>
                        <p className="text-[10px] text-white/50 mb-2">
                          {nominee.vehicle_make} {nominee.vehicle_model}
                        </p>

                        {/* Vote Button */}
                        <Button
                          size="sm"
                          variant={hasVoted ? "outline" : "default"}
                          className={`w-full h-7 text-xs ${
                            hasVoted 
                              ? 'bg-transparent border-white/20 text-white/50' 
                              : 'bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white border-0'
                          }`}
                          onClick={() => handleVote(nominee.id)}
                          disabled={hasVoted}
                        >
                          <Vote className="w-3 h-3 mr-1" />
                          {hasVoted ? `${nominee.vote_count} votes` : 'Vote'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-8 h-8 text-fuchsia-400/50 mx-auto mb-3" />
                  <p className="text-white/50 text-sm">Voting opens soon!</p>
                  <p className="text-white/30 text-xs mt-1">Tag @weprintwraps + @paintisdead to enter</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Download Modal */}
      <Dialog open={downloadModal} onOpenChange={setDownloadModal}>
        <DialogContent className="bg-[#0a0a0f] border border-fuchsia-500/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Download {currentDrop?.design_name}</DialogTitle>
            <DialogDescription className="text-white/60">
              Choose your panel size and enter your email
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Size Selector */}
            <div>
              <Label className="text-white/70 text-sm">Panel Size</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {sizes.map(size => (
                  <button
                    key={size.key}
                    onClick={() => setSelectedSize(size.key)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedSize === size.key
                        ? 'border-fuchsia-500 bg-fuchsia-500/10'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <p className="text-white font-medium text-sm">{size.label}</p>
                    <p className="text-white/50 text-xs">{size.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div>
              <Label className="text-white/70 text-sm">Email</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={downloadEmail}
                onChange={(e) => setDownloadEmail(e.target.value)}
                className="mt-2 bg-black border-white/10 text-white"
              />
            </div>

            {/* Download Button */}
            <Button
              onClick={handleDownload}
              disabled={!selectedSize || !downloadEmail}
              className="w-full h-11 bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white font-semibold"
            >
              <Download className="w-4 h-4 mr-2" />
              Download {selectedSize.toUpperCase()} Panel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
