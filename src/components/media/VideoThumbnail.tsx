import { useState, useRef, useEffect } from "react";
import { Video, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoThumbnailProps {
  videoUrl: string;
  thumbnailUrl?: string | null;
  alt?: string;
  className?: string;
  showPlayIcon?: boolean;
}

export function VideoThumbnail({ 
  videoUrl, 
  thumbnailUrl, 
  alt = "Video",
  className,
  showPlayIcon = true
}: VideoThumbnailProps) {
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // If we have a thumbnail URL, use it directly
  useEffect(() => {
    if (thumbnailUrl) {
      setGeneratedThumbnail(thumbnailUrl);
      setIsLoading(false);
      return;
    }

    // Generate thumbnail from video
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'metadata';
    
    const handleLoadedData = () => {
      // Seek to 1 second or 10% of video, whichever is smaller
      const seekTime = Math.min(1, video.duration * 0.1);
      video.currentTime = seekTime;
    };

    const handleSeeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setGeneratedThumbnail(dataUrl);
        }
      } catch (err) {
        console.warn('Failed to generate video thumbnail:', err);
        setHasError(true);
      } finally {
        setIsLoading(false);
        video.remove();
      }
    };

    const handleError = () => {
      console.warn('Failed to load video for thumbnail');
      setHasError(true);
      setIsLoading(false);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);
    
    // Add timeout fallback
    const timeout = setTimeout(() => {
      if (isLoading) {
        setHasError(true);
        setIsLoading(false);
      }
    }, 5000);

    video.src = videoUrl;
    video.load();

    return () => {
      clearTimeout(timeout);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
      video.remove();
    };
  }, [videoUrl, thumbnailUrl]);

  // Show fallback if no thumbnail could be generated
  if (hasError || (!generatedThumbnail && !isLoading)) {
    return (
      <div className={cn(
        "w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20 relative",
        className
      )}>
        <Video className="w-10 h-10 text-muted-foreground" />
        {showPlayIcon && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn(
        "w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/10 to-pink-500/10 animate-pulse",
        className
      )}>
        <Video className="w-8 h-8 text-muted-foreground/50" />
      </div>
    );
  }

  // Show thumbnail
  return (
    <div className={cn("w-full h-full relative", className)}>
      <img 
        src={generatedThumbnail!} 
        alt={alt}
        className="w-full h-full object-cover"
      />
      {showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
            <Play className="w-5 h-5 text-white ml-0.5" />
          </div>
        </div>
      )}
    </div>
  );
}
