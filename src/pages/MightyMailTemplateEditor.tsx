import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import EmailTemplateEditor from '@/components/mightymail/EmailTemplateEditor';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const MightyMailTemplateEditor = () => {
  const { templateId } = useParams();
  const [loading, setLoading] = useState(!!templateId);
  const [template, setTemplate] = useState<any>(null);

  useEffect(() => {
    if (templateId && templateId !== 'new') {
      fetchTemplate();
    }
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      setTemplate(data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <EmailTemplateEditor
        templateId={templateId !== 'new' ? templateId : undefined}
        initialDesign={template?.design_json}
        initialName={template?.name || ''}
        initialCategory={template?.category || 'general'}
      />
    </MainLayout>
  );
};

export default MightyMailTemplateEditor;
