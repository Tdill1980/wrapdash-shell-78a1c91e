import React from "react";

interface GlobalHeaderProps {
  userName?: string;
}

export const GlobalHeader = ({ userName = "User" }: GlobalHeaderProps) => {
  return (
    <>
      <header className="w-full bg-[#0D0F12] px-8 py-4 flex items-center justify-between border-b border-white/10">
        {/* WrapCommandAI™ Wordmark */}
        <h1 className="text-xl font-extrabold font-['Poppins'] tracking-wide">
          <span className="text-white">Wrap</span>
          <span className="bg-gradient-to-r from-[#2F81F7] to-[#15D1FF] bg-clip-text text-transparent">
            Command
          </span>
          <span className="text-cyan-300">AI™</span>
        </h1>

        {/* Right-side user display */}
        <div className="flex items-center gap-4 text-white/80">
          <span>Hi, {userName}</span>
          <div className="h-8 w-8 rounded-full border border-white/20 bg-gradient-to-br from-[#2F81F7] to-[#15D1FF] flex items-center justify-center text-white font-semibold text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Thin gradient accent bar */}
      <div className="w-full h-[3px] bg-gradient-to-r from-[#2F81F7] to-[#15D1FF]" />
    </>
  );
};
