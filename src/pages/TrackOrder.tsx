import { OrderSummaryCard } from "@/components/tracker/OrderSummaryCard";
import { TimelineStepper } from "@/components/tracker/TimelineStepper";
import { FilePreviewCard } from "@/components/tracker/FilePreviewCard";
import { CurrentStageCard } from "@/components/tracker/CurrentStageCard";
import { NextStepCard } from "@/components/tracker/NextStepCard";
import { ActionRequiredCard } from "@/components/tracker/ActionRequiredCard";
import { OtherOrdersCarousel } from "@/components/tracker/OtherOrdersCarousel";

// Mock data for development
const mockOrder = {
  orderNumber: "12345",
  customerName: "John Smith",
  vehicle: "2023 Tesla Model 3",
  productType: "Full Vehicle Wrap - Matte Black",
  customer_stage: "printing",
  created_at: "2024-01-15T10:00:00Z",
  timeline: {
    orderReceived: "2024-01-15T10:00:00Z",
    filesReceived: "2024-01-15T14:30:00Z",
    preflight: "2024-01-16T09:00:00Z",
    preparingPrintFiles: "2024-01-17T11:00:00Z",
    printing: "2024-01-18T08:00:00Z",
  },
  files: [
    {
      name: "hood-panel.pdf",
      url: "#",
      status: "print_ready" as const,
      thumbnailUrl: undefined,
    },
    {
      name: "roof-panel.pdf",
      url: "#",
      status: "print_ready" as const,
      thumbnailUrl: undefined,
    },
    {
      name: "door-left.pdf",
      url: "#",
      status: "warning" as const,
      thumbnailUrl: undefined,
    },
  ],
  otherOrders: [
    {
      orderNumber: "12340",
      vehicle: "2022 BMW M3",
      productType: "PPF Full Front",
      customer_stage: "ready",
    },
    {
      orderNumber: "12338",
      vehicle: "2021 Porsche 911",
      productType: "Ceramic Coating",
      customer_stage: "qc",
    },
  ],
};

export default function TrackOrder() {
  return (
    <div className="min-h-screen bg-[#0B0B0B] p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-poppins text-white mb-2">
            Track Your Wrap
          </h1>
          <p className="text-white/60 text-sm">
            Real-time updates on your order production
          </p>
        </div>

        {/* Order Summary Section */}
        <OrderSummaryCard order={mockOrder} />

        {/* Timeline Stepper Section */}
        <TimelineStepper order={mockOrder} />

        {/* Action Required Section */}
        <ActionRequiredCard order={mockOrder} />

        {/* Grid Layout for Current Stage + Next Step */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CurrentStageCard order={mockOrder} />
          <NextStepCard order={mockOrder} />
        </div>

        {/* File Preview Section */}
        <div className="space-y-3">
          <h2 className="text-[22px] font-semibold font-poppins text-white">
            Your Files
          </h2>
          {mockOrder.files.map((file, index) => (
            <FilePreviewCard key={index} file={file} />
          ))}
        </div>

        {/* Other Orders Section */}
        <OtherOrdersCarousel orders={mockOrder.otherOrders} />
      </div>
    </div>
  );
}

