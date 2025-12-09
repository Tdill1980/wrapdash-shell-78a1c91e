import { Badge } from "@/components/ui/badge";
import { Mail, MessageCircle, Phone, Instagram, Globe } from "lucide-react";

interface ChannelBadgeProps {
  channel: string;
  size?: "sm" | "md";
}

const channelConfig: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  emoji: string;
  className: string;
}> = {
  instagram: {
    icon: Instagram,
    label: "Instagram",
    emoji: "📸",
    className: "bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] text-white border-0 hover:opacity-90"
  },
  email: {
    icon: Mail,
    label: "Email",
    emoji: "✉️",
    className: "bg-blue-500 text-white border-0 hover:bg-blue-600"
  },
  sms: {
    icon: Phone,
    label: "SMS",
    emoji: "📱",
    className: "bg-green-500 text-white border-0 hover:bg-green-600"
  },
  website: {
    icon: Globe,
    label: "Website",
    emoji: "💬",
    className: "bg-purple-500 text-white border-0 hover:bg-purple-600"
  }
};

export function ChannelBadge({ channel, size = "sm" }: ChannelBadgeProps) {
  const config = channelConfig[channel] || channelConfig.website;
  const Icon = config.icon;
  
  return (
    <Badge className={`${config.className} ${size === "sm" ? "text-xs px-1.5 py-0.5" : "text-sm px-2 py-1"}`}>
      <span className="mr-1">{config.emoji}</span>
      {size === "md" && <span>{config.label}</span>}
    </Badge>
  );
}

export function ChannelIcon({ channel, className = "w-4 h-4" }: { channel: string; className?: string }) {
  const config = channelConfig[channel] || channelConfig.website;
  const Icon = config.icon;
  
  const colorClass = channel === "instagram" 
    ? "text-pink-500" 
    : channel === "email" 
    ? "text-blue-500" 
    : channel === "sms" 
    ? "text-green-500" 
    : "text-purple-500";
  
  return <Icon className={`${className} ${colorClass}`} />;
}
