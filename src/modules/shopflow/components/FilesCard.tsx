// 🟦 FILES CARD — grid of thumbnails + file names

import { FileThumbnail } from "./FileThumbnail";

export const FilesCard = ({ files, orderId }: any) => {
  return (
    <div className="bg-[#101016] border border-white/5 rounded-lg p-5 text-white">
      <h2 className="text-lg font-semibold mb-4">Uploaded Files</h2>

      {files.length === 0 && (
        <p className="text-gray-500 text-sm">No files uploaded.</p>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {files.map((file: any, idx: number) => (
            <div key={idx} className="flex flex-col items-center">
              <FileThumbnail file={file} orderId={orderId} />

              <a
                href={file.url}
                target="_blank"
                className="mt-2 text-blue-300 underline text-xs text-center break-all"
              >
                {file.name}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
