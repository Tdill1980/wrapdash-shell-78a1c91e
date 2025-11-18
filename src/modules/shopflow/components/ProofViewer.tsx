import { ShopFlowOrder } from '@/hooks/useShopFlow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProofViewerProps {
  order: ShopFlowOrder;
}

export const ProofViewer = ({ order }: ProofViewerProps) => {
  const files = order.files as any[] || [];
  const imageFiles = files.filter(f => f.type?.startsWith('image/'));

  return (
    <div className="bg-[#101016] border border-white/5 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-4">Proofs & Files</h3>

      <Tabs defaultValue="2d" className="w-full">
        <TabsList className="bg-black/20">
          <TabsTrigger value="2d">2D View</TabsTrigger>
          <TabsTrigger value="3d">3D View</TabsTrigger>
        </TabsList>

        <TabsContent value="2d" className="mt-4">
          {imageFiles.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {imageFiles.map((file, index) => (
                <img
                  key={index}
                  src={file.url}
                  alt={file.name}
                  className="w-full rounded-lg border border-white/10"
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No proof images available</p>
          )}
        </TabsContent>

        <TabsContent value="3d" className="mt-4">
          <p className="text-gray-500 text-sm">3D renders will appear here</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};
