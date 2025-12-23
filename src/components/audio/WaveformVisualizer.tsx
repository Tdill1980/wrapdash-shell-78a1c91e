import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface WaveformVisualizerProps {
  audioUrl: string;
  isPlaying?: boolean;
  energy?: 'calm' | 'upbeat' | 'hype';
  className?: string;
  height?: number;
}

export function WaveformVisualizer({ 
  audioUrl, 
  isPlaying = false,
  energy = 'upbeat',
  className,
  height = 40
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const animationRef = useRef<number>();
  const progressRef = useRef(0);

  // Get color based on energy level
  const getColor = () => {
    switch (energy) {
      case 'calm': return { primary: '#3b82f6', secondary: '#93c5fd' }; // blue
      case 'upbeat': return { primary: '#f59e0b', secondary: '#fcd34d' }; // amber
      case 'hype': return { primary: '#ef4444', secondary: '#fca5a5' }; // red
      default: return { primary: '#8b5cf6', secondary: '#c4b5fd' }; // purple
    }
  };

  // Analyze audio and extract waveform data
  useEffect(() => {
    const analyzeAudio = async () => {
      try {
        setIsLoading(true);
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Get audio data from the first channel
        const channelData = audioBuffer.getChannelData(0);
        const samples = 50; // Number of bars in the waveform
        const blockSize = Math.floor(channelData.length / samples);
        const waveform: number[] = [];
        
        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[i * blockSize + j]);
          }
          waveform.push(sum / blockSize);
        }
        
        // Normalize values
        const max = Math.max(...waveform);
        const normalizedWaveform = waveform.map(v => v / max);
        
        setWaveformData(normalizedWaveform);
        setIsLoading(false);
        audioContext.close();
      } catch (error) {
        console.error('Failed to analyze audio:', error);
        // Generate fake waveform as fallback
        const fakeWaveform = Array.from({ length: 50 }, () => 0.3 + Math.random() * 0.7);
        setWaveformData(fakeWaveform);
        setIsLoading(false);
      }
    };

    if (audioUrl) {
      analyzeAudio();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioUrl]);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = getColor();
    const barWidth = canvas.width / waveformData.length;
    const barGap = 2;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      waveformData.forEach((value, index) => {
        const barHeight = value * (canvas.height - 4);
        const x = index * barWidth;
        const y = (canvas.height - barHeight) / 2;
        
        // Determine if this bar has been "played"
        const playedRatio = progressRef.current;
        const barRatio = index / waveformData.length;
        const isPlayed = barRatio < playedRatio;
        
        // Draw bar with rounded corners
        ctx.fillStyle = isPlayed ? colors.primary : colors.secondary;
        ctx.beginPath();
        ctx.roundRect(x + barGap / 2, y, barWidth - barGap, barHeight, 2);
        ctx.fill();
      });

      if (isPlaying) {
        progressRef.current += 0.002; // Simulate playback progress
        if (progressRef.current > 1) progressRef.current = 0;
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [waveformData, isPlaying, energy]);

  // Reset progress when not playing
  useEffect(() => {
    if (!isPlaying) {
      progressRef.current = 0;
    }
  }, [isPlaying]);

  if (isLoading) {
    return (
      <div 
        className={cn("flex items-center justify-center", className)}
        style={{ height }}
      >
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-muted-foreground/30 rounded-full animate-pulse"
              style={{ 
                height: 10 + Math.random() * 20,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={height}
      className={cn("w-full", className)}
    />
  );
}
