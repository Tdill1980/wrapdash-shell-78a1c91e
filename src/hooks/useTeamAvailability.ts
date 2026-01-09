import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TeamMemberSchedule {
  id: string;
  agent_name: string;
  enabled: boolean;
  timezone: string;
  active_after: string | null;
  active_before: string | null;
  active_weekends: boolean;
  force_on: boolean;
  emergency_off: boolean;
}

// Team members who can be assigned calls (use agent_schedules)
const TEAM_MEMBERS = ['jackson', 'lance', 'trish', 'manny'];

export function useTeamAvailability() {
  const [schedules, setSchedules] = useState<TeamMemberSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_schedules')
        .select('*')
        .in('agent_name', TEAM_MEMBERS);

      if (error) throw error;
      setSchedules((data || []) as TeamMemberSchedule[]);
    } catch (err) {
      console.error('Error fetching team schedules:', err);
      toast.error('Failed to load team availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // Upsert a team member's availability
  const updateAvailability = async (
    agentName: string, 
    updates: Partial<Pick<TeamMemberSchedule, 'active_after' | 'active_before' | 'enabled' | 'active_weekends'>>
  ) => {
    setSaving(true);
    try {
      const existing = schedules.find(s => s.agent_name === agentName);

      if (existing) {
        const { error } = await supabase
          .from('agent_schedules')
          .update(updates)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new schedule for team member
        const { error } = await supabase
          .from('agent_schedules')
          .insert({
            agent_name: agentName,
            enabled: true,
            timezone: 'America/Phoenix',
            ...updates,
          });

        if (error) throw error;
      }

      await fetchSchedules();
      toast.success(`${agentName}'s availability updated`);
    } catch (err) {
      console.error('Error updating availability:', err);
      toast.error('Failed to update availability');
    } finally {
      setSaving(false);
    }
  };

  // Get availability for a specific team member
  const getAvailability = (agentName: string): TeamMemberSchedule | undefined => {
    return schedules.find(s => s.agent_name === agentName);
  };

  // Get formatted availability string for Alex prompts
  const getAvailabilityText = (agentName: string): string => {
    const schedule = getAvailability(agentName);
    if (!schedule) return 'No availability set';
    if (!schedule.enabled) return 'Not taking calls';
    if (schedule.emergency_off) return 'Currently unavailable';
    
    if (!schedule.active_after || !schedule.active_before) {
      return 'Available (no specific hours set)';
    }

    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    };

    const after = formatTime(schedule.active_after);
    const before = formatTime(schedule.active_before);
    const weekends = schedule.active_weekends ? ' (including weekends)' : ' (weekdays only)';
    
    return `${after} - ${before} ${schedule.timezone || 'America/Phoenix'}${weekends}`;
  };

  return {
    schedules,
    loading,
    saving,
    updateAvailability,
    getAvailability,
    getAvailabilityText,
    refetch: fetchSchedules,
  };
}
