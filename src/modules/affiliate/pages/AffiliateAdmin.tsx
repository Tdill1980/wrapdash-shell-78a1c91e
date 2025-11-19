import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { affiliateApi } from '../services/affiliateApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Mail, QrCode } from 'lucide-react';

export const AffiliateAdmin = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [founders, setFounders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
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
      setFounders(data);
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
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#00AFFF] to-[#0047FF] bg-clip-text text-transparent">
              Affiliate Admin
            </h1>
            <p className="text-[#B8B8C7] mt-1">Manage affiliate founders and settings</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#00AFFF] to-[#0047FF] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Founder
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#16161E] border-[#ffffff0f] text-white">
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
                    className="bg-[#0A0A0F] border-[#ffffff0f] text-white mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={newFounder.fullName}
                    onChange={(e) => setNewFounder({ ...newFounder, fullName: e.target.value })}
                    required
                    className="bg-[#0A0A0F] border-[#ffffff0f] text-white mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="affiliateCode">Affiliate Code</Label>
                  <Input
                    id="affiliateCode"
                    value={newFounder.affiliateCode}
                    onChange={(e) => setNewFounder({ ...newFounder, affiliateCode: e.target.value.toUpperCase() })}
                    required
                    className="bg-[#0A0A0F] border-[#ffffff0f] text-white mt-1"
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
                    className="bg-[#0A0A0F] border-[#ffffff0f] text-white mt-1"
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-[#00AFFF] to-[#0047FF] text-white">
                  Create Founder
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-6 bg-[#16161E] border-[#ffffff0f]">
          <h3 className="text-lg font-semibold text-white mb-4">All Founders</h3>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#ffffff0f]">
                  <TableHead className="text-[#B8B8C7]">Name</TableHead>
                  <TableHead className="text-[#B8B8C7]">Email</TableHead>
                  <TableHead className="text-[#B8B8C7]">Affiliate Code</TableHead>
                  <TableHead className="text-[#B8B8C7]">Commission Rate</TableHead>
                  <TableHead className="text-[#B8B8C7]">Status</TableHead>
                  <TableHead className="text-[#B8B8C7]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {founders.map((founder) => (
                  <TableRow key={founder.id} className="border-[#ffffff0f]">
                    <TableCell className="text-white">{founder.full_name}</TableCell>
                    <TableCell className="text-white">{founder.email}</TableCell>
                    <TableCell className="text-white font-mono">{founder.affiliate_code}</TableCell>
                    <TableCell className="text-white">{founder.commission_rate}%</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${founder.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {founder.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendAccessLink(founder.email)}
                          className="border-[#ffffff0f] text-white"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/affiliate/card/${founder.affiliate_code}`, '_blank')}
                          className="border-[#ffffff0f] text-white"
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
};