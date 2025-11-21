import { Card } from '@/components/ui/card';
import { useUPSTracking } from '../hooks/useUPSTracking';
import { Package, MapPin, Calendar, ExternalLink, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrackingCardProps {
  trackingNumber: string;
  trackingUrl?: string;
}

export const TrackingCard = ({ trackingNumber, trackingUrl }: TrackingCardProps) => {
  const { trackingData, loading, error } = useUPSTracking(trackingNumber);

  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('delivered')) return 'text-green-400';
    if (lowerStatus.includes('out for delivery')) return 'text-blue-400';
    if (lowerStatus.includes('in transit')) return 'text-cyan-400';
    if (lowerStatus.includes('exception')) return 'text-red-400';
    return 'text-white/70';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not available';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  const trackingLink = trackingUrl || `https://www.ups.com/track?tracknum=${trackingNumber}`;

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-[#00AFFF]/10 to-[#0066B3]/10 border-[#00AFFF]/20">
      {/* Header with gradient */}
      <div className="bg-gradient-primary p-6 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5" />
              Shipment Tracking
            </h3>
            <p className="text-white/70 text-sm mt-1">UPS</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            onClick={() => window.open(trackingLink, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Track Package
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pt-4">
        {loading && !trackingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Status Line */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className={`text-lg font-semibold ${getStatusColor(trackingData?.status || 'Unknown')}`}>
                  {trackingData?.status || 'Label Created'}
                </div>
                {loading && (
                  <Loader2 className="w-4 h-4 animate-spin text-primary/50" />
                )}
              </div>
              
              {/* Location & ETA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {trackingData?.location && (
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{trackingData.location}</span>
                  </div>
                )}
                {trackingData?.eta && (
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>Est. Delivery: {formatDate(trackingData.eta)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            {trackingData?.events && trackingData.events.length > 0 && (
              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-white/90">
                  <Clock className="w-4 h-4" />
                  Recent Activity
                </div>
                <div className="space-y-3">
                  {trackingData.events.slice(0, 5).map((event, index) => (
                    <div 
                      key={index} 
                      className="flex gap-3 pb-3 last:pb-0 border-b border-white/5 last:border-0"
                    >
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white/90 font-medium">
                          {event.status}
                        </div>
                        <div className="text-xs text-white/60 mt-0.5">
                          {event.location && <span>{event.location} • </span>}
                          <span>{formatTime(event.time)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error fallback */}
            {error && !trackingData?.events?.length && (
              <div className="text-sm text-white/60 text-center py-4">
                Unable to fetch live tracking data. 
                <button 
                  onClick={() => window.open(trackingLink, '_blank')}
                  className="text-primary hover:underline ml-1"
                >
                  View on UPS website
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
};
