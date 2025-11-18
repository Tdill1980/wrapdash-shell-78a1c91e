import { OrderSummaryCard } from "@/components/tracker/OrderSummaryCard";
import { TimelineStepper } from "@/components/tracker/TimelineStepper";
import { FilePreviewCard } from "@/components/tracker/FilePreviewCard";
import { CurrentStageCard } from "@/components/tracker/CurrentStageCard";
import { NextStepCard } from "@/components/tracker/NextStepCard";
import { ActionRequiredCard } from "@/components/tracker/ActionRequiredCard";
import { OtherOrdersCarousel } from "@/components/tracker/OtherOrdersCarousel";

export default function TrackOrder() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-poppins text-foreground">
            Track Your Wrap
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time updates on your order
          </p>
        </div>

        {/* Order Summary Section */}
        <section>
          <OrderSummaryCard />
        </section>

        {/* Timeline Stepper Section */}
        <section>
          <TimelineStepper />
        </section>

        {/* Action Required Section */}
        <section>
          <ActionRequiredCard />
        </section>

        {/* Current Stage Section */}
        <section>
          <CurrentStageCard />
        </section>

        {/* Next Step Section */}
        <section>
          <NextStepCard />
        </section>

        {/* File Preview Section */}
        <section>
          <FilePreviewCard />
        </section>

        {/* Other Orders Section */}
        <section>
          <OtherOrdersCarousel />
        </section>
      </div>
    </div>
  );
}

