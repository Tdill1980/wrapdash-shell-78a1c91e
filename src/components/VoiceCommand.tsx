import { Mic, X, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

interface VoiceCommandProps {
  onTranscript: (transcript: string, parsedData: any) => void;
}

export default function VoiceCommand({ onTranscript }: VoiceCommandProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleMouseDown = () => {
    setIsRecording(true);
    startRecording();
  };

  const handleMouseUp = () => {
    setIsRecording(false);
    stopRecording();
  };

  const startRecording = () => {
    // Web Speech API implementation
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Speech recognition not supported in this browser",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = false;
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      parseVoiceInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      let title = "Voice Command Error";
      let description = "Could not process voice input";
      
      if (event.error === 'not-allowed') {
        title = "Microphone Access Denied";
        description = "Please allow microphone access in your browser settings and try again";
      } else if (event.error === 'no-speech') {
        title = "No Speech Detected";
        description = "Hold the button and speak clearly";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    };

    (window as any).currentRecognition = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    if ((window as any).currentRecognition) {
      (window as any).currentRecognition.stop();
    }
  };

  const parseVoiceInput = (transcript: string) => {
    const lower = transcript.toLowerCase();
    
    // Parse vehicle info
    const yearMatch = lower.match(/(\d{4})/);
    const makeMatch = lower.match(/(ford|chevy|chevrolet|toyota|honda|bmw|tesla|dodge|ram|tahoe|silverado|f-150|f150)/i);
    const modelMatch = lower.match(/(?:ford|chevy|chevrolet|toyota|honda|bmw|tesla|dodge|ram)\s+([a-z0-9\-]+)/i);
    
    // Parse customer info
    const nameMatch = lower.match(/customer\s+([a-z\s]+?)(?:\s+company|\s+full|\s+phone|\s+email|$)/i);
    const companyMatch = lower.match(/company(?:\s+name)?\s+([a-z'\s]+?)(?:\s+phone|\s+email|\s+also|$)/i);
    const phoneMatch = lower.match(/phone\s*([\d\-]+)/i);
    const emailMatch = lower.match(/email\s+([\w\.\-]+@[\w\.\-]+)/i);
    
    // Parse service type
    let serviceType = "Printed Vinyl";
    if (lower.includes("color change")) serviceType = "Color Change";
    if (lower.includes("ppf") || lower.includes("paint protection")) serviceType = "PPF";
    if (lower.includes("tint")) serviceType = "Tint";
    if (lower.includes("window perf")) serviceType = "Window Perf";
    if (lower.includes("wall wrap")) serviceType = "Wall Wrap";
    
    // Parse product type
    let productType = "";
    if (lower.includes("printed wrap") || lower.includes("full printed wrap")) {
      productType = "WPW Printed Wrap (Avery)";
    }
    
    // Parse add-ons
    const addOns = [];
    if (lower.includes("ppf") && lower.includes("hood")) addOns.push("PPF Hood Only");
    if (lower.includes("roof wrap")) addOns.push("Roof Wrap");
    if (lower.includes("install")) addOns.push("Installation");
    
    const parsedData = {
      year: yearMatch ? yearMatch[1] : "",
      make: makeMatch ? makeMatch[1] : "",
      model: modelMatch ? modelMatch[1] : "",
      customerName: nameMatch ? nameMatch[1].trim() : "",
      companyName: companyMatch ? companyMatch[1].trim() : "",
      phone: phoneMatch ? phoneMatch[1] : "",
      email: emailMatch ? emailMatch[1] : "",
      serviceType,
      productType,
      addOns,
      description: transcript,
    };

    onTranscript(transcript, parsedData);
    
    toast({
      title: "Voice Command Processed",
      description: "Quote fields populated from voice input",
    });
  };

  return (
    <div ref={containerRef} className="fixed top-4 right-4 z-50">
      {!isExpanded ? (
        // Collapsed Badge
        <button
          onClick={() => setIsExpanded(true)}
          className="group flex items-center gap-2 px-4 py-2 rounded-full 
                     bg-gradient-to-r from-primary/90 to-accent/90 
                     hover:from-primary hover:to-accent
                     shadow-lg shadow-primary/30 hover:shadow-primary/50
                     backdrop-blur-md border border-white/10
                     transition-all duration-300 hover:scale-105"
        >
          <Sparkles className="h-4 w-4 text-white animate-pulse" />
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold text-white">
              VoiceCommand AI™
            </span>
            <span className="text-[10px] text-white/70">
              Powered by MightyCustomer
            </span>
          </div>
          <Mic className="h-4 w-4 text-white ml-1" />
        </button>
      ) : (
        // Expanded Panel
        <div className="w-80 bg-[#232833] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/20 to-accent/20 border-b border-white/10 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                  <Mic className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">VoiceCommand AI™</h3>
                  <p className="text-[10px] text-white/60">Powered by MightyCustomer</p>
                </div>
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
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
              className={`
                w-full px-6 py-3 rounded-lg font-semibold text-white text-sm
                transition-all duration-200 shadow-lg
                ${isRecording 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 scale-105 shadow-red-500/50 animate-pulse' 
                  : 'bg-gradient-to-r from-primary to-accent hover:scale-105 hover:shadow-primary/50'
                }
              `}
            >
              <div className="flex items-center justify-center gap-2">
                <Mic className="h-4 w-4" />
                <span>{isRecording ? '🎤 Listening...' : '🎙️ Hold & Speak'}</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
