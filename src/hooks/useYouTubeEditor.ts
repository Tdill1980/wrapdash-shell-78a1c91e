import { useState } from "react";

export interface Scene {
  id: number;
  type: "hook" | "value" | "reveal" | "cta";
  start: string;
  end: string;
  score: number;
}

export interface GeneratedShort {
  id: string;
  title: string;
  duration: string;
  hookStrength: "Weak" | "Medium" | "Strong";
}

export interface AnalysisData {
  duration: string;
  scenes: number;
  spikes: number;
  shorts: number;
  hookScore: number;
  productMentions: number;
}

export function useYouTubeEditor() {
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [selectedShort, setSelectedShort] = useState<GeneratedShort | null>(null);

  // Placeholder stats
  const analysis: AnalysisData = {
    duration: "24:17",
    scenes: 38,
    spikes: 7,
    shorts: 8,
    hookScore: 92,
    productMentions: 3,
  };

  const demoScenes: Scene[] = [
    { id: 1, type: "hook", start: "0:00", end: "0:06", score: 92 },
    { id: 2, type: "value", start: "0:06", end: "0:18", score: 74 },
    { id: 3, type: "reveal", start: "0:18", end: "0:23", score: 89 },
    { id: 4, type: "cta", start: "0:23", end: "0:30", score: 70 },
    { id: 5, type: "value", start: "0:30", end: "0:45", score: 81 },
    { id: 6, type: "hook", start: "0:45", end: "0:52", score: 88 },
    { id: 7, type: "reveal", start: "0:52", end: "1:05", score: 95 },
    { id: 8, type: "cta", start: "1:05", end: "1:12", score: 76 },
  ];

  const shorts: GeneratedShort[] = Array.from({ length: 8 }).map((_, i) => ({
    id: `short_${i + 1}`,
    title: `Short Clip #${i + 1}`,
    duration: `${Math.floor(Math.random() * 8 + 5)}.${Math.floor(Math.random() * 9)}s`,
    hookStrength: (["Weak", "Medium", "Strong"] as const)[Math.floor(Math.random() * 3)],
  }));

  const analyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setIsAnalyzed(true);
    }, 1500);
  };

  const reset = () => {
    setVideoUrl("");
    setUploadedFile(null);
    setIsAnalyzing(false);
    setIsAnalyzed(false);
    setSelectedScene(null);
    setSelectedShort(null);
  };

  return {
    videoUrl,
    setVideoUrl,
    uploadedFile,
    setUploadedFile,
    isAnalyzing,
    isAnalyzed,
    analyze,
    reset,
    analysis,
    demoScenes,
    shorts,
    selectedScene,
    setSelectedScene,
    selectedShort,
    setSelectedShort,
  };
}
