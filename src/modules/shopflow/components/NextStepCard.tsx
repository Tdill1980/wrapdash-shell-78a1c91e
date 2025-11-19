// 🟩 NEXT STEP CARD — shows what happens next in the job flow

export const NextStepCard = ({ nextStage }: any) => {
  if (!nextStage) return null;

  const TEXT: any = {
    files_received: "Next: Review files and move job to Design.",
    in_design: "Next: Designer must upload a proof.",
    awaiting_approval: "Next: Customer must approve the proof.",
    design_complete: "Next: Send job to Print Production.",
    print_production: "Next: Prepare job for pickup or shipment.",
    ready_for_pickup: "Next: Mark job as Shipped or Completed.",
    shipped: "Job has completed production.",
  };

  return (
    <div className="bg-[#101016] border border-white/5 rounded-lg p-5 mb-10 text-white">
      <h2 className="text-lg font-semibold mb-2">What Happens Next</h2>
      <p className="text-gray-300 text-sm">{TEXT[nextStage] || "Next step coming soon…"}</p>
    </div>
  );
};
