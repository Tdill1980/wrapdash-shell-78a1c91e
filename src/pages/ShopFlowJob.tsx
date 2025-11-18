import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useShopFlow } from "@/hooks/useShopFlow";
import {
  ArrowLeft,
  Clock,
  User,
  Package,
  Calendar,
  FileText,
  FileImage,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { wooToInternalStatus, internalToCustomerStatus } from "@/lib/status-mapping";

// ---------------------------------------------------------
// STAGE DEFINITIONS
// ---------------------------------------------------------

const progressStages = [
  { id: "order_received", label: "Order Received" },
  { id: "files_received", label: "Files Received" },
  { id: "preflight", label: "Preflight Check" },
  { id: "preparing_print_files", label: "Preparing Print Files" },
  { id: "awaiting_approval", label: "Awaiting Approval" },
  { id: "printing", label: "Printing" },
  { id: "laminating", label: "Laminating" },
  { id: "cutting", label: "Cutting & Prep" },
  { id: "qc", label: "Quality Check" },
  { id: "ready", label: "Ready" },
];

const internalStatusOptions = [
  { value: "processing", label: "Processing", stage: "Order Received" },
  { value: "missing-file", label: "Missing File", stage: "File Missing" },
  { value: "file-error", label: "File Error", stage: "File Error" },
  { value: "in-design", label: "In Design", stage: "Preparing Print Files" },
  { value: "design-complete", label: "Design Complete", stage: "Awaiting Approval" },
  { value: "print-production", label: "Print Production", stage: "Printing" },
  { value: "lamination", label: "Lamination", stage: "Laminating" },
  { value: "finishing", label: "Finishing", stage: "Cutting" },
  { value: "ready-for-pickup", label: "Ready For Pickup", stage: "Ready" },
  { value: "shipped", label: "Shipped", stage: "Ready" },
  { value: "completed", label: "Completed", stage: "Ready" },
];

const priorityOptions = [
  { value: "low", label: "Low", color: "bg-gray-500/10 text-gray-300 border-gray-500/20" },
  { value: "normal", label: "Normal", color: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
  { value: "high", label: "High", color: "bg-red-500/10 text-red-300 border-red-500/20" },
];

// ---------------------------------------------------------
// STAGE MESSAGING
// ---------------------------------------------------------

const getStageMessage = (stage: string): string => {
  const messages: Record<string, string> = {
    order_received: "Order received and queued for processing.",
    files_received: "Artwork files received.",
    preflight: "Preflight check in progress.",
    preparing_print_files: "Preparing print-ready panels for production.",
    awaiting_approval: "Awaiting customer approval.",
    printing: "Print production in progress.",
    laminating: "Lamination in progress.",
    cutting: "Cutting and finishing in progress.",
    qc: "Final quality inspection in progress.",
    ready: "Order complete and ready for shipment/pickup.",
    file_error: "Preflight detected file errors.",
    missing_file: "Awaiting missing files from customer.",
  };
  return messages[stage] || "Processing order.";
};

const getNextStep = (stage: string): string => {
  const nextSteps: Record<string, string> = {
    order_received: "Awaiting customer artwork files.",
    files_received: "Running preflight check.",
    preflight: "Preparing print-ready files.",
    preparing_print_files: "Queueing for print production.",
    awaiting_approval: "Awaiting customer approval.",
    printing: "Moving to lamination.",
    laminating: "Moving to cutting/finishing.",
    cutting: "Final quality inspection.",
    qc: "Packaging and preparing for shipment.",
    ready: "Notify customer or ship order.",
    file_error: "Awaiting corrected files.",
    missing_file: "Awaiting missing files.",
  };
  return nextSteps[stage] || "Continue processing.";
};

// ---------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------

export default function ShopFlowJob() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    order,
    logs,
    loading,
    updateOrderStatus,
    updateOrderDetails,
    addTracking,
  } = useShopFlow(id);

  const [notes, setNotes] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [addingTracking, setAddingTracking] = useState(false);

  // INVALID OR LOADING
  if (!id || id === ":id") {
    return (
      <div className="max-w-4xl space-y-6 text-white">
        <Button variant="ghost" onClick={() => navigate("/shopflow")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
        <Card className="bg-[#141414] border border-white/10 p-12 text-center">
          <p className="text-white/60">Invalid order ID.</p>
        </Card>
      </div>
    );
  }

  if (loading || !order) {
    return (
      <div className="max-w-4xl space-y-6 text-white">
        <Button variant="ghost" onClick={() => navigate("/shopflow")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
        <Card className="bg-[#141414] border border-white/10 p-12 text-center">
          <p className="text-white/60">Loading order...</p>
        </Card>
      </div>
    );
  }

  // CURRENT STAGE MAPPING
  const internalStatus = wooToInternalStatus[order.status] || "order_received";
  const customerStage =
    order.customer_stage ||
    internalToCustomerStatus[internalStatus] ||
    "order_received";

  const currentStageIndex = progressStages.findIndex(
    (s) => s.id === customerStage
  );

  const preflightStatus = order.preflight_status || "pending";
  const files = Array.isArray(order.files) ? order.files : [];

  return (
    <div className="max-w-7xl mx-auto space-y-10 text-white">
      {/* BACK BUTTON */}
      <Button variant="ghost" onClick={() => navigate("/shopflow")}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
      </Button>

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">Order #{order.order_number}</h1>
        <p className="text-white/60">{order.customer_name}</p>
      </div>

      {/* TIMELINE */}
      <Card className="bg-[#141414] border border-white/10 p-8">
        <h2 className="text-xl font-semibold mb-6">Production Timeline</h2>

        <div className="flex items-center gap-6 overflow-x-auto pb-4">
          {progressStages.map((stage, i) => {
            const isComplete = i < currentStageIndex;
            const isActive = i === currentStageIndex;

            return (
              <div key={stage.id} className="flex flex-col items-center">
                <div
                  className={[
                    "w-5 h-5 rounded-full",
                    isComplete
                      ? "bg-gradient-to-r from-[#5AC8FF] to-[#1A5BFF] ring-2 ring-[#5AC8FF]/40"
                      : isActive
                      ? "bg-gradient-to-r from-[#5AC8FF] to-[#1A5BFF] ring-4 ring-[#5AC8FF]/50"
                      : "bg-white/20 border border-white/10",
                  ].join(" ")}
                />
                <p className="text-xs text-white/60 mt-2">{stage.label}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* CURRENT + NEXT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CURRENT */}
        <Card className="bg-[#141414] border border-white/10 p-6">
          <h2 className="text-lg font-semibold">Current Stage</h2>
          <p className="text-2xl font-bold mt-2">
            {progressStages.find((s) => s.id === customerStage)?.label}
          </p>
          <p className="text-white/60 mt-2">{getStageMessage(customerStage)}</p>
        </Card>
      </div>
    </div>
  );
}
