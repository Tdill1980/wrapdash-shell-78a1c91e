import { MainLayout } from "@/layouts/MainLayout";
import { AIApprovalsCard } from "@/components/dashboard/AIApprovalsCard";

const AIApprovals = () => {
  return (
    <MainLayout>
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Approvals</h1>
            <p className="text-muted-foreground mt-1">
              Review and approve AI-generated quotes before they're sent to customers
            </p>
          </div>
        </div>
        
        <div className="max-w-4xl">
          <AIApprovalsCard />
        </div>
      </div>
    </MainLayout>
  );
};

export default AIApprovals;
