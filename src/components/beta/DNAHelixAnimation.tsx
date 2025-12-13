import { useEffect, useState } from "react";

export const DNAHelixAnimation = () => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((r) => (r + 2) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const nucleotides = Array.from({ length: 10 }, (_, i) => i);

  return (
    <div className="relative w-24 h-32 mx-auto">
      {/* DNA Double Helix */}
      <svg viewBox="0 0 100 140" className="w-full h-full">
        <defs>
          {/* Gradient for strands */}
          <linearGradient id="dnaGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(198, 100%, 50%)" />
            <stop offset="100%" stopColor="hsl(180, 100%, 50%)" />
          </linearGradient>
          <linearGradient id="dnaGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(280, 80%, 60%)" />
            <stop offset="100%" stopColor="hsl(320, 80%, 60%)" />
          </linearGradient>
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {nucleotides.map((i) => {
          const y = 10 + i * 12;
          const phase = (rotation + i * 36) * (Math.PI / 180);
          const x1 = 50 + Math.sin(phase) * 25;
          const x2 = 50 - Math.sin(phase) * 25;
          const opacity = 0.3 + Math.abs(Math.cos(phase)) * 0.7;

          return (
            <g key={i} filter="url(#glow)">
              {/* Left strand node */}
              <circle
                cx={x1}
                cy={y}
                r={4}
                fill="url(#dnaGradient1)"
                opacity={opacity}
              />
              {/* Right strand node */}
              <circle
                cx={x2}
                cy={y}
                r={4}
                fill="url(#dnaGradient2)"
                opacity={opacity}
              />
              {/* Connecting bridge */}
              <line
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke="hsl(198, 100%, 50%)"
                strokeWidth={1.5}
                opacity={opacity * 0.6}
              />
            </g>
          );
        })}

        {/* Strand paths */}
        <path
          d={`M ${50 + Math.sin(rotation * Math.PI / 180) * 25} 10 
              ${nucleotides.map((i) => {
                const y = 10 + i * 12;
                const phase = (rotation + i * 36) * (Math.PI / 180);
                const x = 50 + Math.sin(phase) * 25;
                return `L ${x} ${y}`;
              }).join(" ")}`}
          fill="none"
          stroke="url(#dnaGradient1)"
          strokeWidth={2}
          opacity={0.5}
        />
        <path
          d={`M ${50 - Math.sin(rotation * Math.PI / 180) * 25} 10 
              ${nucleotides.map((i) => {
                const y = 10 + i * 12;
                const phase = (rotation + i * 36) * (Math.PI / 180);
                const x = 50 - Math.sin(phase) * 25;
                return `L ${x} ${y}`;
              }).join(" ")}`}
          fill="none"
          stroke="url(#dnaGradient2)"
          strokeWidth={2}
          opacity={0.5}
        />
      </svg>

      {/* Pulsing glow effect */}
      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
    </div>
  );
};
