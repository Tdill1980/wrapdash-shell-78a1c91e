import { ShopFlowOrder } from '@/hooks/useShopFlow';

interface UploadedFilesCardProps {
  order: ShopFlowOrder;
}

export const UploadedFilesCard = ({ order }: UploadedFilesCardProps) => {
  const files = order.files as any[] || [];

  return (
    <div className="bg-[#101016] border border-white/5 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-2">Files</h3>

      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li key={index}>
              <a href={file.url} className="text-blue-300 text-sm underline hover:text-blue-200">
                {file.name || `File ${index + 1}`}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-sm">No files uploaded</p>
      )}
    </div>
  );
};
