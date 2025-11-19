import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Building, Share2 } from 'lucide-react';
import { AffiliateFounder } from '../services/affiliateApi';

interface AffiliateHeaderProps {
  founder: AffiliateFounder;
  isAdminView?: boolean;
}

export const AffiliateHeader = ({ founder, isAdminView = false }: AffiliateHeaderProps) => {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Avatar */}
        <Avatar className="w-24 h-24 border-4 border-primary/20">
          <AvatarImage src={founder.avatarUrl || undefined} alt={founder.fullName} />
          <AvatarFallback className="text-2xl bg-gradient-to-r from-[#00AFFF] to-[#0047FF] text-white">
            {founder.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{founder.fullName}</h2>
              {founder.companyName && (
                <p className="text-muted-foreground flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  {founder.companyName}
                </p>
              )}
            </div>
            {isAdminView && (
              <Badge 
                variant="outline" 
                className={founder.isActive ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}
              >
                {founder.isActive ? 'Active' : 'Inactive'}
              </Badge>
            )}
          </div>

          {/* Contact Info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
            {founder.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{founder.email}</span>
              </div>
            )}
            {founder.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{founder.phone}</span>
              </div>
            )}
          </div>

          {/* Bio */}
          {founder.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2">{founder.bio}</p>
          )}

          {/* Affiliate Code */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
            <Share2 className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Affiliate Code:</span>
            <span className="text-lg font-bold font-mono bg-gradient-to-r from-[#00AFFF] to-[#0047FF] bg-clip-text text-transparent">
              {founder.affiliateCode}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
