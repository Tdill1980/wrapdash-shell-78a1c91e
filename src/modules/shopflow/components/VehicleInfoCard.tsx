import { ShopFlowOrder } from '@/hooks/useShopFlow';

interface VehicleInfoCardProps {
  order: ShopFlowOrder;
}

export const VehicleInfoCard = ({ order }: VehicleInfoCardProps) => {
  const vehicleInfo = order.vehicle_info as any;
  
  return (
    <div className="bg-[#101016] border border-white/5 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-2">Vehicle</h3>
      {vehicleInfo ? (
        <>
          <p className="text-gray-300 text-sm">
            {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
          </p>
          {vehicleInfo.vin && (
            <p className="text-gray-500 text-xs mt-2">VIN: {vehicleInfo.vin}</p>
          )}
        </>
      ) : (
        <p className="text-gray-500 text-sm">No vehicle information</p>
      )}
    </div>
  );
};
