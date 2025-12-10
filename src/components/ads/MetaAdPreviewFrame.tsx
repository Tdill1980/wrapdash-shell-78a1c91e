// src/components/ads/MetaAdPreviewFrame.tsx

import React, { useState, useRef } from "react";
import {
  META_PLACEMENTS,
  MetaPlacement,
  MetaPlacementFormat,
} from "@/lib/meta-ads";
import { cn } from "@/lib/utils";
import { Play, Pause, Volume2, VolumeX, Instagram, Facebook } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface MetaAdPreviewFrameProps {
  placement: MetaPlacement;
  mediaUrl?: string;
  caption?: string;
  showSafeZones?: boolean;
}

export function MetaAdPreviewFrame({
  placement,
  mediaUrl,
  caption,
  showSafeZones = false,
}: MetaAdPreviewFrameProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();

  const format: MetaPlacementFormat = META_PLACEMENTS[placement];

  if (!format) {
    return (
      <div className="p-6 text-center text-muted-foreground border rounded-xl">
        Invalid placement selected
      </div>
    );
  }

  const isVideo = mediaUrl?.includes(".mp4") || mediaUrl?.includes("mux") || mediaUrl?.includes("stream");
  const isInstagram = placement.startsWith("ig_");

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Calculate preview dimensions based on aspect ratio
  const getPreviewDimensions = (baseWidth: number) => {
    const aspectRatio = format.height / format.width;
    return {
      width: baseWidth,
      height: baseWidth * aspectRatio,
    };
  };

  const MediaContent = ({ className }: { className?: string }) => (
    <>
      {isVideo ? (
        <video
          ref={videoRef}
          src={mediaUrl}
          autoPlay
          muted={isMuted}
          loop
          playsInline
          className={cn("w-full h-full object-cover", className)}
        />
      ) : mediaUrl ? (
        <img
          src={mediaUrl}
          alt="Ad Preview"
          className={cn("w-full h-full object-cover", className)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted/50">
          <span className="text-muted-foreground text-sm">No media</span>
        </div>
      )}
    </>
  );

  const SafeZoneOverlay = () => (
    <>
      {showSafeZones && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-[15%] bg-yellow-500/20 border-b border-yellow-500/40" />
          <div className="absolute bottom-0 left-0 w-full h-[20%] bg-yellow-500/20 border-t border-yellow-500/40" />
        </div>
      )}
    </>
  );

  const CaptionOverlay = () => (
    <>
      {caption && placement === "ig_feed" && (
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent text-white text-xs p-3 pt-6 line-clamp-3">
          {caption}
        </div>
      )}
    </>
  );

  return (
    <div className="w-full flex flex-col items-center">
      {/* Placement Label */}
      <div className="flex items-center gap-2 mb-2">
        {isInstagram ? (
          <Instagram className="w-4 h-4 text-pink-500" />
        ) : (
          <Facebook className="w-4 h-4 text-blue-500" />
        )}
        <h3 className="text-lg font-semibold">{format.label}</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {format.width}×{format.height} • {format.aspectRatio}
      </p>

      {/* PREVIEW CONTAINER */}
      <div className="relative">
        {/* DESKTOP — DEVICE MOCKUPS */}
        {!isMobile && isInstagram && (
          <div className="relative mx-auto">
            {/* iPhone Frame (CSS-based) */}
            <div className="relative w-[320px] bg-black rounded-[48px] p-3 shadow-2xl border-4 border-zinc-800">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-10" />
              
              {/* Screen */}
              <div 
                className="relative bg-black overflow-hidden rounded-[36px]"
                style={getPreviewDimensions(294)}
              >
                {/* Instagram Header */}
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/60 to-transparent z-10 flex items-center px-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 p-0.5">
                    <div className="w-full h-full rounded-full bg-black" />
                  </div>
                  <span className="ml-2 text-white text-xs font-medium">your_brand</span>
                </div>

                <MediaContent />
                <SafeZoneOverlay />
                <CaptionOverlay />

                {/* Instagram Footer (for Stories/Reels) */}
                {(placement === "ig_story" || placement === "ig_reels") && (
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/80 to-transparent z-10 flex items-end pb-4 px-4">
                    <div className="flex-1">
                      <div className="w-full h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                        <span className="text-white text-sm font-medium">Shop Now</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Home Indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
            </div>
          </div>
        )}

        {/* DESKTOP — FACEBOOK BROWSER MOCKUP */}
        {!isMobile && !isInstagram && (
          <div className="relative w-[480px]">
            {/* Browser Frame */}
            <div className="bg-card rounded-xl shadow-2xl border overflow-hidden">
              {/* Browser Header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 ml-4">
                  <div className="bg-muted rounded-md px-3 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
                    <Facebook className="w-3 h-3 text-blue-500" />
                    facebook.com/ads
                  </div>
                </div>
              </div>

              {/* Facebook Feed Container */}
              <div className="p-4 bg-muted/30">
                <div className="bg-card rounded-lg shadow-sm border overflow-hidden max-w-[400px] mx-auto">
                  {/* Post Header */}
                  <div className="flex items-center gap-3 p-3 border-b">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">YB</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Your Brand</p>
                      <p className="text-xs text-muted-foreground">Sponsored</p>
                    </div>
                  </div>

                  {/* Ad Media */}
                  <div 
                    className="relative bg-black overflow-hidden"
                    style={getPreviewDimensions(400)}
                  >
                    <MediaContent />
                    <SafeZoneOverlay />
                  </div>

                  {/* CTA Button */}
                  <div className="p-3 border-t">
                    <button className="w-full bg-blue-500 text-white text-sm font-medium py-2 rounded-md hover:bg-blue-600 transition-colors">
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MOBILE — MINIMAL PREVIEW BOX */}
        {isMobile && (
          <div
            className="relative bg-black mx-auto overflow-hidden rounded-xl shadow-lg border border-border/50"
            style={getPreviewDimensions(260)}
          >
            <MediaContent />
            <SafeZoneOverlay />
            <CaptionOverlay />

            {/* Platform Badge */}
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur rounded-full p-1.5">
              {isInstagram ? (
                <Instagram className="w-4 h-4 text-pink-400" />
              ) : (
                <Facebook className="w-4 h-4 text-blue-400" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* VIDEO CONTROLS */}
      {isVideo && mediaUrl && (
        <div className="flex gap-2 mt-4 items-center">
          <button
            onClick={togglePlay}
            className="p-2 rounded-full bg-muted hover:bg-muted/70 transition-colors"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>

          <button
            onClick={toggleMute}
            className="p-2 rounded-full bg-muted hover:bg-muted/70 transition-colors"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      )}

      {/* Safe Zones Legend */}
      {showSafeZones && (
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
          <span className="w-3 h-3 bg-yellow-500/30 border border-yellow-500/50 rounded" />
          Safe zones — keep text/logos outside these areas
        </p>
      )}
    </div>
  );
}
