interface ShopFlowHeaderProps {
  orderNumber: string | number;
  productName: string;
  customerName: string;
  vehicle: any;
}

export const ShopFlowHeader = ({ orderNumber, productName, customerName, vehicle }: ShopFlowHeaderProps) => {
  const vehicleInfo = vehicle as any;
  const vehicleDisplay = vehicleInfo 
    ? `${vehicleInfo.year || ''} ${vehicleInfo.make || ''} ${vehicleInfo.model || ''}`.trim()
    : 'No vehicle information';

  return (
    <div 
      className="w-full rounded-xl p-8 text-white mb-6"
      style={{
        background: "linear-gradient(90deg, #2F81F7 0%, #15D1FF 100%)"
      }}
    >
      <h1 className="text-2xl font-bold tracking-wide mb-1">SHOPFLOW™</h1>
      <p className="text-sm opacity-80 mb-4">Real-Time Wrap Production Tracking</p>

      <div className="space-y-1">
        <p className="text-lg font-semibold">Order #{orderNumber}</p>
        <p className="text-md">{productName}</p>
        <p className="text-md">{vehicleDisplay}</p>
        <p className="text-md opacity-90">Customer: {customerName}</p>
      </div>
    </div>
  );
};
