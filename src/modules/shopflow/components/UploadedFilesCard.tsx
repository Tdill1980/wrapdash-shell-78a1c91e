import { Upload, AlertTriangle, Mail } from "lucide-react";
import { FileThumbnail } from "./FileThumbnail";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

interface UploadedFilesCardProps {
  files?: any[];
  missingFiles?: any[];
  fileErrors?: any[];
  internalMode?: boolean;
  orderId?: string;
  onFileUpload?: (files: FileList) => void;
  uploading?: boolean;
  orderStatus?: string;
}

export const UploadedFilesCard = ({ 
  files = [], 
  missingFiles = [], 
  fileErrors = [],
  internalMode = false,
  orderId,
  onFileUpload,
  uploading = false,
  orderStatus
}: UploadedFilesCardProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0 && onFileUpload) {
      onFileUpload(selectedFiles);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  return (
    <div className="bg-gradient-to-br from-[#111317] to-fuchsia-950/10 border border-fuchsia-500/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Upload className="w-4 h-4 text-fuchsia-400" />
        <h3 className="text-sm font-semibold text-white">
          {internalMode ? "Uploaded Files (Technical)" : "Files You Uploaded"}
        </h3>
      </div>

      {/* File Thumbnails or Upload UI */}
      {files.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <a 
              key={index}
              href={file.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/30 rounded-lg transition-colors"
            >
              <FileThumbnail file={file} orderId={orderId} />
              <span className="text-xs text-fuchsia-300 hover:underline truncate max-w-[150px]">
                {file.name || `File ${index + 1}`}
              </span>
            </a>
          ))}
        </div>
      ) : orderStatus === 'dropbox-link-sent' ? (
        <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div>
              <h4 className="text-blue-400 font-semibold text-sm">
                Dropbox Link Sent
              </h4>
              <p className="text-white/70 text-xs mt-0.5">
                Check your email for the Dropbox upload link.
              </p>
            </div>
          </div>
        </div>
      ) : ['in-production', 'in_production', 'print-production', 'lamination', 'finishing', 'ready-for-print', 'shipped', 'completed'].includes(orderStatus || '') ? (
        <div className="p-4 bg-green-500/10 border border-green-400/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-white/70 text-sm">
                Files received and in production
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-orange-400 font-semibold text-sm mb-1">
                Missing Artwork Files
              </h4>
              <p className="text-white/70 text-xs">
                Upload files below or email to{" "}
                <a href={`mailto:Design@WePrintWraps.com?subject=Files for Order ${orderId || ''}`} className="text-[#15D1FF] hover:underline">
                  Design@WePrintWraps.com
                </a>
              </p>
            </div>
          </div>
          
          {!internalMode && onFileUpload && (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.ai,.eps,.psd,.png,.jpg,.jpeg,.svg"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                size="sm"
                className="flex-1 w-full sm:w-auto"
              >
                {uploading ? (
                  <>
                    <Upload className="w-3.5 h-3.5 sm:w-3 sm:h-3 animate-pulse" />
                    <span className="text-xs">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                    <span className="text-xs">Upload Files</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                asChild
                size="sm"
                className="flex-1 w-full sm:w-auto"
              >
                <a href={`mailto:Design@WePrintWraps.com?subject=Files for Order ${orderId || ''}`}>
                  <span className="text-xs">Email Instead</span>
                </a>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Missing Files */}
      {missingFiles.length > 0 && (
        <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <h4 className="text-orange-400 font-semibold text-xs mb-1">
            {internalMode ? "Missing Files (Technical)" : "Missing Files"}
          </h4>
          <ul className="list-disc ml-4 text-white/70 text-xs space-y-0.5">
            {missingFiles.map((file, i) => (
              <li key={i}>{file}</li>
            ))}
          </ul>
        </div>
      )}

      {/* File Errors */}
      {fileErrors.length > 0 && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <h4 className="text-red-400 font-semibold text-xs mb-1">
            {internalMode ? "File Errors (Technical)" : "File Errors"}
          </h4>
          <ul className="list-disc ml-4 text-white/70 text-xs space-y-0.5">
            {fileErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
