import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Loader2, Plus, X } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { usePortfolioVoiceInput } from "@/hooks/usePortfolioVoiceInput";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AddJobFormProps {
  onSubmit: (data: JobFormData) => Promise<void>;
}

export interface JobFormData {
  title: string;
  vehicle_year: number | null;
  vehicle_make: string;
  vehicle_model: string;
  finish: string;
  job_price: number;
  tags: string[];
}

export function AddJobForm({ onSubmit }: AddJobFormProps) {
  const { toast } = useToast();
  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const { processTranscript, isProcessing } = usePortfolioVoiceInput();

  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    vehicle_year: null,
    vehicle_make: '',
    vehicle_model: '',
    finish: '',
    job_price: 0,
    tags: []
  });
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVoiceToggle = async () => {
    if (isListening) {
      const finalTranscript = stopListening();
      if (finalTranscript) {
        try {
          const result = await processTranscript(finalTranscript);
          setFormData(prev => ({
            ...prev,
            title: result.formData.title || prev.title,
            vehicle_year: result.formData.vehicle_year ? parseInt(result.formData.vehicle_year) : prev.vehicle_year,
            vehicle_make: result.formData.vehicle_make || prev.vehicle_make,
            vehicle_model: result.formData.vehicle_model || prev.vehicle_model,
            finish: result.formData.finish || prev.finish,
            job_price: result.formData.job_price ? parseFloat(result.formData.job_price) : prev.job_price,
            tags: [...new Set([...prev.tags, ...result.suggestedTags])]
          }));
        } catch (error) {
          // Error already shown by hook
        }
      }
      resetTranscript();
    } else {
      startListening();
    }
  };

  const handleAddTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast({ title: "Please enter a title", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        title: '',
        vehicle_year: null,
        vehicle_make: '',
        vehicle_model: '',
        finish: '',
        job_price: 0,
        tags: []
      });
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Add New Job</span>
          {isSupported && (
            <Button
              type="button"
              variant={isListening ? "destructive" : "outline"}
              size="sm"
              onClick={handleVoiceToggle}
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
              {isProcessing ? 'Processing...' : isListening ? 'Stop' : 'Voice Input'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Voice transcript display */}
        {(isListening || transcript) && (
          <div className={cn(
            "mb-4 p-3 rounded-lg border",
            isListening ? "bg-red-500/10 border-red-500/50" : "bg-muted border-border"
          )}>
            <p className="text-sm">
              {isListening && <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2" />}
              {transcript || 'Listening...'}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Tesla Model 3 Full Wrap"
              />
            </div>

            <div>
              <Label htmlFor="vehicle_year">Year</Label>
              <Input
                id="vehicle_year"
                type="number"
                value={formData.vehicle_year || ''}
                onChange={e => setFormData(prev => ({ ...prev, vehicle_year: e.target.value ? parseInt(e.target.value) : null }))}
                placeholder="2024"
              />
            </div>

            <div>
              <Label htmlFor="vehicle_make">Make</Label>
              <Input
                id="vehicle_make"
                value={formData.vehicle_make}
                onChange={e => setFormData(prev => ({ ...prev, vehicle_make: e.target.value }))}
                placeholder="Tesla"
              />
            </div>

            <div>
              <Label htmlFor="vehicle_model">Model</Label>
              <Input
                id="vehicle_model"
                value={formData.vehicle_model}
                onChange={e => setFormData(prev => ({ ...prev, vehicle_model: e.target.value }))}
                placeholder="Model 3"
              />
            </div>

            <div>
              <Label htmlFor="finish">Finish</Label>
              <Input
                id="finish"
                value={formData.finish}
                onChange={e => setFormData(prev => ({ ...prev, finish: e.target.value }))}
                placeholder="Satin Black"
              />
            </div>

            <div>
              <Label htmlFor="job_price">Job Price ($)</Label>
              <Input
                id="job_price"
                type="number"
                value={formData.job_price || ''}
                onChange={e => setFormData(prev => ({ ...prev, job_price: parseFloat(e.target.value) || 0 }))}
                placeholder="2500"
              />
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  placeholder="Add tag"
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding Job...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Job
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
