import { Mic, X, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { supabase } from "@/integrations/supabase/client";

interface VoiceCommandProps {
  onTranscript: (transcript: string, parsedData: any) => void;
}

export default function VoiceCommand({ onTranscript }: VoiceCommandProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceInput();

  // Click outside to collapse
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isExpanded]);

  const handleTouchStart = async () => {
    console.log('🎤 Starting voice recording...');
    try {
      await startRecording();
      console.log('✅ Recording started successfully');
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const handleTouchEnd = async () => {
    console.log('⏹️ Stopping recording...');
    try {
      const transcript = await stopRecording();
      console.log('📝 Transcription result:', transcript);
      
      if (transcript) {
        await parseVoiceInputWithAI(transcript);
      } else {
        console.warn('⚠️ No transcript received');
        toast({
          title: "No Speech Detected",
          description: "Please try again and speak clearly.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Voice input error:', error);
      toast({
        title: "Transcription Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const parseVoiceInputWithAI = async (transcript: string) => {
    console.log('🤖 AI parsing transcript:', transcript);
    setIsParsing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('parse-voice-quote', {
        body: { transcript }
      });

      if (error) {
        console.error('❌ AI parsing error:', error);
        // Fall back to basic parsing
        fallbackParse(transcript);
        return;
      }

      if (data?.parsedData) {
        const parsed = data.parsedData;
        console.log('✅ AI parsed data:', parsed);
        
        // Transform AI response to match expected format
        const parsedData = {
          year: parsed.vehicleYear || '',
          make: parsed.vehicleMake || '',
          model: parsed.vehicleModel || '',
          customerName: parsed.customerName || '',
          companyName: '',
          phone: '',
          email: '',
          serviceType: parsed.serviceType || 'Printed Vinyl',
          productType: parsed.productType || '',
          addOns: [],
          description: transcript,
        };

        onTranscript(transcript, parsedData);
        
        const fieldsFound = Object.values(parsedData).filter(v => v && v !== transcript).length;
        toast({
          title: "Voice Command Processed",
          description: fieldsFound > 1 
            ? `Found ${fieldsFound} fields from your voice input` 
            : "Transcript captured, but couldn't extract structured data",
        });
      } else {
        fallbackParse(transcript);
      }
    } catch (error) {
      console.error('❌ AI parsing failed:', error);
      fallbackParse(transcript);
    } finally {
      setIsParsing(false);
    }
  };

  // Fallback regex parsing if AI fails
  const fallbackParse = (transcript: string) => {
    console.log('⚠️ Using fallback regex parsing');
    const lower = transcript.toLowerCase();
    
    const yearMatch = lower.match(/(\d{4})/);
    const makeMatch = lower.match(/(ford|chevy|chevrolet|toyota|honda|bmw|tesla|dodge|ram|gmc|jeep|buick|cadillac|lincoln|acura|lexus|infiniti|nissan|mazda|subaru|volkswagen|audi|mercedes|porsche|volvo|kia|hyundai|genesis|land rover|jaguar|mini|fiat|chrysler|alfa romeo)/i);
    
    const parsedData = {
      year: yearMatch ? yearMatch[1] : "",
      make: makeMatch ? makeMatch[1] : "",
      model: "",
      customerName: "",
      companyName: "",
      phone: "",
      email: "",
      serviceType: "Printed Vinyl",
      productType: "",
      addOns: [],
      description: transcript,
    };

    onTranscript(transcript, parsedData);
    toast({
      title: "Voice Command Processed",
      description: "Basic parsing used - speak clearly for better results",
    });
  };

  return (
    <div ref={containerRef} className="relative z-10">
      {!isExpanded ? (
        // Collapsed Badge
        <button
          onClick={() => setIsExpanded(true)}
          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full 
                     bg-gradient-to-r from-primary/90 to-accent/90 
                     hover:from-primary hover:to-accent
                     shadow-lg shadow-primary/30 hover:shadow-primary/50
                     backdrop-blur-md border border-white/10
                     transition-all duration-300 hover:scale-105"
        >
          <Sparkles className="h-3 w-3 text-white animate-pulse" />
          <span className="text-xs font-semibold text-white">
            VoiceCommand AI™
          </span>
          <Mic className="h-3 w-3 text-white" />
        </button>
      ) : (
        // Expanded Panel
        <div className="w-80 bg-[#232833] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/20 to-accent/20 border-b border-white/10 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                  <Mic className="h-3.5 w-3.5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-white">VoiceCommand AI™</h3>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 
                           flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-white/70" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <p className="text-xs text-white/70 text-center">
              Hold the button and speak your quote details
            </p>
            
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <p className="text-[11px] text-white/80 text-center leading-relaxed">
                💡 Say: "2024 Chevy Tahoe full wrap customer John Smith phone 555-1234"
              </p>
            </div>

            <button
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
              disabled={isProcessing || isParsing}
              className={`
                w-full px-6 py-3 rounded-lg font-semibold text-white text-sm
                transition-all duration-200 shadow-lg
                ${isRecording 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 scale-105 shadow-red-500/50 animate-pulse' 
                  : isProcessing || isParsing
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 animate-pulse'
                  : 'bg-gradient-to-r from-primary to-accent hover:scale-105 hover:shadow-primary/50'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <div className="flex items-center justify-center gap-2">
                <Mic className="h-4 w-4" />
                <span>
                  {isParsing ? '🧠 AI Parsing...' : isProcessing ? '⏳ Transcribing...' : isRecording ? '🎤 Listening...' : '🎙️ Hold & Speak'}
                </span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
