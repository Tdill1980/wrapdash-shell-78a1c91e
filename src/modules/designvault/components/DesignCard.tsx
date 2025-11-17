import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DesignVisualization } from "../hooks/useDesignVault";
import { Eye, RotateCcw, Download, Info, Clock, Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DesignCardProps {
  design: DesignVisualization;
  onClick: () => void;
  onDelete?: () => void;
}

export const DesignCard = ({ design, onClick, onDelete }: DesignCardProps) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const renderUrls = design.render_urls as { hero?: string } | null;
  const heroImage = renderUrls?.hero || "/placeholder.svg";
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Mock multiple images for carousel (in real app, would come from render_urls)
  const images = [heroImage, heroImage];

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this design?')) {
      return;
    }

    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('color_visualizations')
        .delete()
        .eq('id', design.id);

      if (error) throw error;

      toast({
        title: "Design deleted",
        description: "The design has been removed from DesignVault",
      });

      onDelete?.();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete design",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card
      className="group cursor-pointer overflow-hidden bg-black border-white/5 rounded-lg hover:border-purple-500/30 transition-all duration-300 flex flex-col"
      onClick={onClick}
    >
      {/* Delete Button */}
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {/* Hero Render with Carousel */}
      <div className="relative w-full aspect-[4/3] flex-shrink-0 overflow-hidden bg-[#3A3A3A]">
        <img
          src={images[currentImageIndex]}
          alt={`${design.vehicle_make} ${design.vehicle_model}`}
          className="w-full h-full object-contain"
        />
        
        {/* Panel Type Badge - Top Left */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className="bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] text-white font-semibold uppercase tracking-wide flex items-center gap-1">
            {design.vehicle_type === 'truck' ? '2-SIDES PANEL' : 'FULL PANEL'}
            <Info className="w-3 h-3" />
          </div>
        </div>

        {/* Exclusive Badge - Top Right */}
        {design.tags && design.tags.includes('exclusive') && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-[#E91E8C] text-white border-0 text-[10px] px-2.5 py-1 rounded-full">
              ✦ Exclusive
            </Badge>
          </div>
        )}

        {/* Carousel Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentImageIndex ? 'bg-white w-6' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col bg-black">
        {/* Title */}
        <h3 className="font-bold text-base text-white mb-1">
          Custom Design
        </h3>
        
        {/* Subtitle */}
        <p className="text-xs text-white/60 mb-3">
          {design.vehicle_type === 'truck' ? '2-sides Panel Design' : 'full Panel Design'} • restyle
        </p>

        {/* Timer */}
        <div className="flex items-center gap-1.5 text-[#E91E8C] mb-4">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-sm font-medium">02:35:26</span>
        </div>

        {/* Icon Actions */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="flex-1 h-9 bg-[#1A1A1A] border border-white/10 rounded flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            <Eye className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="flex-1 h-9 bg-[#1A1A1A] border border-white/10 rounded flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="flex-1 h-9 bg-[#1A1A1A] border border-white/10 rounded flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            <Download className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* CTA Button */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="w-full h-11 bg-[#E91E8C] hover:bg-[#D11A7E] text-white font-semibold rounded-lg transition-colors mb-3"
        >
          🎨 See on Your Vehicle (Free)
        </Button>

        {/* Footer Text */}
        <p className="text-xs text-white/50 text-center">
          Free mockup • Print-ready panel files $140
        </p>
      </div>
    </Card>
  );
};
