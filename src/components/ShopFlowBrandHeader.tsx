export const ShopFlowBrandHeader = () => {
  return (
    <div className="w-full mb-6">
      {/* Small WrapCommandAI Logo - top left */}
      <div className="w-full flex items-center px-4 pt-4">
        <img 
          src="/wrapcommand-logo.png"
          alt="WrapCommandAI"
          className="h-8 w-auto opacity-100 drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]"
        />
      </div>

      {/* ShopFlow Title */}
      <h1 className="text-3xl font-extrabold text-white tracking-wide px-4 mt-3 font-['Poppins']">
        ShopFlow™
      </h1>

      {/* Gradient Bar for 'for WePrintWraps.com' */}
      <div 
        className="w-full py-2 px-4 text-white font-semibold tracking-wide text-sm mt-2"
        style={{
          background: "linear-gradient(90deg, #2F81F7 0%, #15D1FF 100%)"
        }}
      >
        for WePrintWraps.com
      </div>
    </div>
  );
};
