// ✨ EXTERNAL CUSTOMER PORTAL — SAFE, CLEAN, PREMIUM
// Replace ENTIRE file with this.

import { useParams } from "react-router-dom";
import { useShopFlow } from "@/hooks/useShopFlow";
import { useApproveFlow } from "@/hooks/useApproveFlow";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

import {
  getStageFromWoo,
  getCustomerStageLabel,
  getCustomerStageDescription,
  buildCustomerTimeline,
} from "@/modules/shopflow/utils/stageEngine";

import { FileThumbnail } from "@/modules/shopflow/components/FileThumbnail";
import { MainLayout } from "@/layouts/MainLayout";

export default function CustomerOrder() {
  const { id } = useParams<{ id: string }>();
  const { order, loading } = useShopFlow(id);
  const { approveDesign, requestRevision } = useApproveFlow(order?.approveflow_project_id);
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const { toast } = useToast();

  if (loading)
    return (
      <MainLayout userName="Customer">
        <div className="flex items-center justify-center min-h-screen text-gray-400">
          Loading your order…
        </div>
      </MainLayout>
    );

  if (!order)
    return (
      <MainLayout userName="Customer">
        <div className="flex items-center justify-center min-h-screen text-gray-400">
          Order not found.
        </div>
      </MainLayout>
    );

  // Customer-safe stage translation
  const internalStage = getStageFromWoo(order.status);
  const stageLabel = getCustomerStageLabel(internalStage);
  const stageDescription = getCustomerStageDescription(internalStage);

  // Customer-safe timeline
  const timeline = buildCustomerTimeline(order);

  // Extract Woo files (only customer-uploaded)
  const files: any[] = [];
  order.line_items?.forEach((item: any) => {
    item.meta_data?.forEach((meta: any) => {
      if (String(meta.key).toLowerCase().includes("upload files")) {
        files.push({
          name: meta.value.split("/").pop(),
          url: meta.value,
        });
      }
    });
  });

  return (
    <MainLayout userName="Customer">
      <div className="w-full space-y-6">

      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-50 bg-[#0A0A0F]/90 backdrop-blur-md py-4 border-b border-white/10">
        <h1 className="text-white text-lg font-semibold">
          Tracking Order #{order.woo_order_number ?? order.order_number}
        </h1>

        <div className="w-full h-[6px] mt-4 bg-gradient-to-r from-[#8FD3FF] via-[#6AB9FF] to-[#0047FF] rounded-md"></div>
      </div>

      {/* Stage Hero */}
      <div className="bg-[#101016] border border-white/10 rounded-xl p-7 mt-8 shadow-lg">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-[#8FD3FF] to-[#0047FF] text-transparent bg-clip-text">
          {stageLabel}
        </h2>
        <p className="text-gray-400 mt-2">{stageDescription}</p>
      </div>

      {/* What Happens Next */}
      <div className="bg-[#101016] border border-white/10 rounded-xl p-6 mt-6">
        <h3 className="text-white text-lg font-semibold mb-2">What Happens Next</h3>

        <p className="text-gray-300 text-sm">
          {getCustomerStageDescription(internalStage, true)}
        </p>
      </div>

      {/* Files the customer uploaded */}
      <div className="bg-[#101016] border border-white/10 rounded-xl p-6 mt-10">
        <h3 className="text-white text-lg font-semibold mb-4">Your Uploaded Files</h3>

        {files.length === 0 && (
          <p className="text-gray-500 text-sm">You have not uploaded any files yet.</p>
        )}

        {files.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {files.map((file, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <FileThumbnail file={file} orderId={order.id} />

                <a
                  href={file.url}
                  target="_blank"
                  className="text-blue-300 underline text-xs mt-2 text-center"
                >
                  {file.name}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proof Viewer */}
      {order.proof_url && (
        <div className="bg-[#101016] border border-white/10 rounded-xl p-6 mt-10 shadow-lg">
          <h3 className="text-white text-lg font-semibold mb-4">Your Design Proof</h3>

          <img src={order.proof_url} className="rounded-md w-full max-w-xl mx-auto" />

          {!showRevisionForm ? (
            <div className="flex gap-3 mt-4 justify-center">
              <button 
                onClick={async () => {
                  await approveDesign();
                  toast({
                    title: "Design Approved! 🎉",
                    description: "Your approval has been recorded. We'll move forward with production.",
                  });
                }}
                className="px-4 py-2 rounded-md bg-gradient-to-r from-[#8FD3FF] to-[#0047FF] text-white hover:opacity-90 transition-opacity"
              >
                Approve Design
              </button>
              <button 
                onClick={() => setShowRevisionForm(true)}
                className="px-4 py-2 rounded-md bg-[#16161E] text-white border border-white/10 hover:bg-[#1e1e2a] transition-colors"
              >
                Request Revision
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <h4 className="text-white font-medium">What would you like changed?</h4>
              <Textarea
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Please describe the changes you'd like to see..."
                className="bg-[#16161E] border-white/10 text-white min-h-[100px]"
              />
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (!revisionNotes.trim()) {
                      toast({
                        title: "Please add details",
                        description: "Tell us what you'd like changed",
                        variant: "destructive",
                      });
                      return;
                    }
                    await requestRevision(revisionNotes);
                    setRevisionNotes("");
                    setShowRevisionForm(false);
                    toast({
                      title: "Revision Requested",
                      description: "Our design team will review your feedback and update the proof.",
                    });
                  }}
                  className="px-4 py-2 rounded-md bg-gradient-to-r from-[#8FD3FF] to-[#0047FF] text-white hover:opacity-90 transition-opacity"
                >
                  Submit Revision
                </button>
                <button
                  onClick={() => {
                    setShowRevisionForm(false);
                    setRevisionNotes("");
                  }}
                  className="px-4 py-2 rounded-md bg-[#16161E] text-white border border-white/10 hover:bg-[#1e1e2a] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="bg-[#101016] border border-white/10 rounded-xl p-6 mt-10">
        <h3 className="text-white text-lg font-semibold mb-4">Order Progress</h3>

        <div className="space-y-6">
          {timeline.map((t: any, idx: number) => (
            <div key={idx} className="flex items-start gap-4">
              {/* Blue Dot */}
              <div
                className={`w-4 h-4 rounded-full mt-1 ${
                  t.active
                    ? "bg-gradient-to-r from-[#8FD3FF] to-[#0047FF]"
                    : "bg-gray-600"
                }`}
              ></div>

              <div>
                <p className="text-white text-sm">{t.label}</p>
                <p className="text-gray-500 text-xs">{t.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Box */}
      <div className="bg-[#101016] border border-white/10 rounded-xl p-6 mt-10 mb-20">
        <h3 className="text-white text-lg font-semibold mb-2">Need Help?</h3>
        <p className="text-gray-400 text-sm mb-3">
          If you have questions about your order, we're here to help.
        </p>
        <a
          href={`mailto:${order.customer_email}`}
          className="text-blue-300 underline text-sm"
        >
          Email Support
        </a>
      </div>
      </div>
    </MainLayout>
  );
}
