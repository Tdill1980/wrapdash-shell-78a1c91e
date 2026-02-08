import { Package, FileImage, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OrderLineItem {
  id: string;
  product_name: string;
  product_image_url: string | null;
  quantity: number;
  square_footage: number | null;
  material: string | null;
  finish: string | null;
  files: any[];
  file_status: string;
}

interface OrderItemsCardProps {
  orderNumber: string;
  orderTotal?: number;
}

// ShopFlow 2.0 gradient accents
const NEON_ACCENT = "text-fuchsia-400";
const NEON_BORDER = "border-fuchsia-500/30";
const NEON_BG = "bg-gradient-to-br from-fuchsia-500/10 via-purple-500/10 to-blue-500/10";

export const OrderItemsCard = ({ orderNumber, orderTotal }: OrderItemsCardProps) => {
  const [lineItems, setLineItems] = useState<OrderLineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLineItems = async () => {
      const { data, error } = await supabase
        .from('shopflow_order_items')
        .select('*')
        .eq('order_number', orderNumber)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching line items:', error);
      } else {
        setLineItems(data || []);
      }
      setLoading(false);
    };

    fetchLineItems();
  }, [orderNumber]);

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  };

  if (loading) {
    return (
      <div className={`${NEON_BG} border ${NEON_BORDER} rounded-xl p-4 sm:p-5`}>
        <div className="animate-pulse flex gap-4">
          <div className="w-20 h-20 bg-white/10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded w-3/4" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (lineItems.length === 0) {
    return null;
  }

  return (
    <div className={`${NEON_BG} border ${NEON_BORDER} rounded-xl p-4 sm:p-5`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className={`w-5 h-5 ${NEON_ACCENT}`} />
          <h3 className="text-lg font-bold text-white">Your Order</h3>
          <span className="text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
            {lineItems.length} {lineItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        {orderTotal && (
          <div className="text-right">
            <p className="text-xs text-white/50">Total</p>
            <p className={`text-lg font-bold ${NEON_ACCENT}`}>
              ${orderTotal.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* Line Items */}
      <div className="space-y-4">
        {lineItems.map((item, index) => (
          <div 
            key={item.id} 
            className="flex gap-4 p-3 bg-black/20 rounded-xl border border-white/5 hover:border-fuchsia-500/20 transition-colors"
          >
            {/* Product Image */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-white/5">
              {item.product_image_url ? (
                <img
                  src={item.product_image_url}
                  alt={item.product_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.querySelector('.fallback')?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`fallback ${item.product_image_url ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                <Package className="w-8 h-8 text-white/30" />
              </div>
            </div>

            {/* Product Details */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white text-sm sm:text-base truncate">
                {item.product_name}
              </h4>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
                <div>
                  <span className="text-white/50">Qty:</span>{' '}
                  <span className="text-white font-medium">{item.quantity}</span>
                </div>
                {item.square_footage && (
                  <div>
                    <span className="text-white/50">Size:</span>{' '}
                    <span className="text-white font-medium">{item.square_footage} sq ft</span>
                  </div>
                )}
                {item.material && (
                  <div className="col-span-2">
                    <span className="text-white/50">Material:</span>{' '}
                    <span className="text-white font-medium">{item.material}</span>
                  </div>
                )}
                {item.finish && (
                  <div className="col-span-2">
                    <span className="text-white/50">Finish:</span>{' '}
                    <span className="text-white font-medium">{item.finish}</span>
                  </div>
                )}
              </div>

              {/* File Status Badge */}
              <div className="mt-2">
                {item.file_status === 'complete' || (item.files && item.files.length > 0) ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    {item.files?.length || 0} file{(item.files?.length || 0) !== 1 ? 's' : ''} uploaded
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    <AlertCircle className="w-3 h-3" />
                    Awaiting files
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Uploaded Art Thumbnails - Source of Truth */}
      {lineItems.some(item => item.files && item.files.length > 0) && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <FileImage className={`w-4 h-4 ${NEON_ACCENT}`} />
            <h4 className="text-sm font-semibold text-white">Uploaded Artwork</h4>
            <span className="text-[10px] text-fuchsia-300 bg-fuchsia-500/20 px-2 py-0.5 rounded-full">
              SOURCE OF TRUTH
            </span>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {lineItems.flatMap((item, itemIndex) => 
              (item.files || []).map((file: any, fileIndex: number) => (
                <a
                  key={`${itemIndex}-${fileIndex}`}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded-lg border border-fuchsia-500/30 bg-black/30 overflow-hidden hover:border-fuchsia-400/60 hover:shadow-[0_0_10px_rgba(255,0,255,0.3)] transition-all"
                >
                  {isImage(file.url) ? (
                    <img
                      src={file.url}
                      alt={file.name || `Artwork ${fileIndex + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.querySelector('.file-fallback')?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`file-fallback ${isImage(file.url) ? 'hidden' : ''} absolute inset-0 flex flex-col items-center justify-center p-1`}>
                    <FileImage className="w-6 h-6 text-fuchsia-400/50 mb-1" />
                    <p className="text-[8px] text-white/50 text-center truncate w-full px-1">
                      {file.name?.split('.').pop()?.toUpperCase() || 'FILE'}
                    </p>
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ExternalLink className="w-4 h-4 text-white" />
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
