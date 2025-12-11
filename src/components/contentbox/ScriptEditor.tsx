import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Monitor, Copy, CheckCircle } from "lucide-react";
import { HookToolbar } from "./HookToolbar";
import { HookTemplateSelector } from "./HookTemplateSelector";
import { ToneTabsSelector } from "./ToneTabsSelector";
import { HookTimingBadge } from "./HookTimingBadge";
import { ContentSplitBar } from "./ContentSplitBar";
import { TeleprompterModal } from "./TeleprompterModal";
import { AssetHookRecommender } from "./AssetHookRecommender";
import { applyTone, ToneType } from "@/lib/content-editing/applyTone";
import { getTemplateById } from "@/lib/content-editing/hookTemplates";
import { toast } from "sonner";

interface ScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  assets?: Array<{ type?: string; tags?: string[]; file_type?: string }>;
  placeholder?: string;
  label?: string;
}

export function ScriptEditor({ 
  value, 
  onChange, 
  assets = [], 
  placeholder = "Write your hook or script here...",
  label = "Script Editor"
}: ScriptEditorProps) {
  const [selectedTone, setSelectedTone] = useState<ToneType>('none');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>();
  const [teleprompterOpen, setTeleprompterOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTemplateSelect = (templateText: string) => {
    onChange(templateText);
    // Find which template was selected to track ID
    const allTemplates = [...(getTemplateById('wpw_installer_trust') ? [] : [])];
  };

  const handleToneChange = (tone: ToneType) => {
    setSelectedTone(tone);
    // Apply tone to current text
    if (value && tone !== 'none') {
      onChange(applyTone(value, tone));
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAssetRecommendation = (templateId: string) => {
    const template = getTemplateById(templateId);
    if (template) {
      onChange(template.template);
      setSelectedTemplateId(templateId);
    }
  };

  // Get final text with tone applied
  const getFinalScript = (): string => {
    if (selectedTone === 'none') return value;
    return applyTone(value, selectedTone);
  };

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="pb-2 px-3 sm:px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{label}</CardTitle>
            <HookTimingBadge text={value} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 px-3 sm:px-4">
          {/* Asset-based recommendation */}
          {assets.length > 0 && (
            <AssetHookRecommender 
              assets={assets} 
              onSelectTemplate={handleAssetRecommendation}
            />
          )}

          {/* Template selector */}
          <HookTemplateSelector 
            onSelect={onChange}
            selectedId={selectedTemplateId}
          />

          {/* Hook transformation tools */}
          <HookToolbar text={value} onTransform={onChange} />

          {/* Main textarea */}
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[120px] bg-background resize-none font-medium"
          />

          {/* Tone selector */}
          <ToneTabsSelector 
            selectedTone={selectedTone} 
            onSelect={handleToneChange}
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <ContentSplitBar text={value} onSelect={onChange} />
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs gap-1"
                onClick={handleCopy}
              >
                {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                Copy
              </Button>
              <Button
                variant="default"
                size="sm"
                className="h-7 px-3 text-xs gap-1 bg-gradient-to-r from-primary to-purple-500"
                onClick={() => setTeleprompterOpen(true)}
                disabled={!value.trim()}
              >
                <Monitor className="w-3 h-3" />
                Teleprompter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teleprompter modal */}
      <TeleprompterModal
        isOpen={teleprompterOpen}
        onClose={() => setTeleprompterOpen(false)}
        script={getFinalScript()}
      />
    </>
  );
}
