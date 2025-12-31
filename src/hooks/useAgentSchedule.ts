import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AgentSchedule {
  id: string;
  agent_name: string;
  enabled: boolean;
  timezone: string;
  active_after: string | null;
  active_before: string | null;
  active_weekends: boolean;
  active_holidays: boolean;
  emergency_off: boolean;
  force_on: boolean;
  created_at: string;
  updated_at: string;
}

export function useAgentSchedule(agentName: string = 'jordan') {
  const [schedule, setSchedule] = useState<AgentSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Fetch schedule
  const fetchSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_schedules')
        .select('*')
        .eq('agent_name', agentName)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSchedule(data);
    } catch (err) {
      console.error('Error fetching agent schedule:', err);
      toast({
        title: 'Error',
        description: 'Failed to load agent schedule',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [agentName]);

  // Update schedule
  const updateSchedule = async (updates: Partial<AgentSchedule>) => {
    if (!schedule?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('agent_schedules')
        .update(updates)
        .eq('id', schedule.id);

      if (error) throw error;

      setSchedule(prev => prev ? { ...prev, ...updates } : null);
      toast({
        title: 'Schedule Updated',
        description: 'Agent schedule has been saved',
      });
    } catch (err) {
      console.error('Error updating schedule:', err);
      toast({
        title: 'Error',
        description: 'Failed to update schedule',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Toggle enabled
  const toggleEnabled = () => {
    if (schedule) {
      updateSchedule({ enabled: !schedule.enabled });
    }
  };

  // Toggle emergency off
  const toggleEmergencyOff = async () => {
    if (!schedule?.id) return;

    const newValue = !schedule.emergency_off;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('agent_schedules')
        .update({ emergency_off: newValue })
        .eq('id', schedule.id);

      if (error) throw error;

      setSchedule(prev => prev ? { ...prev, emergency_off: newValue } : null);
      toast({
        title: newValue ? '🚨 Emergency Stop Activated' : '✅ Emergency Stop Deactivated',
        description: newValue 
          ? 'Jordan is now OFFLINE immediately' 
          : 'Jordan is back to normal schedule',
        variant: newValue ? 'destructive' : 'default'
      });
    } catch (err) {
      console.error('Error toggling emergency off:', err);
      toast({
        title: 'Error',
        description: 'Failed to toggle emergency stop',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Toggle force on
  const toggleForceOn = async () => {
    if (!schedule?.id) return;

    const newValue = !schedule.force_on;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('agent_schedules')
        .update({ force_on: newValue })
        .eq('id', schedule.id);

      if (error) throw error;

      setSchedule(prev => prev ? { ...prev, force_on: newValue } : null);
      toast({
        title: newValue ? '🚀 Force Start Activated' : '⏹️ Force Start Deactivated',
        description: newValue 
          ? 'Jordan is now ONLINE (ignoring schedule)' 
          : 'Jordan is back to auto-schedule',
      });
    } catch (err) {
      console.error('Error toggling force on:', err);
      toast({
        title: 'Error',
        description: 'Failed to toggle force start',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Compute current status
  const computeCurrentStatus = (): { active: boolean; reason: string } => {
    if (!schedule) return { active: false, reason: 'Schedule not loaded' };
    if (schedule.emergency_off) return { active: false, reason: 'Emergency shutdown active' };
    if (!schedule.enabled) return { active: false, reason: 'Agent disabled' };
    if (schedule.force_on) return { active: true, reason: 'Force Start is active (ignoring schedule)' };

    const timezone = schedule.timezone || 'America/Phoenix';
    const now = new Date();
    const localTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    
    const hours = localTime.getHours().toString().padStart(2, '0');
    const minutes = localTime.getMinutes().toString().padStart(2, '0');
    const nowTime = `${hours}:${minutes}`;
    
    const dayOfWeek = localTime.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend && !schedule.active_weekends) {
      return { active: false, reason: 'Inactive on weekends' };
    }

    if (!schedule.active_after || !schedule.active_before) {
      return { active: true, reason: 'No schedule restrictions' };
    }

    const activeAfter = schedule.active_after.slice(0, 5);
    const activeBefore = schedule.active_before.slice(0, 5);

    let inSchedule = false;
    if (activeAfter > activeBefore) {
      inSchedule = nowTime >= activeAfter || nowTime <= activeBefore;
    } else {
      inSchedule = nowTime >= activeAfter && nowTime <= activeBefore;
    }

    if (!inSchedule) {
      return { active: false, reason: `Outside scheduled hours (${activeAfter} - ${activeBefore})` };
    }

    return { active: true, reason: 'Within scheduled hours' };
  };

  const currentStatus = computeCurrentStatus();

  return {
    schedule,
    loading,
    saving,
    updateSchedule,
    toggleEnabled,
    toggleEmergencyOff,
    toggleForceOn,
    currentStatus,
    refetch: fetchSchedule
  };
}
