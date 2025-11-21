import React, { useState } from "react";
import { generateMasterCanvas, generate3DRender, convertToPrint } from "./api";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DesignPanelProEnterprise() {
  const { toast } = useToast();
  
  // PANEL INPUTS
  const [width, setWidth] = useState("186");
  const [height, setHeight] = useState("56");
  const [style, setStyle] = useState("commercial");
  const [subStyle, setSubStyle] = useState("clean");
  const [intensity, setIntensity] = useState("medium");

  // OUTPUT
  const [preview, setPreview] = useState<string | null>(null);
  const [threeD, setThreeD] = useState<string | null>(null);
  const [printURL, setPrintURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePanel = async () => {
    setLoading(true);
    try {
      // 1) MASTER CANVAS
      const master = await generateMasterCanvas({
        width,
        height,
        style,
        subStyle,
        intensity
      });

      setPreview(master.preview);

      // 2) 3D RENDER
      const render3D = await generate3DRender({
        panelUrl: master.preview,
        vehicleModel: "generic-sedan"
      });

      setThreeD(render3D.render);

      // 3) PRINT-READY OUTPUT
      const finalPrint = await convertToPrint({
        panelUrl: master.preview,
        width,
        height
      });

      setPrintURL(finalPrint.tiffUrl);

      toast({
        title: "Generation Complete",
        description: "Panel, 3D render, and print files ready",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-background text-foreground flex">
      {/* LEFT SIDEBAR */}
      <div className="w-[320px] bg-card p-6 flex flex-col gap-6 border-r border-border">
        <h1 className="text-2xl font-bold">
          <span className="text-[#22d3ee]">DesignPanelPro</span>
          <span className="text-foreground"> Enterprise™</span>
        </h1>

        {/* Panel Size */}
        <div className="bg-background p-4 rounded-xl border border-border">
          <h2 className="text-lg mb-3 font-semibold">Panel Size (inches)</h2>
          <div className="flex gap-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Width</label>
              <input 
                className="w-24 bg-background border border-input p-2 rounded-lg text-foreground"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Height</label>
              <input 
                className="w-24 bg-background border border-input p-2 rounded-lg text-foreground"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Style */}
        <div className="bg-background p-4 rounded-xl border border-border">
          <h2 className="text-lg mb-3 font-semibold">Category</h2>
          <select 
            className="w-full bg-background border border-input p-3 rounded-lg text-foreground"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
            <option value="commercial">Commercial</option>
            <option value="restyle">Restyle</option>
            <option value="anime">Anime</option>
            <option value="livery">Livery</option>
            <option value="racing">Racing</option>
            <option value="offroad">Off-Road</option>
            <option value="highend">High End</option>
          </select>

          {style === "commercial" && (
            <select 
              className="w-full bg-background border border-input p-3 rounded-lg mt-3 text-foreground"
              value={subStyle}
              onChange={(e) => setSubStyle(e.target.value)}
            >
              <option value="clean">Clean</option>
              <option value="bold">Bold</option>
              <option value="patterned">Patterned</option>
              <option value="premium">Premium</option>
            </select>
          )}
        </div>

        {/* Intensity */}
        <div className="bg-background p-4 rounded-xl border border-border">
          <h2 className="text-lg mb-3 font-semibold">Intensity</h2>
          <div className="flex gap-3">
            {["soft","medium","extreme"].map(i => (
              <button
                key={i}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  intensity === i 
                    ? "bg-[#22d3ee] text-black" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                onClick={() => setIntensity(i)}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={generatePanel}
          disabled={loading}
          className="mt-4 bg-[#22d3ee] text-black py-3 rounded-xl text-lg font-bold hover:bg-[#22d3ee]/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Panel Design"
          )}
        </button>
      </div>

      {/* MAIN CANVAS */}
      <div className="flex-1 p-8 overflow-y-auto space-y-6">
        
        {/* MASTER PREVIEW */}
        <div className="bg-card border border-border p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Flat Panel Design</h2>
          <div className="bg-background rounded-xl h-[550px] flex items-center justify-center border border-border">
            {preview ? (
              <img src={preview} className="max-w-full max-h-full rounded-lg object-contain" alt="Panel preview" />
            ) : (
              <span className="text-muted-foreground">Panel preview will appear here</span>
            )}
          </div>
        </div>

        {/* 3D RENDER */}
        <div className="bg-card border border-border p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">3D Vehicle Render</h2>
          <div className="bg-background rounded-xl h-[550px] flex items-center justify-center border border-border">
            {threeD ? (
              <img src={threeD} className="max-w-full max-h-full rounded-lg object-contain" alt="3D render" />
            ) : (
              <span className="text-muted-foreground">3D vehicle render will appear here</span>
            )}
          </div>
        </div>

        {/* PRINT READY */}
        <div className="bg-card border border-border p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Print-Ready Files</h2>
          <div className="bg-background rounded-xl p-6 border border-border">
            {printURL ? (
              <a 
                href={printURL}
                download
                className="bg-[#22d3ee] text-black px-6 py-3 rounded-lg inline-flex items-center gap-2 hover:bg-[#22d3ee]/90 font-medium"
              >
                Download Print-Ready TIFF (300 DPI)
              </a>
            ) : (
              <span className="text-muted-foreground">Will generate after running</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
