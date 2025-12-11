import React from "react";
import { X } from "lucide-react";

interface TeleprompterModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: string;
}

export function TeleprompterModal({ isOpen, onClose, script }: TeleprompterModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center p-6 md:p-12 cursor-pointer"
      onClick={onClose}
    >
      {/* Close hint */}
      <div className="absolute top-4 right-4 flex items-center gap-2 text-white/50 text-sm">
        <span>Tap anywhere to close</span>
        <X className="w-5 h-5" />
      </div>
      
      {/* Script text */}
      <div 
        className="text-white text-2xl md:text-4xl lg:text-5xl leading-relaxed md:leading-loose font-medium text-center max-w-4xl overflow-y-auto max-h-full"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {script.split("\n").map((line, i) => (
          <p key={i} className={line.trim() ? "mb-4 md:mb-6" : "mb-2"}>
            {line || "\u00A0"}
          </p>
        ))}
      </div>
    </div>
  );
}
