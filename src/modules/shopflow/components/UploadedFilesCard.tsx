import { Upload } from "lucide-react";
import { FileThumbnail } from "./FileThumbnail";

interface UploadedFilesCardProps {
  files?: any[];
  missingFiles?: any[];
  fileErrors?: any[];
  internalMode?: boolean;
  orderId?: string;
}

export const UploadedFilesCard = ({ 
  files = [], 
  missingFiles = [], 
  fileErrors = [],
  internalMode = false,
  orderId
}: UploadedFilesCardProps) => {
  return (
    <div className="bg-[#111317] border border-white/10 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Upload className="w-5 h-5 text-[#2F81F7]" />
        <h3 className="text-lg font-semibold text-white">
          {internalMode ? "Uploaded Files (Technical)" : "Files You Uploaded"}
        </h3>
      </div>

      {/* File Thumbnails */}
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
        <p className="text-white/60 text-sm">No files uploaded yet.</p>
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
