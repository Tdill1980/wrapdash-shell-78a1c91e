import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatWooStatus, getWooStatusColor, getWooStatusIcon } from "@/lib/woo-status-display";

interface CurrentStageCardProps {
  status: string; // Raw WooCommerce status
}

export const CurrentStageCard = ({ status }: CurrentStageCardProps) => {
  const Icon = getWooStatusIcon(status);
  const gradientColor = getWooStatusColor(status);

  return (
    <Card className="bg-[#1a1a24] border-white/5 p-6">
      <div className="flex items-start gap-4">
        <div className={`h-12 w-12 rounded-full bg-gradient-to-r ${gradientColor} flex items-center justify-center flex-shrink-0`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-white/60 mb-2">Current WooCommerce Status</h3>
          <p className="text-xl font-semibold text-white mb-3">
            {formatWooStatus(status)}
          </p>
          <Badge className={`bg-gradient-to-r ${gradientColor} text-white border-0`}>
            {status}
          </Badge>
        </div>
      </div>
    </Card>
  );
};
