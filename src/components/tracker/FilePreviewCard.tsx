import { FileText, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";

interface FileInfo {
  name: string;
  url: string;
  status: "print_ready" | "warning" | "error";
  thumbnailUrl?: string;
}

interface FilePreviewCardProps {
  file: FileInfo;
}

export function FilePreviewCard({ file }: FilePreviewCardProps) {
  const statusConfig = {
    print_ready: {
      icon: CheckCircle,
      badge: "Print Ready",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    warning: {
      icon: AlertTriangle,
      badge: "Warning",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
    },
    error: {
      icon: AlertCircle,
      badge: "Error",
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
  };

  const config = statusConfig[file.status];
  const StatusIcon = config.icon;

  return (
    <div className="bg-[#141414] border border-white/10 rounded-xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:border-white/20 transition-colors">
      <div className="flex items-start gap-4">
        {/* Thumbnail or Icon */}
        <div className="flex-shrink-0">
          {file.thumbnailUrl ? (
            <img 
              src={file.thumbnailUrl} 
              alt={file.name}
              className="w-16 h-16 rounded-lg object-cover border border-white/10"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
              <FileText className="w-8 h-8 text-white/40" />
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium font-inter truncate mb-1">
            {file.name}
          </p>
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${config.bgColor} border ${config.borderColor}`}>
            <StatusIcon className={`w-3.5 h-3.5 ${config.color}`} />
            <span className={`text-xs font-semibold ${config.color}`}>
              {config.badge}
            </span>
          </div>
        </div>

        {/* Download Button */}
        <a 
          href={file.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          View
        </a>
      </div>
    </div>
  );
}
