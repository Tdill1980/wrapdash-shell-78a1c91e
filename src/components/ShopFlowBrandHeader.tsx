interface ShopFlowBrandHeaderProps {
  syncButton?: React.ReactNode;
}

export const ShopFlowBrandHeader = ({ syncButton }: ShopFlowBrandHeaderProps) => {
  return (
    <div className="w-full mb-6 bg-gradient-to-br from-[#1a1a24] via-[#1a1a24] to-fuchsia-950/20 rounded-xl border border-fuchsia-500/20 overflow-hidden relative shadow-[0_0_30px_rgba(255,0,255,0.1)]">
      {/* Admin Sync Button - Top Right Corner */}
      {syncButton && (
        <div className="absolute top-4 right-4 z-10">
          {syncButton}
        </div>
      )}

      {/* ShopFlow Title with Neon Gradient: Magenta → Purple → Blue */}
      <h1 className="text-4xl font-extrabold tracking-wide px-4 pt-4 font-['Poppins']">
        <span className="text-white">Shop</span>
        <span className="bg-gradient-to-r from-[#FF00FF] via-[#9D4EDD] to-[#2F81F7] bg-clip-text text-transparent">Flow</span>
        <span className="text-[10px] align-super opacity-70 text-fuchsia-300">™</span>
      </h1>

      {/* Description */}
      <p className="text-white/70 text-sm px-4 mt-2 max-w-2xl pb-4">
        WePrintWraps.com's real-time order tracking from print to delivery. Watch your project move through each stage of production with complete transparency.
      </p>
    </div>
  );
};
