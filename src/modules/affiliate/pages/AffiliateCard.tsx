import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { affiliateApi } from '../services/affiliateApi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone, Building2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const AffiliateCard = () => {
  const { affiliateCode } = useParams<{ affiliateCode: string }>();
  const [founder, setFounder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (affiliateCode) {
      loadFounder();
      trackView();
    }
  }, [affiliateCode]);

  const loadFounder = async () => {
    try {
      const data = await affiliateApi.getFounderByCode(affiliateCode!);
      setFounder(data);
    } catch (error) {
      console.error('Error loading founder:', error);
      toast({
        title: 'Error',
        description: 'Failed to load affiliate information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const trackView = async () => {
    try {
      await affiliateApi.trackCardView(affiliateCode!, {
        referrerUrl: document.referrer,
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleConnect = () => {
    localStorage.setItem('ref', affiliateCode!);
    window.location.href = `https://weprintwraps.com?ref=${affiliateCode}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  if (!founder) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <Card className="p-8 bg-[#16161E] border-[#ffffff0f] text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Affiliate Not Found</h2>
          <p className="text-[#B8B8C7]">The affiliate code you're looking for doesn't exist.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 bg-[#16161E] border-[#ffffff0f]">
          <div className="flex flex-col items-center text-center mb-8">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarImage src={founder.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-[#00AFFF] to-[#0047FF] text-white text-2xl">
                {founder.full_name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            
            <h1 className="text-3xl font-bold text-white mb-2">{founder.full_name}</h1>
            
            {founder.company_name && (
              <div className="flex items-center gap-2 text-[#B8B8C7] mb-4">
                <Building2 className="w-4 h-4" />
                <span>{founder.company_name}</span>
              </div>
            )}
            
            {founder.bio && (
              <p className="text-[#B8B8C7] max-w-md mb-6">{founder.bio}</p>
            )}
          </div>

          <div className="space-y-4 mb-8">
            {founder.email && (
              <div className="flex items-center gap-3 text-white">
                <Mail className="w-5 h-5 text-[#00AFFF]" />
                <a href={`mailto:${founder.email}`} className="hover:text-[#00AFFF] transition-colors">
                  {founder.email}
                </a>
              </div>
            )}
            
            {founder.phone && (
              <div className="flex items-center gap-3 text-white">
                <Phone className="w-5 h-5 text-[#00AFFF]" />
                <a href={`tel:${founder.phone}`} className="hover:text-[#00AFFF] transition-colors">
                  {founder.phone}
                </a>
              </div>
            )}
          </div>

          {founder.social_links && Object.keys(founder.social_links).length > 0 && (
            <div className="flex justify-center gap-4 mb-8">
              {Object.entries(founder.social_links).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#B8B8C7] hover:text-[#00AFFF] transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              ))}
            </div>
          )}

          <Button
            onClick={handleConnect}
            className="w-full bg-gradient-to-r from-[#00AFFF] to-[#0047FF] text-white text-lg py-6"
          >
            Connect & Get Started
          </Button>

          <p className="text-xs text-[#B8B8C7] text-center mt-4">
            By clicking Connect, you'll be referred by {founder.full_name}
          </p>
        </Card>
      </div>
    </div>
  );
};