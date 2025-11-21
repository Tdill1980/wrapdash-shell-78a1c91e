import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Library, Upload, Sparkles } from "lucide-react";

interface PanelSourceSelectorProps {
  onSelect: (mode: 'library' | 'upload' | 'ai') => void;
  selectedMode?: 'library' | 'upload' | 'ai';
}

export function PanelSourceSelector({ onSelect, selectedMode }: PanelSourceSelectorProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Step 1: Choose Panel Source</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          variant={selectedMode === 'library' ? 'default' : 'outline'}
          className="h-24 flex flex-col gap-2"
          onClick={() => onSelect('library')}
        >
          <Library className="w-6 h-6" />
          <span>Library Panel</span>
        </Button>
        
        <Button
          variant={selectedMode === 'upload' ? 'default' : 'outline'}
          className="h-24 flex flex-col gap-2"
          onClick={() => onSelect('upload')}
        >
          <Upload className="w-6 h-6" />
          <span>Upload Custom</span>
        </Button>
        
        <Button
          variant={selectedMode === 'ai' ? 'default' : 'outline'}
          className="h-24 flex flex-col gap-2"
          onClick={() => onSelect('ai')}
        >
          <Sparkles className="w-6 h-6" />
          <span>AI Generate</span>
        </Button>
      </div>
    </Card>
  );
}
