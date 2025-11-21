export const ShopFlowBrandHeader = () => {
  return (
    <div className="w-full mb-6 bg-[#1a1a24] rounded-xl border border-white/5 overflow-hidden">
      {/* ShopFlow Title with Two-Tone Gradient */}
      <h1 className="text-4xl font-extrabold tracking-wide px-4 pt-4 font-['Poppins']">
        <span className="bg-gradient-to-r from-[#2F81F7] to-[#15D1FF] bg-clip-text text-transparent">ShopFlow</span>
        <span className="text-[10px] align-super opacity-70 text-white">™</span>
      </h1>

      {/* Description */}
      <p className="text-white/70 text-sm px-4 mt-2 max-w-2xl pb-4">
        WePrintWraps.com's real-time order tracking from print to delivery. Watch your project move through each stage of production with complete transparency.
      </p>
    </div>
  );
};
