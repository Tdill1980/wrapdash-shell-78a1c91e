import { Upload, AlertTriangle } from "lucide-react";
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
}

export const UploadedFilesCard = ({ 
  files = [], 
  missingFiles = [], 
  fileErrors = [],
  internalMode = false,
  orderId,
  onFileUpload,
  uploading = false
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
    <div className="bg-[#111317] border border-white/10 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Upload className="w-5 h-5 text-[#2F81F7]" />
        <h3 className="card-header">
          {internalMode ? "Uploaded Files (Technical)" : "Files You Uploaded"}
        </h3>
      </div>

      {/* File Thumbnails or Upload UI */}
      {files.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file, index) => (
            <div key={index} className="flex flex-col gap-2">
              <FileThumbnail file={file} orderId={orderId} />
              <a 
                href={file.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-[#15D1FF] hover:underline truncate"
              >
                {file.name || `File ${index + 1}`}
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 bg-orange-500/10 border-2 border-orange-500/30 rounded-xl">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-orange-400 font-semibold text-lg mb-2">
                Missing Artwork Files
              </h4>
              <p className="text-white/70 text-sm mb-4">
                We haven't received your print files yet. Please upload them below or email them to{" "}
                <a href="mailto:artwork@weprintwraps.com" className="text-[#15D1FF] hover:underline">
                  artwork@weprintwraps.com
                </a>
              </p>
            </div>
          </div>
          
          {!internalMode && onFileUpload && (
            <div className="flex flex-col sm:flex-row gap-3">
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
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Upload className="animate-pulse" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload />
                    Upload Files
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                asChild
                className="flex-1"
              >
                <a href="mailto:artwork@weprintwraps.com?subject=Files for Order">
                  Email Files Instead
                </a>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Missing Files */}
      {missingFiles.length > 0 && (
        <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <h4 className="text-orange-400 font-semibold mb-2">
            {internalMode ? "Missing Files (Technical)" : "Missing Files"}
          </h4>
          <ul className="list-disc ml-6 text-white/70 text-sm space-y-1">
            {missingFiles.map((file, i) => (
              <li key={i}>{file}</li>
            ))}
          </ul>
        </div>
      )}

      {/* File Errors */}
      {fileErrors.length > 0 && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <h4 className="text-red-400 font-semibold mb-2">
            {internalMode ? "File Errors (Technical)" : "File Errors"}
          </h4>
          <ul className="list-disc ml-6 text-white/70 text-sm space-y-1">
            {fileErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
