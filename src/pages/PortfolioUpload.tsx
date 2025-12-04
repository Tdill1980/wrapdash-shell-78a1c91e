import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Camera, Check, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PortfolioJob {
  id: string;
  title: string;
  order_number: string | null;
  customer_name: string | null;
  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
}

export default function PortfolioUpload() {
  const { uploadToken } = useParams<{ uploadToken: string }>();
  const { toast } = useToast();
  
  const [job, setJob] = useState<PortfolioJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mediaType, setMediaType] = useState<'before' | 'after'>('after');
  const [uploadedCount, setUploadedCount] = useState(0);

  useEffect(() => {
    const fetchJob = async () => {
      if (!uploadToken) return;
      
      const { data, error } = await supabase
        .from('portfolio_jobs')
        .select('id, title, order_number, customer_name, vehicle_year, vehicle_make, vehicle_model')
        .eq('upload_token', uploadToken)
        .single();

      if (error) {
        console.error('Error fetching job:', error);
        setJob(null);
      } else {
        setJob(data);
      }
      setLoading(false);
    };

    fetchJob();
  }, [uploadToken]);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || !job) return;

    setUploading(true);
    let successCount = 0;

    for (const file of Array.from(files)) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${job.id}/${mediaType}_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('portfolio-media')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('portfolio-media')
          .getPublicUrl(fileName);

        const { error: dbError } = await supabase
          .from('portfolio_media')
          .insert([{
            job_id: job.id,
            storage_path: publicUrl,
            file_type: file.type.startsWith('video') ? 'video' : 'image',
            media_type: mediaType
          }]);

        if (dbError) throw dbError;
        successCount++;
      } catch (error: any) {
        console.error('Upload error:', error);
        toast({
          title: 'Upload failed',
          description: error.message,
          variant: 'destructive'
        });
      }
    }

    if (successCount > 0) {
      setUploadedCount(prev => prev + successCount);
      toast({
        title: 'Upload successful',
        description: `${successCount} ${mediaType} photo(s) uploaded`
      });
    }

    setUploading(false);
  }, [job, mediaType, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Invalid Link</h2>
            <p className="text-muted-foreground">
              This upload link is invalid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const vehicleInfo = [job.vehicle_year, job.vehicle_make, job.vehicle_model]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-8">
          <h1 className="text-2xl font-bold">
            <span className="text-foreground">Mighty</span>
            <span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">Portfolio</span>
            <span className="text-[10px] align-super text-muted-foreground ml-1">AI™</span>
          </h1>
          <p className="text-muted-foreground mt-1">Photo Upload</p>
        </div>

        {/* Job Info Card */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{job.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {job.order_number && (
              <p className="text-sm">
                <span className="text-muted-foreground">Order: </span>
                #{job.order_number}
              </p>
            )}
            {vehicleInfo && (
              <p className="text-sm">
                <span className="text-muted-foreground">Vehicle: </span>
                {vehicleInfo}
              </p>
            )}
            {job.customer_name && (
              <p className="text-sm">
                <span className="text-muted-foreground">Customer: </span>
                {job.customer_name}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Photo Type Selection */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Photo Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                variant={mediaType === 'before' ? 'default' : 'outline'}
                onClick={() => setMediaType('before')}
                className="flex-1"
              >
                Before
              </Button>
              <Button
                variant={mediaType === 'after' ? 'default' : 'outline'}
                onClick={() => setMediaType('after')}
                className="flex-1"
              >
                After
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upload Area */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <label className="block">
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                capture="environment"
                className="hidden"
                onChange={e => handleFileUpload(e.target.files)}
                disabled={uploading}
              />
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
                {uploading ? (
                  <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
                ) : (
                  <>
                    <div className="flex justify-center gap-4 mb-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <Camera className="h-6 w-6 text-primary" />
                      </div>
                      <div className="p-3 bg-primary/10 rounded-full">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <p className="font-medium mb-1">
                      Tap to take photo or upload
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Upload {mediaType} photos
                    </p>
                  </>
                )}
              </div>
            </label>
          </CardContent>
        </Card>

        {/* Upload Count */}
        {uploadedCount > 0 && (
          <Card className="bg-green-500/10 border-green-500/50">
            <CardContent className="p-4 flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <span className="text-green-500 font-medium">
                {uploadedCount} photo(s) uploaded successfully
              </span>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pb-8">
          Powered by MightyPortfolio AI™
        </p>
      </div>
    </div>
  );
}
