/**
 * Wrap of the Week - Dedicated Voting Page
 * 
 * Weekly: 4 nominees → vote → 1 weekly winner
 * Monthly: 4 weekly winners → vote → 1 monthly champion
 * 
 * Co-branded: ClubWPW × Paint Is Dead
 */

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, Crown, Vote, Instagram, ExternalLink, 
  Calendar, ChevronRight, Flame, Award, Users,
  CheckCircle2, Share2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MainLayout } from "@/layouts/MainLayout";

// Brand colors
const MAGENTA = "#E91E8C";
const NEON_GRADIENT = "from-[#FF00FF] via-[#9D4EDD] to-[#2F81F7]";

interface WOTWNominee {
  id: string;
  wrap_title: string;
  wrap_description: string;
  artist_name: string;
  artist_instagram: string;
  hero_image_url: string;
  image_urls: string[];
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: string;
  week_of: string;
  vote_count: number;
  is_finalist: boolean;
  is_winner: boolean;
  status: string;
}

export default function WrapOfTheWeek() {
  const [activeTab, setActiveTab] = useState("vote-now");
  const [currentWeekNominees, setCurrentWeekNominees] = useState<WOTWNominee[]>([]);
  const [weeklyWinners, setWeeklyWinners] = useState<WOTWNominee[]>([]);
  const [pastChampions, setPastChampions] = useState<WOTWNominee[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasVotedWeekly, setHasVotedWeekly] = useState(false);
  const [hasVotedMonthly, setHasVotedMonthly] = useState(false);
  const [votingWeek, setVotingWeek] = useState("");
  const [votingMonth, setVotingMonth] = useState("");

  useEffect(() => {
    // Calculate current week and month
    const now = new Date();
    const weekNum = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7);
    setVotingWeek(`${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`);
    setVotingMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch current week nominees (finalists)
    const { data: nominees } = await supabase
      .from('wotw_nominees')
      .select('*')
      .eq('is_finalist', true)
      .eq('is_winner', false)
      .order('vote_count', { ascending: false })
      .limit(4);

    if (nominees) setCurrentWeekNominees(nominees);

    // Fetch this month's weekly winners
    const { data: winners } = await supabase
      .from('wotw_nominees')
      .select('*')
      .eq('is_winner', true)
      .order('week_of', { ascending: false })
      .limit(4);

    if (winners) setWeeklyWinners(winners);

    // Fetch past monthly champions
    const { data: champions } = await supabase
      .from('wotw_nominees')
      .select('*')
      .eq('status', 'monthly_champion')
      .order('week_of', { ascending: false })
      .limit(12);

    if (champions) setPastChampions(champions);

    setLoading(false);
  };

  const handleVote = async (nomineeId: string, voteType: 'weekly' | 'monthly') => {
    const hasVoted = voteType === 'weekly' ? hasVotedWeekly : hasVotedMonthly;
    
    if (hasVoted) {
      toast({ title: `You've already voted for ${voteType} this period!`, variant: "destructive" });
      return;
    }

    // Generate fingerprint
    const fingerprint = btoa(navigator.userAgent + (voteType === 'weekly' ? votingWeek : votingMonth));
    const period = voteType === 'weekly' ? votingWeek : votingMonth;

    const { error } = await supabase.from('wotw_votes').insert({
      nominee_id: nomineeId,
      voter_fingerprint: fingerprint,
      week_of: period,
    });

    if (error) {
      if (error.code === '23505') {
        toast({ title: "Already voted!", description: "You can only vote once per period", variant: "destructive" });
      } else {
        toast({ title: "Vote failed", variant: "destructive" });
      }
      return;
    }

    // Update local state
    if (voteType === 'weekly') {
      setHasVotedWeekly(true);
      setCurrentWeekNominees(prev => prev.map(n => 
        n.id === nomineeId ? { ...n, vote_count: (n.vote_count || 0) + 1 } : n
      ));
    } else {
      setHasVotedMonthly(true);
      setWeeklyWinners(prev => prev.map(n => 
        n.id === nomineeId ? { ...n, vote_count: (n.vote_count || 0) + 1 } : n
      ));
    }

    toast({ title: "Vote recorded! 🗳️", description: "Thanks for participating!" });
  };

  const shareNominee = (nominee: WOTWNominee) => {
    const text = `Vote for ${nominee.artist_instagram}'s wrap in Wrap of the Week! 🏆\n\n${window.location.href}`;
    if (navigator.share) {
      navigator.share({ title: 'Wrap of the Week', text, url: window.location.href });
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Link copied!", description: "Share it with your friends" });
    }
  };

  const NomineeCard = ({ 
    nominee, 
    onVote, 
    hasVoted, 
    showRank,
    rank,
    isMonthlyVote = false
  }: { 
    nominee: WOTWNominee; 
    onVote: () => void;
    hasVoted: boolean;
    showRank?: boolean;
    rank?: number;
    isMonthlyVote?: boolean;
  }) => (
    <Card className={`relative overflow-hidden bg-black border ${
      nominee.is_winner 
        ? 'border-amber-400 ring-2 ring-amber-400/30' 
        : 'border-fuchsia-500/30 hover:border-fuchsia-400/50'
    } transition-all group`}>
      {/* Rank Badge */}
      {showRank && rank && (
        <div className={`absolute top-3 left-3 z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
          rank === 1 ? 'bg-amber-400 text-black' :
          rank === 2 ? 'bg-gray-300 text-black' :
          rank === 3 ? 'bg-amber-600 text-white' :
          'bg-white/20 text-white'
        }`}>
          {rank}
        </div>
      )}

      {/* Winner Crown */}
      {nominee.is_winner && (
        <div className="absolute top-3 right-3 z-10">
          <Crown className="w-6 h-6 text-amber-400 drop-shadow-lg" />
        </div>
      )}

      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden bg-[#1a1a24]">
        <img 
          src={nominee.hero_image_url || nominee.image_urls?.[0] || '/placeholder.svg'} 
          alt={nominee.wrap_title || 'Wrap submission'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Artist Info */}
        <a 
          href={`https://instagram.com/${nominee.artist_instagram.replace('@', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-fuchsia-400 hover:text-fuchsia-300 font-semibold mb-1"
        >
          <Instagram className="w-4 h-4" />
          @{nominee.artist_instagram.replace('@', '')}
          <ExternalLink className="w-3 h-3 opacity-50" />
        </a>

        {/* Vehicle */}
        <p className="text-white/60 text-sm mb-3">
          {nominee.vehicle_year} {nominee.vehicle_make} {nominee.vehicle_model}
        </p>

        {/* Vote Count */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-white font-bold">{nominee.vote_count || 0}</span>
            <span className="text-white/50 text-sm">votes</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => shareNominee(nominee)}
            className="text-white/50 hover:text-white"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Vote Button */}
        <Button
          onClick={onVote}
          disabled={hasVoted}
          className={`w-full ${
            hasVoted 
              ? 'bg-white/10 text-white/50 cursor-not-allowed' 
              : 'bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-600 hover:to-purple-600 text-white'
          }`}
        >
          {hasVoted ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Voted
            </>
          ) : (
            <>
              <Vote className="w-4 h-4 mr-2" />
              {isMonthlyVote ? 'Vote for Champion' : 'Vote'}
            </>
          )}
        </Button>
      </div>
    </Card>
  );

  return (
    <MainLayout>
      <div className="w-full max-w-6xl mx-auto space-y-8">
        {/* Hero Header */}
        <div className="relative text-center py-8 px-4 rounded-2xl bg-gradient-to-br from-black via-fuchsia-950/30 to-black border border-fuchsia-500/30 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.4\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] bg-repeat" />
          </div>

          {/* ClubWPW Logo */}
          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-amber-400 text-2xl">🏆</span>
              <h2 className="text-lg font-bold">
                <span className="text-white">CLUB</span>
                <span className={`bg-gradient-to-r ${NEON_GRADIENT} bg-clip-text text-transparent`}>WPW</span>
              </h2>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl md:text-6xl font-black mb-2" style={{ color: MAGENTA }}>
              WRAP OF THE
            </h1>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4">
              WEEK
            </h1>

            {/* Paint Is Dead Co-brand */}
            <div className="flex items-center justify-center gap-3 text-white/70">
              <span className="text-sm uppercase tracking-wider">Curated by</span>
              <span className="text-xl font-bold italic">Paint Is Dead®</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{currentWeekNominees.length}</p>
              <p className="text-xs text-white/50 uppercase tracking-wider">Nominees</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-fuchsia-400">{weeklyWinners.length}</p>
              <p className="text-xs text-white/50 uppercase tracking-wider">Weekly Winners</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{pastChampions.length}</p>
              <p className="text-xs text-white/50 uppercase tracking-wider">Champions</p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <Card className="bg-black/50 border border-white/10 p-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 font-bold">1</div>
              <div>
                <p className="text-white font-medium">Tag & Submit</p>
                <p className="text-white/50 text-sm">Tag @weprintwraps + @paintisdead on Instagram</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">2</div>
              <div>
                <p className="text-white font-medium">Get Nominated</p>
                <p className="text-white/50 text-sm">Top 4 wraps selected each week</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">3</div>
              <div>
                <p className="text-white font-medium">Win Glory</p>
                <p className="text-white/50 text-sm">Weekly winners compete for Monthly Champion</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-black border border-fuchsia-500/20 p-1 rounded-xl">
            <TabsTrigger 
              value="vote-now" 
              className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-500/30 data-[state=active]:to-purple-500/30 rounded-lg"
            >
              <Vote className="w-4 h-4 mr-2" />
              Vote Now
            </TabsTrigger>
            <TabsTrigger 
              value="monthly" 
              className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-500/30 data-[state=active]:to-purple-500/30 rounded-lg"
            >
              <Award className="w-4 h-4 mr-2" />
              Monthly Vote
            </TabsTrigger>
            <TabsTrigger 
              value="hall-of-fame" 
              className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-500/30 data-[state=active]:to-purple-500/30 rounded-lg"
            >
              <Crown className="w-4 h-4 mr-2" />
              Hall of Fame
            </TabsTrigger>
          </TabsList>

          {/* Vote Now - Weekly */}
          <TabsContent value="vote-now" className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">This Week's Nominees</h2>
                <p className="text-white/50 text-sm">Vote for your favorite wrap - 1 vote per week</p>
              </div>
              <Badge className="bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30">
                <Calendar className="w-3 h-3 mr-1" />
                {votingWeek}
              </Badge>
            </div>

            {currentWeekNominees.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {currentWeekNominees.map((nominee, index) => (
                  <NomineeCard
                    key={nominee.id}
                    nominee={nominee}
                    onVote={() => handleVote(nominee.id, 'weekly')}
                    hasVoted={hasVotedWeekly}
                    showRank={true}
                    rank={index + 1}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-black/50 border border-white/10 p-12 text-center">
                <Trophy className="w-12 h-12 text-fuchsia-400/30 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Nominations Opening Soon</h3>
                <p className="text-white/50 text-sm">Tag @weprintwraps + @paintisdead to enter</p>
              </Card>
            )}
          </TabsContent>

          {/* Monthly Vote */}
          <TabsContent value="monthly" className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Vote for Monthly Champion</h2>
                <p className="text-white/50 text-sm">Weekly winners compete for the ultimate title</p>
              </div>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                <Crown className="w-3 h-3 mr-1" />
                {votingMonth}
              </Badge>
            </div>

            {weeklyWinners.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {weeklyWinners.map((nominee, index) => (
                  <NomineeCard
                    key={nominee.id}
                    nominee={nominee}
                    onVote={() => handleVote(nominee.id, 'monthly')}
                    hasVoted={hasVotedMonthly}
                    showRank={true}
                    rank={index + 1}
                    isMonthlyVote={true}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-black/50 border border-white/10 p-12 text-center">
                <Award className="w-12 h-12 text-amber-400/30 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Monthly Voting Opens Soon</h3>
                <p className="text-white/50 text-sm">Check back when we have 4 weekly winners</p>
              </Card>
            )}
          </TabsContent>

          {/* Hall of Fame */}
          <TabsContent value="hall-of-fame" className="mt-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">Hall of Fame</h2>
              <p className="text-white/50 text-sm">Monthly Champions & Past Winners</p>
            </div>

            {pastChampions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastChampions.map((champion) => (
                  <Card 
                    key={champion.id}
                    className="bg-gradient-to-br from-amber-500/10 to-black border border-amber-500/30 overflow-hidden"
                  >
                    <div className="aspect-video overflow-hidden">
                      <img 
                        src={champion.hero_image_url || champion.image_urls?.[0]} 
                        alt={champion.wrap_title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="w-5 h-5 text-amber-400" />
                        <span className="text-amber-400 font-bold">Monthly Champion</span>
                      </div>
                      <a 
                        href={`https://instagram.com/${champion.artist_instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-fuchsia-400 font-semibold hover:text-fuchsia-300"
                      >
                        @{champion.artist_instagram.replace('@', '')}
                      </a>
                      <p className="text-white/50 text-sm mt-1">
                        {champion.vehicle_year} {champion.vehicle_make} {champion.vehicle_model}
                      </p>
                      <p className="text-white/30 text-xs mt-2">{champion.week_of}</p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-black/50 border border-white/10 p-12 text-center">
                <Crown className="w-12 h-12 text-amber-400/30 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Hall of Fame Coming Soon</h3>
                <p className="text-white/50 text-sm">Our first champions will be crowned soon!</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 border border-fuchsia-500/30 p-6 text-center">
          <h3 className="text-white font-bold text-lg mb-2">Want to be featured?</h3>
          <p className="text-white/70 mb-4">
            Post your wrap on Instagram and tag <span className="text-fuchsia-400">@weprintwraps</span> + <span className="text-fuchsia-400">@paintisdead</span>
          </p>
          <div className="flex justify-center gap-3">
            <Button 
              className="bg-gradient-to-r from-fuchsia-500 to-purple-500"
              onClick={() => window.open('https://instagram.com/weprintwraps', '_blank')}
            >
              <Instagram className="w-4 h-4 mr-2" />
              @weprintwraps
            </Button>
            <Button 
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => window.open('https://instagram.com/paintisdead', '_blank')}
            >
              <Instagram className="w-4 h-4 mr-2" />
              @paintisdead
            </Button>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center py-6 text-white/30 text-xs">
          Powered by <span className="text-fuchsia-400">WrapCommand™</span> • 
          A <span className="text-white/50">ClubWPW</span> × <span className="text-white/50">Paint Is Dead</span> collaboration
        </div>
      </div>
    </MainLayout>
  );
}
