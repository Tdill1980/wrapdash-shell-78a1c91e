import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ApproveFlowProject {
  id: string;
  order_number: string;
  customer_id?: string;
  designer_id?: string;
  customer_name: string;
  customer_email?: string;
  order_total?: number;
  status: string;
  product_type: string;
  design_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface ApproveFlowVersion {
  id: string;
  project_id: string;
  version_number: number;
  file_url: string;
  thumbnail_url?: string;
  notes?: string;
  submitted_by: 'designer' | 'customer';
  created_at: string;
}

export interface ApproveFlowChat {
  id: string;
  project_id: string;
  sender: 'designer' | 'customer';
  message: string;
  created_at: string;
}

export interface ApproveFlowAction {
  id: string;
  project_id: string;
  action_type: string;
  payload?: any;
  created_at: string;
}

export const useApproveFlow = (projectId?: string) => {
  const [project, setProject] = useState<ApproveFlowProject | null>(null);
  const [versions, setVersions] = useState<ApproveFlowVersion[]>([]);
  const [chatMessages, setChatMessages] = useState<ApproveFlowChat[]>([]);
  const [actions, setActions] = useState<ApproveFlowAction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch project data
  const fetchProject = async () => {
    if (!projectId) return;
    
    try {
      const { data, error } = await supabase
        .from('approveflow_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error: any) {
      toast({
        title: 'Error loading project',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Fetch versions
  const fetchVersions = async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('approveflow_versions')
        .select('*')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      setVersions((data || []) as ApproveFlowVersion[]);
    } catch (error: any) {
      toast({
        title: 'Error loading versions',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Fetch chat
  const fetchChat = async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('approveflow_chat')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setChatMessages((data || []) as ApproveFlowChat[]);
    } catch (error: any) {
      console.error('Error loading chat:', error);
    }
  };

  // Fetch actions
  const fetchActions = async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('approveflow_actions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActions(data || []);
    } catch (error: any) {
      console.error('Error loading actions:', error);
    }
  };

  // Helper to trigger ApproveFlow events
  const triggerEvent = async (eventType: string, data: any = {}) => {
    try {
      await supabase.functions.invoke('approveflow-event', {
        body: {
          eventType,
          projectId,
          ...data,
        },
      });
    } catch (error: any) {
      console.error('Error triggering event:', error);
    }
  };

  // Upload new version
  const uploadVersion = async (file: File, notes: string, submittedBy: 'designer' | 'customer') => {
    if (!projectId) return;

    try {
      // Upload file to Supabase storage (you'll need to create a bucket)
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('approveflow-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('approveflow-files')
        .getPublicUrl(fileName);

      // Get next version number
      const nextVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version_number)) + 1 : 1;

      // Insert version
      const { data: versionData, error: versionError } = await supabase
        .from('approveflow_versions')
        .insert({
          project_id: projectId,
          version_number: nextVersion,
          file_url: publicUrl,
          notes,
          submitted_by: submittedBy,
        })
        .select()
        .single();

      if (versionError) throw versionError;

      // Update project status
      await supabase
        .from('approveflow_projects')
        .update({ status: 'proof_delivered' })
        .eq('id', projectId);

      // Trigger event for Klaviyo + WooCommerce
      await triggerEvent('proof_delivered', {
        versionId: versionData.id,
        notes,
      });

      toast({
        title: 'Version uploaded',
        description: `Version ${nextVersion} uploaded successfully`,
      });

      fetchVersions();
      fetchProject();
      fetchActions();
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Send chat message
  const sendMessage = async (message: string, sender: 'designer' | 'customer') => {
    if (!projectId) return;

    try {
      const { error } = await supabase
        .from('approveflow_chat')
        .insert({
          project_id: projectId,
          sender,
          message,
        });

      if (error) throw error;
      fetchChat();
    } catch (error: any) {
      toast({
        title: 'Error sending message',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Approve design
  const approveDesign = async () => {
    if (!projectId) return;

    try {
      await supabase
        .from('approveflow_projects')
        .update({ status: 'approved' })
        .eq('id', projectId);

      // Trigger event for Klaviyo + WooCommerce
      const latestVersion = versions[0];
      await triggerEvent('design_approved', {
        versionId: latestVersion?.id,
      });

      toast({
        title: 'Design Approved',
        description: 'The design has been approved successfully',
      });

      fetchProject();
      fetchActions();
    } catch (error: any) {
      toast({
        title: 'Error approving design',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Request revision
  const requestRevision = async (revisionNotes: string) => {
    if (!projectId) return;

    try {
      await supabase
        .from('approveflow_projects')
        .update({ status: 'revision_sent' })
        .eq('id', projectId);

      // Trigger event for Klaviyo + WooCommerce
      await triggerEvent('revision_requested', {
        notes: revisionNotes,
      });

      toast({
        title: 'Revision Requested',
        description: 'Your revision request has been sent to the designer',
      });

      fetchProject();
      fetchActions();
    } catch (error: any) {
      toast({
        title: 'Error requesting revision',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Initial load
  useEffect(() => {
    if (projectId) {
      setLoading(true);
      Promise.all([
        fetchProject(),
        fetchVersions(),
        fetchChat(),
        fetchActions(),
      ]).finally(() => setLoading(false));

      // Set up realtime subscriptions
      const projectChannel = supabase
        .channel(`approveflow-${projectId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'approveflow_chat', filter: `project_id=eq.${projectId}` }, () => {
          fetchChat();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'approveflow_versions', filter: `project_id=eq.${projectId}` }, () => {
          fetchVersions();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'approveflow_projects', filter: `id=eq.${projectId}` }, () => {
          fetchProject();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(projectChannel);
      };
    }
  }, [projectId]);

  return {
    project,
    versions,
    chatMessages,
    actions,
    loading,
    uploadVersion,
    sendMessage,
    approveDesign,
    requestRevision,
    refetch: () => {
      fetchProject();
      fetchVersions();
      fetchChat();
      fetchActions();
    },
  };
};
