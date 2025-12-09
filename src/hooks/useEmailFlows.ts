import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface EmailFlow {
  id: string;
  organization_id?: string;
  name: string;
  description?: string;
  trigger: string;
  flow_type: string;
  brand: string;
  is_active: boolean;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
  };
  created_at: string;
  updated_at: string;
}

export interface EmailFlowStep {
  id: string;
  flow_id: string;
  step_number: number;
  delay_hours: number;
  subject: string;
  preview_text?: string;
  body_html: string;
  body_text?: string;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export function useEmailFlows() {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);

  // Fetch all flows
  const { data: flows, isLoading } = useQuery({
    queryKey: ['email-flows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_flows')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as EmailFlow[];
    },
  });

  // Fetch steps for a flow
  const useFlowSteps = (flowId: string) => {
    return useQuery({
      queryKey: ['email-flow-steps', flowId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('email_flow_steps')
          .select('*')
          .eq('flow_id', flowId)
          .order('step_number', { ascending: true });
        if (error) throw error;
        return data as EmailFlowStep[];
      },
      enabled: !!flowId,
    });
  };

  // Create flow
  const createFlow = useMutation({
    mutationFn: async (flow: { name: string; description?: string; trigger?: string; flow_type?: string; brand?: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('email_flows')
        .insert([flow])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-flows'] });
      toast.success('Flow created');
    },
    onError: () => toast.error('Failed to create flow'),
  });

  // Update flow
  const updateFlow = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailFlow> & { id: string }) => {
      const { data, error } = await supabase
        .from('email_flows')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-flows'] });
      toast.success('Flow updated');
    },
    onError: () => toast.error('Failed to update flow'),
  });

  // Delete flow
  const deleteFlow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_flows')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-flows'] });
      toast.success('Flow deleted');
    },
    onError: () => toast.error('Failed to delete flow'),
  });

  // Create step
  const createStep = useMutation({
    mutationFn: async (step: { flow_id: string; step_number?: number; delay_hours?: number; subject: string; preview_text?: string; body_html: string; body_text?: string; ai_generated?: boolean }) => {
      const { data, error } = await supabase
        .from('email_flow_steps')
        .insert([step])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['email-flow-steps', variables.flow_id] });
      toast.success('Step added');
    },
    onError: () => toast.error('Failed to add step'),
  });

  // Update step
  const updateStep = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailFlowStep> & { id: string }) => {
      const { data, error } = await supabase
        .from('email_flow_steps')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-flow-steps', data.flow_id] });
      toast.success('Step updated');
    },
    onError: () => toast.error('Failed to update step'),
  });

  // Delete step
  const deleteStep = useMutation({
    mutationFn: async ({ id, flowId }: { id: string; flowId: string }) => {
      const { error } = await supabase
        .from('email_flow_steps')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return flowId;
    },
    onSuccess: (flowId) => {
      queryClient.invalidateQueries({ queryKey: ['email-flow-steps', flowId] });
      toast.success('Step deleted');
    },
    onError: () => toast.error('Failed to delete step'),
  });

  // Generate AI flow
  const generateAIFlow = async (params: {
    flowType: string;
    brand: string;
    persona?: string;
    productFocus?: string;
  }) => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-email-flow', {
        body: params,
      });
      if (error) throw error;
      
      // Create the flow
      const flowResult = await createFlow.mutateAsync({
        name: data.name,
        description: data.description,
        trigger: data.trigger,
        flow_type: params.flowType,
        brand: params.brand,
        is_active: false,
      });

      // Create steps
      for (const step of data.steps) {
        await createStep.mutateAsync({
          flow_id: flowResult.id,
          step_number: step.step_number,
          delay_hours: step.delay_hours,
          subject: step.subject,
          preview_text: step.preview_text,
          body_html: step.body_html,
          body_text: step.body_text,
          ai_generated: true,
        });
      }

      toast.success('AI flow generated!');
      return flowResult;
    } catch (error) {
      console.error('Generate error:', error);
      toast.error('Failed to generate AI flow');
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  // Send test email
  const sendTestEmail = async (stepId: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-mightymail-test', {
        body: { stepId, testMode: true },
      });
      if (error) throw error;
      toast.success('Test email sent to internal addresses');
    } catch (error) {
      console.error('Send test error:', error);
      toast.error('Failed to send test email');
    }
  };

  return {
    flows,
    isLoading,
    generating,
    useFlowSteps,
    createFlow,
    updateFlow,
    deleteFlow,
    createStep,
    updateStep,
    deleteStep,
    generateAIFlow,
    sendTestEmail,
  };
}
