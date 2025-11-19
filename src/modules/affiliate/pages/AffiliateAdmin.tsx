import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { affiliateApi, AffiliateFounder } from '../services/affiliateApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Mail, Eye } from 'lucide-react';
import { AffiliateAdminView } from './AffiliateAdminView';

export const AffiliateAdmin = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [founders, setFounders] = useState<AffiliateFounder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFounder, setSelectedFounder] = useState<AffiliateFounder | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'detail'>('list');
  const [newFounder, setNewFounder] = useState({
    email: '',
    fullName: '',
    affiliateCode: '',
    commissionRate: 10,
  });

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadFounders();
    }
  }, [isAdmin]);

  const loadFounders = async () => {
    try {
      const data = await affiliateApi.getAllFounders();
      // Map snake_case to camelCase
      const mappedFounders: AffiliateFounder[] = data.map((f: any) => ({
        id: f.id,
        affiliateCode: f.affiliate_code,
        fullName: f.full_name,
        email: f.email,
        commissionRate: f.commission_rate,
        avatarUrl: f.avatar_url,
        bio: f.bio,
        companyName: f.company_name,
        phone: f.phone,
        socialLinks: f.social_links,
        isActive: f.is_active,
      }));
      setFounders(mappedFounders);
    } catch (error) {
      console.error('Error loading founders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load founders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFounder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await affiliateApi.createFounder(newFounder);
      toast({
        title: 'Founder Created',
        description: 'New affiliate founder has been added',
      });
      setDialogOpen(false);
      setNewFounder({ email: '', fullName: '', affiliateCode: '', commissionRate: 10 });
      loadFounders();
    } catch (error) {
      console.error('Error creating founder:', error);
      toast({
        title: 'Error',
        description: 'Failed to create founder',
        variant: 'destructive',
      });
    }
  };

  const handleSendAccessLink = async (email: string) => {
    try {
      await affiliateApi.sendAccessLink(email);
      toast({
        title: 'Access Link Sent',
        description: `Login link has been sent to ${email}`,
      });
    } catch (error) {
      console.error('Error sending access link:', error);
      toast({
        title: 'Error',
        description: 'Failed to send access link',
        variant: 'destructive',
      });
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  if (activeView === 'detail' && selectedFounder) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Button
            onClick={() => {
              setActiveView('list');
              setSelectedFounder(null);
            }}
            variant="outline"
            className="mb-6"
          >
            ← Back to Founders List
          </Button>
          
          <AffiliateAdminView founder={selectedFounder} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#00AFFF] to-[#0047FF] bg-clip-text text-transparent">
              Affiliate Admin
            </h1>
            <p className="text-muted-foreground mt-1">Manage affiliate founders and their performance</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#00AFFF] to-[#0047FF] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Founder
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-white">
              <DialogHeader>
                <DialogTitle>Create New Founder</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateFounder} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newFounder.email}
                    onChange={(e) => setNewFounder({ ...newFounder, email: e.target.value })}
                    required
                    className="bg-background border-border text-white mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={newFounder.fullName}
                    onChange={(e) => setNewFounder({ ...newFounder, fullName: e.target.value })}
                    required
                    className="bg-background border-border text-white mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="affiliateCode">Affiliate Code</Label>
                  <Input
                    id="affiliateCode"
                    value={newFounder.affiliateCode}
                    onChange={(e) => setNewFounder({ ...newFounder, affiliateCode: e.target.value.toUpperCase() })}
                    required
                    className="bg-background border-border text-white mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    value={newFounder.commissionRate}
                    onChange={(e) => setNewFounder({ ...newFounder, commissionRate: parseFloat(e.target.value) })}
                    required
                    min="0"
                    max="100"
                    step="0.1"
                    className="bg-background border-border text-white mt-1"
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-[#00AFFF] to-[#0047FF] text-white">
                  Create Founder
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">All Founders ({founders.length})</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {founders.map((founder) => (
              <Card 
                key={founder.id} 
                className="p-5 bg-background border-border hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => {
                  setSelectedFounder(founder);
                  setActiveView('detail');
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#00AFFF] to-[#0047FF] flex items-center justify-center text-white font-bold text-lg">
                    {founder.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white truncate">{founder.fullName}</h4>
                    <p className="text-xs text-muted-foreground truncate">{founder.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Code:</span>
                    <span className="font-mono text-primary">{founder.affiliateCode}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rate:</span>
                    <span className="text-white font-semibold">{founder.commissionRate}%</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendAccessLink(founder.email);
                    }}
                  >
                    <Mail className="w-3 h-3 mr-1" />
                    Send Link
                  </Button>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#00AFFF] to-[#0047FF]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFounder(founder);
                      setActiveView('detail');
                    }}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
