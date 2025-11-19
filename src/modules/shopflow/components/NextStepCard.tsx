import { Card } from '@/components/ui/card';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { InternalStage } from '../utils/stageEngine';

interface NextStepCardProps {
  nextStage: InternalStage | null;
}

export const NextStepCard = ({ nextStage }: NextStepCardProps) => {
  if (!nextStage) {
    return (
      <Card className="p-6 bg-gradient-to-r from-[#00AFFF]/10 to-[#0047FF]/10 border-[#00AFFF]/30 mb-10">
        <div className="flex items-center gap-4">
          <CheckCircle className="w-8 h-8 text-[#00AFFF]" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Order Complete</h3>
            <p className="text-[#B8B8C7] text-sm">
              This job has been completed and delivered to the customer.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-[#16161E] border-[#ffffff0f] mb-10">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-gradient-to-br from-[#00AFFF] to-[#0047FF]">
          <ArrowRight className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm text-[#B8B8C7] mb-1">NEXT STEP</h3>
          <p className="text-lg font-semibold text-white">
            {nextStage.replace(/_/g, ' ').toUpperCase()}
          </p>
        </div>
      </div>
    </Card>
  );
};
