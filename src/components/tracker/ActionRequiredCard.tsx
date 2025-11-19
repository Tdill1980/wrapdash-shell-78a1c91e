import { AlertCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionRequiredCardProps {
  order: {
    customer_stage: string;
    file_error_details?: string[];
    missing_file_list?: string[];
  };
}

export function ActionRequiredCard({ order }: ActionRequiredCardProps) {
  const isFileError = order.customer_stage === "file_error";
  const isMissingFile = order.customer_stage === "missing_file";

  if (!isFileError && !isMissingFile) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-red-500/20">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        
        <div className="flex-1">
          <h2 className="card-header mb-2">
            {isFileError ? "Action Required: File Error" : "Action Required: Missing File"}
          </h2>
          
          <p className="text-white/80 text-[14px] font-inter mb-4">
            {isFileError 
              ? "The following issues were detected during preflight and must be corrected:"
              : "The following files are required to proceed with production:"
            }
          </p>

          {/* Error List */}
          {isFileError && order.file_error_details && order.file_error_details.length > 0 && (
            <ul className="space-y-2 mb-4">
              {order.file_error_details.map((error, index) => (
                <li key={index} className="flex items-start gap-2 text-white/70 text-sm">
                  <span className="text-red-400 mt-1">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Missing File List */}
          {isMissingFile && order.missing_file_list && order.missing_file_list.length > 0 && (
            <ul className="space-y-2 mb-4">
              {order.missing_file_list.map((file, index) => (
                <li key={index} className="flex items-start gap-2 text-white/70 text-sm">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>{file}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Upload Button */}
          <Button className="bg-gradient-to-r from-[#5AC8FF] via-[#2F8CFF] to-[#1A5BFF] hover:opacity-90 text-white rounded-lg">
            <Upload className="w-4 h-4 mr-2" />
            Upload Corrected File
          </Button>
        </div>
      </div>
    </div>
  );
}
