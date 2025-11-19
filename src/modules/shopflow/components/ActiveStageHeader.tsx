import { format } from 'date-fns';
import { Clock } from 'lucide-react';

interface ActiveStageHeaderProps {
  stage: string;
  description: string;
  updatedAt: string;
}

export const ActiveStageHeader = ({ stage, description, updatedAt }: ActiveStageHeaderProps) => {
  return (
    <div className="bg-gradient-to-r from-[#101016] to-[#16161E] border border-white/10 rounded-2xl p-8 mb-10">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-[#8FD3FF] to-[#0047FF] text-white text-sm font-semibold mb-4">
            CURRENT STAGE
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            {stage.replace(/_/g, ' ').toUpperCase()}
          </h1>
          <p className="text-[#B8B8C7] text-lg max-w-2xl">
            {description}
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-[#B8B8C7] text-sm">
          <Clock className="w-4 h-4" />
          <span>Updated {format(new Date(updatedAt), 'MMM dd, yyyy')}</span>
        </div>
      </div>
    </div>
  );
};
