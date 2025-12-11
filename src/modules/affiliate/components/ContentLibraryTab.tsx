import { useAffiliateMedia } from '../hooks/useAffiliateMedia';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Image, Film, Clock, CheckCircle, XCircle, 
  Sparkles, Upload, Eye, DollarSign, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface ContentLibraryTabProps {
  founderId: string;
}

export const ContentLibraryTab = ({ founderId }: ContentLibraryTabProps) => {
  const { media, isLoading: loading } = useAffiliateMedia(founderId);
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filteredMedia = media?.filter(m => {
    if (filter === 'all') return true;
    return m.status === filter;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'used':
        return <Badge className="bg-[#E1306C]/20 text-[#E1306C] border-[#E1306C]/30"><Sparkles className="w-3 h-3 mr-1" />Used in Ad</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('video')) return <Film className="w-4 h-4 text-[#E1306C]" />;
    return <Image className="w-4 h-4 text-[#00AFFF]" />;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="aspect-square bg-[#1a1a2e] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">My Content Library</h2>
          <p className="text-muted-foreground text-sm">
            {media?.length || 0} uploads • {media?.filter(m => m.status === 'approved').length || 0} approved
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-[#1a1a2e] rounded-lg p-1">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
              <Button
                key={f}
                variant="ghost"
                size="sm"
                onClick={() => setFilter(f)}
                className={`capitalize ${filter === f ? 'bg-[#00AFFF]/20 text-[#00AFFF]' : 'text-muted-foreground'}`}
              >
                {f}
              </Button>
            ))}
          </div>
          <Button 
            onClick={() => navigate('/affiliate/upload')}
            className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] text-white"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      {filteredMedia.length === 0 ? (
        <Card className="p-12 bg-[#1a1a2e] border-[#ffffff0f] text-center">
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No content yet</h3>
          <p className="text-muted-foreground mb-4">
            Upload your wrap photos and videos to get started
          </p>
          <Button 
            onClick={() => navigate('/affiliate/upload')}
            className="bg-[#00AFFF] hover:bg-[#00AFFF]/90"
          >
            Upload Your First Content
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filteredMedia.map((item) => (
            <Card 
              key={item.id} 
              className="group relative overflow-hidden bg-[#1a1a2e] border-[#ffffff0f] hover:border-[#ffffff1a] transition-all"
            >
              {/* Thumbnail */}
              <div className="aspect-square relative">
                {item.type.includes('video') ? (
                  <video 
                    src={item.url} 
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <img 
                    src={item.url} 
                    alt="Upload"
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary" className="h-8">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Type Icon */}
                <div className="absolute top-2 left-2">
                  {getTypeIcon(item.type)}
                </div>
              </div>

              {/* Info */}
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  {getStatusBadge(item.status)}
                  {item.status === 'approved' && (
                    <span className="text-xs text-green-500 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Eligible
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground capitalize">{item.brand}</p>
                {item.reviewer_notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.reviewer_notes}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
