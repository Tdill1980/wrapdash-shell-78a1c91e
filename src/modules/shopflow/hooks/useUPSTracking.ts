import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TrackingEvent {
  time: string;
  status: string;
  location: string;
}

export interface TrackingData {
  status: string;
  eta?: string;
  location?: string;
  events: TrackingEvent[];
}

export const useUPSTracking = (trackingNumber: string | null | undefined, orderId?: string) => {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = useCallback(async () => {
    if (!trackingNumber) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ups-track', {
        body: { 
          tracking_number: trackingNumber,
          order_id: orderId 
        }
      });
      
      if (fnError) throw fnError;
      
      if (data) {
        setTrackingData(data);
      }
    } catch (err: any) {
      console.error('UPS tracking error:', err);
      setError(err.message || 'Failed to fetch tracking data');
      // Set fallback data structure for graceful degradation
      setTrackingData({
        status: 'Unknown',
        events: []
      });
    } finally {
      setLoading(false);
    }
  }, [trackingNumber]);

  useEffect(() => {
    if (trackingNumber) {
      fetchTracking();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchTracking, 30000);
      
      return () => clearInterval(interval);
    }
  }, [trackingNumber, orderId, fetchTracking]);

  return {
    trackingData,
    loading,
    error,
    refetch: fetchTracking
  };
};
