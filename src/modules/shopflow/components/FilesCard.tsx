import { Card } from '@/components/ui/card';
import { FileText, Download, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface File {
  name: string;
  url: string;
}

interface FilesCardProps {
  files: File[];
  orderId: string;
}

export const FilesCard = ({ files, orderId }: FilesCardProps) => {
  const isImage = (filename: string) => {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename);
  };

  return (
    <Card className="p-6 bg-[#16161E] border-[#ffffff0f]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Uploaded Files</h3>
        <span className="text-sm text-[#B8B8C7]">{files.length} file(s)</span>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-8 text-[#B8B8C7]">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No files uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="group relative rounded-lg border border-[#ffffff0f] overflow-hidden hover:border-[#00AFFF] transition-all"
            >
              {isImage(file.name) ? (
                <div className="aspect-square bg-[#0A0A0F] relative">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={file.url}
                      download
                      className="p-2 rounded-full bg-[#00AFFF] hover:bg-[#0047FF] transition"
                    >
                      <Download className="w-5 h-5 text-white" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="aspect-square bg-[#0A0A0F] flex flex-col items-center justify-center p-4">
                  <FileText className="w-12 h-12 text-[#00AFFF] mb-2" />
                  <a
                    href={file.url}
                    download
                    className="text-xs text-center text-[#B8B8C7] hover:text-white transition line-clamp-2"
                  >
                    {file.name}
                  </a>
                </div>
              )}
              
              <div className="p-2 bg-[#101016] border-t border-[#ffffff0f]">
                <p className="text-xs text-[#B8B8C7] truncate">{file.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-[#ffffff0f]">
        <Button
          variant="outline"
          className="w-full border-[#00AFFF] text-[#00AFFF] hover:bg-[#00AFFF]/10"
        >
          <FileText className="w-4 h-4 mr-2" />
          Request Additional Files
        </Button>
      </div>
    </Card>
  );
};
