import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Mic, MicOff, Loader2, Volume2, VolumeX } from 'lucide-react';
import { AudioRecorder, AudioQueue, createWavFromPCM, encodeAudioForAPI } from '@/utils/RealtimeAudioUtils';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeVoiceQuoteProps {
  onVehicleDetected: (vehicle: { year: string; make: string; model: string }) => void;
  onCustomerDetected: (customer: { name: string; company?: string; phone?: string; email?: string }) => void;
  onServiceDetected: (service: { type: string; panels?: string[] }) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const RealtimeVoiceQuote: React.FC<RealtimeVoiceQuoteProps> = ({
  onVehicleDetected,
  onCustomerDetected,
  onServiceDetected,
}) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAIResponding, setIsAIResponding] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    audioElementRef.current = document.createElement("audio");
    audioElementRef.current.autoplay = true;
    
    return () => {
      disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleToolCall = (toolName: string, args: any) => {
    console.log('Tool called:', toolName, args);
    
    switch (toolName) {
      case 'set_vehicle':
        if (args.year && args.make && args.model) {
          onVehicleDetected({
            year: args.year,
            make: args.make,
            model: args.model,
          });
          toast({
            title: "Vehicle Detected",
            description: `${args.year} ${args.make} ${args.model}`,
          });
        }
        break;
      
      case 'set_customer':
        onCustomerDetected({
          name: args.name,
          company: args.company,
          phone: args.phone,
          email: args.email,
        });
        toast({
          title: "Customer Info Updated",
          description: `${args.name}`,
        });
        break;
      
      case 'set_service':
        onServiceDetected({
          type: args.type,
          panels: args.panels,
        });
        toast({
          title: "Service Selected",
          description: args.type,
        });
        break;
    }
  };

  const connect = async () => {
    setIsConnecting(true);
    
    try {
      console.log('Requesting ephemeral token...');
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke('realtime-quote-session');
      
      if (sessionError) throw sessionError;
      if (!sessionData.client_secret?.value) {
        throw new Error("Failed to get ephemeral token");
      }

      const EPHEMERAL_KEY = sessionData.client_secret.value;
      console.log('Ephemeral token received');

      // Create peer connection
      pcRef.current = new RTCPeerConnection();

      // Set up audio context for playback
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioQueueRef.current = new AudioQueue(audioContext);

      // Set up remote audio
      pcRef.current.ontrack = (e) => {
        console.log('Remote audio track received');
        if (audioElementRef.current) {
          audioElementRef.current.srcObject = e.streams[0];
        }
      };

      // Add local audio track
      const ms = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      pcRef.current.addTrack(ms.getTracks()[0]);

      // Set up data channel for events
      dcRef.current = pcRef.current.createDataChannel("oai-events");
      
      dcRef.current.addEventListener("open", () => {
        console.log('Data channel opened');
        // Send session update with tools after connection
        dcRef.current?.send(JSON.stringify({
          type: "session.update",
          session: {
            tools: [
              {
                type: "function",
                name: "set_vehicle",
                description: "Set the vehicle details when year, make, and model are confirmed",
                parameters: {
                  type: "object",
                  properties: {
                    year: { type: "string", description: "Vehicle year (e.g., 2023)" },
                    make: { type: "string", description: "Vehicle make (e.g., Ford)" },
                    model: { type: "string", description: "Vehicle model (e.g., F-150)" }
                  },
                  required: ["year", "make", "model"]
                }
              },
              {
                type: "function",
                name: "set_customer",
                description: "Set customer information",
                parameters: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    company: { type: "string" },
                    phone: { type: "string" },
                    email: { type: "string" }
                  },
                  required: ["name"]
                }
              },
              {
                type: "function",
                name: "set_service",
                description: "Set the service type",
                parameters: {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["full_wrap", "partial_wrap", "color_change", "ppf", "tint"] },
                    panels: { 
                      type: "array", 
                      items: { type: "string", enum: ["sides", "back", "hood", "roof"] },
                      description: "For partial wraps, which panels to wrap"
                    }
                  },
                  required: ["type"]
                }
              }
            ],
            tool_choice: "auto"
          }
        }));
      });

      dcRef.current.addEventListener("message", (e) => {
        try {
          const event = JSON.parse(e.data);
          console.log("Received event:", event.type);
          
          switch (event.type) {
            case 'session.created':
              console.log('Session created');
              setIsConnected(true);
              break;
            
            case 'response.audio_transcript.delta':
              setCurrentTranscript(prev => prev + event.delta);
              setIsAIResponding(true);
              break;
            
            case 'response.audio_transcript.done':
              if (currentTranscript) {
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: event.transcript || currentTranscript,
                  timestamp: new Date()
                }]);
                setCurrentTranscript('');
              }
              setIsAIResponding(false);
              break;
            
            case 'conversation.item.input_audio_transcription.completed':
              if (event.transcript) {
                setMessages(prev => [...prev, {
                  role: 'user',
                  content: event.transcript,
                  timestamp: new Date()
                }]);
              }
              break;
            
            case 'response.function_call_arguments.done':
              try {
                const args = JSON.parse(event.arguments);
                handleToolCall(event.name, args);
              } catch (err) {
                console.error('Error parsing tool arguments:', err);
              }
              break;
            
            case 'input_audio_buffer.speech_started':
              setIsSpeaking(true);
              break;
            
            case 'input_audio_buffer.speech_stopped':
              setIsSpeaking(false);
              break;
            
            case 'error':
              console.error('OpenAI error:', event.error);
              toast({
                title: "Error",
                description: event.error.message,
                variant: "destructive",
              });
              break;
          }
        } catch (err) {
          console.error('Error parsing event:', err);
        }
      });

      // Create and set local description
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);

      // Connect to OpenAI's Realtime API
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      console.log('Connecting to OpenAI Realtime API...');
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp"
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(`Failed to connect: ${sdpResponse.status}`);
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      
      await pcRef.current.setRemoteDescription(answer);
      console.log("WebRTC connection established");

      toast({
        title: "Connected",
        description: "Voice assistant is ready. Start speaking!",
      });

    } catch (error) {
      console.error("Error connecting:", error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect",
        variant: "destructive",
      });
      disconnect();
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    recorderRef.current?.stop();
    dcRef.current?.close();
    pcRef.current?.close();
    audioQueueRef.current?.clear();
    
    pcRef.current = null;
    dcRef.current = null;
    recorderRef.current = null;
    
    setIsConnected(false);
    setIsSpeaking(false);
    setIsAIResponding(false);
    setCurrentTranscript('');
    
    toast({
      title: "Disconnected",
      description: "Voice session ended",
    });
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
          <h3 className="text-lg font-semibold">Voice Quote Builder</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {isSpeaking && <Mic className="w-4 h-4 text-primary animate-pulse" />}
          {isAIResponding && <Volume2 className="w-4 h-4 text-primary animate-pulse" />}
          
          {!isConnected ? (
            <Button 
              onClick={connect}
              disabled={isConnecting}
              className="gap-2"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Start Voice Session
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={disconnect}
              variant="destructive"
              className="gap-2"
            >
              <MicOff className="w-4 h-4" />
              End Session
            </Button>
          )}
        </div>
      </div>

      {isConnected && (
        <div className="space-y-4">
          <div className="h-64 overflow-y-auto space-y-2 p-4 bg-muted/50 rounded-lg">
            {messages.length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                Start speaking to build your quote...
              </p>
            )}
            
            {messages.map((msg, idx) => (
              <div 
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {currentTranscript && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-lg bg-muted">
                  <p className="text-sm">{currentTranscript}</p>
                  <p className="text-xs opacity-70 mt-1">Speaking...</p>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isSpeaking && (
              <span className="flex items-center gap-1">
                <Mic className="w-3 h-3" /> Listening...
              </span>
            )}
            {isAIResponding && (
              <span className="flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> AI responding...
              </span>
            )}
            {!isSpeaking && !isAIResponding && isConnected && (
              <span className="text-green-600">Ready - Start speaking</span>
            )}
          </div>
        </div>
      )}

      {!isConnected && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="mb-2">Click "Start Voice Session" to begin</p>
          <p className="text-sm">The AI will help you build a quote by asking questions about the vehicle, service, and customer details.</p>
        </div>
      )}
    </Card>
  );
};

export default RealtimeVoiceQuote;
