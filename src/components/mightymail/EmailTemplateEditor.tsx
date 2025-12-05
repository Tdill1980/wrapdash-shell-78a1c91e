import React, { useRef, useState } from 'react';
import EmailEditor, { EditorRef, EmailEditorProps } from 'react-email-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Download, ArrowLeft, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface EmailTemplateEditorProps {
  templateId?: string;
  initialDesign?: any;
  initialName?: string;
  initialCategory?: string;
}

const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  templateId,
  initialDesign,
  initialName = '',
  initialCategory = 'general'
}) => {
  const emailEditorRef = useRef<EditorRef | null>(null);
  const [templateName, setTemplateName] = useState(initialName);
  const [category, setCategory] = useState(initialCategory);
  const [saving, setSaving] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const onReady: EmailEditorProps['onReady'] = (unlayer) => {
    if (initialDesign && Object.keys(initialDesign).length > 0) {
      unlayer.loadDesign(initialDesign);
    }
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a template name",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    emailEditorRef.current?.editor?.exportHtml(async (data) => {
      const { design, html } = data;

      try {
        if (templateId) {
          // Update existing template
          const { error } = await supabase
            .from('email_templates')
            .update({
              name: templateName,
              category,
              design_json: design,
              html
            })
            .eq('id', templateId);

          if (error) throw error;

          toast({
            title: "Template Updated",
            description: "Your email template has been saved"
          });
        } else {
          // Create new template
          const { error } = await supabase
            .from('email_templates')
            .insert({
              name: templateName,
              category,
              design_json: design,
              html
            });

          if (error) throw error;

          toast({
            title: "Template Created",
            description: "Your email template has been saved"
          });
          navigate('/admin/mightymail/templates');
        }
      } catch (error: any) {
        console.error('Save error:', error);
        toast({
          title: "Save Failed",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setSaving(false);
      }
    });
  };

  const handleExportHtml = () => {
    emailEditorRef.current?.editor?.exportHtml((data) => {
      const { html } = data;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${templateName || 'email-template'}.html`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "HTML Exported",
        description: "Template downloaded as HTML file"
      });
    });
  };

  const handlePreview = () => {
    emailEditorRef.current?.editor?.exportHtml((data) => {
      setPreviewHtml(data.html);
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Controls */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/admin/mightymail/templates')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              
              <div className="flex items-center gap-2">
                <Label htmlFor="templateName" className="sr-only">Template Name</Label>
                <Input
                  id="templateName"
                  placeholder="Template Name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-64"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="category" className="sr-only">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="quote">Quote</SelectItem>
                    <SelectItem value="order">Order Status</SelectItem>
                    <SelectItem value="proof">Proof Delivery</SelectItem>
                    <SelectItem value="welcome">Welcome</SelectItem>
                    <SelectItem value="followup">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportHtml}>
                <Download className="h-4 w-4 mr-2" />
                Export HTML
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Template'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Email Editor */}
      <div className="flex-1 bg-muted">
        <EmailEditor
          ref={emailEditorRef}
          onReady={onReady}
          minHeight="calc(100vh - 200px)"
          options={{
            displayMode: 'email',
            features: {
              textEditor: {
                spellChecker: true
              }
            },
            appearance: {
              theme: 'modern_dark'
            },
            mergeTags: {
              customer_name: { name: 'Customer Name', value: '{{customer_name}}' },
              customer_email: { name: 'Customer Email', value: '{{customer_email}}' },
              quote_number: { name: 'Quote Number', value: '{{quote_number}}' },
              order_number: { name: 'Order Number', value: '{{order_number}}' },
              vehicle_year: { name: 'Vehicle Year', value: '{{vehicle_year}}' },
              vehicle_make: { name: 'Vehicle Make', value: '{{vehicle_make}}' },
              vehicle_model: { name: 'Vehicle Model', value: '{{vehicle_model}}' },
              total_price: { name: 'Total Price', value: '{{total_price}}' },
              product_name: { name: 'Product Name', value: '{{product_name}}' },
              status: { name: 'Status', value: '{{status}}' },
              portal_url: { name: 'Portal URL', value: '{{portal_url}}' },
              company_name: { name: 'Company Name', value: '{{company_name}}' }
            }
          }}
        />
      </div>

      {/* Preview Modal */}
      {previewHtml && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Email Preview</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setPreviewHtml(null)}>
                Close
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-auto max-h-[calc(90vh-80px)]">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-[600px] border-0"
                title="Email Preview"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EmailTemplateEditor;
