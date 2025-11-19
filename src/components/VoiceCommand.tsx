import { Mic } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface VoiceCommandProps {
  onTranscript: (transcript: string, parsedData: any) => void;
}

export default function VoiceCommand({ onTranscript }: VoiceCommandProps) {
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();

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
      toast({
        title: "Error",
        description: "Could not process voice input",
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
    <div className="sticky top-0 z-50 bg-gradient-to-r from-[#0A0A0F] via-[#121218] to-[#16161E] border-b border-border/30 backdrop-blur-sm">
      <div className="px-4 py-4 space-y-3">
        {/* Header with branding */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-gradient-to-r from-[#8FD3FF] to-[#0047FF]">
              <Mic className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold bg-gradient-to-r from-[#8FD3FF] via-[#6AB9FF] to-[#0047FF] bg-clip-text text-transparent">
                VoiceCommand AI™
              </h3>
              <p className="text-[10px] text-muted-foreground">Powered by MightyCustomer</p>
            </div>
          </div>
          {isRecording && (
            <span className="text-xs text-primary font-medium animate-pulse">
              ● RECORDING
            </span>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-[#0F0F14] border border-border/40 rounded-lg p-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-foreground font-semibold">Hold down</span> the button below and speak naturally. 
            Include <span className="text-foreground">vehicle details, customer info, service type,</span> and any special requests. 
            Release when finished — fields auto-populate instantly.
          </p>
        </div>

        {/* Voice Button */}
        <button
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className={`w-full px-4 py-4 rounded-lg border-2 transition-all duration-200 ${
            isRecording
              ? "bg-gradient-to-r from-[#8FD3FF]/10 via-[#6AB9FF]/10 to-[#0047FF]/10 border-[#0047FF] shadow-[0_0_20px_rgba(0,71,255,0.3)]"
              : "bg-[#0F0F14] border-border/40 hover:border-[#0047FF]/60 hover:bg-[#141419]"
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <Mic className={`w-6 h-6 ${isRecording ? "text-[#0047FF] animate-pulse" : "text-muted-foreground"}`} />
            <span className="text-sm text-foreground font-semibold">
              {isRecording ? "Listening... Release when done" : "Hold & Speak"}
            </span>
            <span className="text-xs text-muted-foreground">
              {isRecording ? "Recording in progress..." : "Press and hold to start"}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
