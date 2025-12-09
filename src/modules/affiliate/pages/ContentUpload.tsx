import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, Film, Image, FileVideo, Loader2, CheckCircle } from 'lucide-react';
import { useAffiliateMedia } from '../hooks/useAffiliateMedia';
import { useAffiliate } from '../hooks/useAffiliate';
import { cn } from '@/lib/utils';

const BRANDS = [
  { value: 'wpw', label: 'WePrintWraps', color: 'bg-blue-500' },
  { value: 'wraptv', label: 'WrapTV', color: 'bg-purple-500' },
  { value: 'inkandedge', label: 'Ink & Edge', color: 'bg-pink-500' },
];

const CONTENT_TYPES = [
  { value: 'raw', label: 'Raw Footage', icon: FileVideo, description: 'Unedited video clips' },
  { value: 'finished', label: 'Finished Reel', icon: Film, description: 'Edited, ready-to-post content' },
  { value: 'photo', label: 'Photo', icon: Image, description: 'High-quality images' },
];

const SUGGESTED_TAGS = [
  'install', 'timelapse', 'before-after', 'tutorial', 'review',
  'color-change', 'ppf', 'chrome', 'commercial', 'residential',
  'fleet', 'exotic', 'truck', 'sports-car', 'suv'
];

export default function ContentUpload() {
  const { founder } = useAffiliate();
  const { createMedia, uploading, media } = useAffiliateMedia(founder?.id);
  
  const [selectedBrand, setSelectedBrand] = useState('wpw');
  const [contentType, setContentType] = useState<'raw' | 'finished' | 'photo'>('raw');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm'],
    },
    maxSize: 500 * 1024 * 1024, // 500MB
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!founder?.id || files.length === 0) return;

    for (const file of files) {
      await createMedia.mutateAsync({
        affiliateId: founder.id,
        brand: selectedBrand,
        file,
        type: contentType,
        tags: selectedTags,
        notes,
      });
    }

    // Reset form
    setFiles([]);
    setSelectedTags([]);
    setNotes('');
  };

  const pendingCount = media?.filter(m => m.status === 'pending').length || 0;
  const approvedCount = media?.filter(m => m.status === 'approved').length || 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Content <span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">Upload</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Upload your wrap content to earn commissions when featured
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">{approvedCount}</div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
      </div>

      {/* Brand Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Select Brand</CardTitle>
          <CardDescription>Which brand is this content for?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            {BRANDS.map(brand => (
              <Button
                key={brand.value}
                variant={selectedBrand === brand.value ? 'default' : 'outline'}
                onClick={() => setSelectedBrand(brand.value)}
                className={cn(
                  selectedBrand === brand.value && brand.color
                )}
              >
                {brand.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Type */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Content Type</CardTitle>
          <CardDescription>What type of content are you uploading?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CONTENT_TYPES.map(type => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => setContentType(type.value as typeof contentType)}
                  className={cn(
                    "p-4 rounded-lg border-2 text-left transition-all",
                    contentType === type.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Icon className="w-8 h-8 mb-2" />
                  <div className="font-medium">{type.label}</div>
                  <div className="text-sm text-muted-foreground">{type.description}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Upload Files</CardTitle>
          <CardDescription>Drag and drop or click to upload (max 500MB per file)</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">
              {isDragActive ? "Drop files here" : "Drag files here or click to browse"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Supports: MP4, MOV, AVI, WEBM, PNG, JPG, JPEG, WEBP
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {file.type.startsWith('video/') ? (
                      <Film className="w-5 h-5" />
                    ) : (
                      <Image className="w-5 h-5" />
                    )}
                    <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tags */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Tags</CardTitle>
          <CardDescription>Select tags that describe your content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_TAGS.map(tag => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                {selectedTags.includes(tag) && <CheckCircle className="w-3 h-3 mr-1" />}
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Notes (Optional)</CardTitle>
          <CardDescription>Add any context about this content</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="E.g., This is a timelapse of a full chrome delete on a Tesla Model 3..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleSubmit}
        disabled={files.length === 0 || uploading}
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Submit {files.length} {files.length === 1 ? 'File' : 'Files'} for Review
          </>
        )}
      </Button>
    </div>
  );
}
