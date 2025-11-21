// 🖼 FILE THUMBNAIL — generates previews using API (PDF/AI/PNG/JPG)

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const FileThumbnail = ({ file, orderId }: any) => {
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    const generateThumb = async () => {
      const { data, error } = await supabase.functions.invoke("generate-thumbnail", {
        body: { url: file.url, orderId },
      });

      if (data?.thumbnailUrl) setThumb(data.thumbnailUrl);
    };

    generateThumb();
  }, [file.url, orderId]);

  // Placeholder if still generating
  if (!thumb) {
    return (
      <div className="w-10 h-10 rounded-md bg-[#1A1A22] border border-white/10 animate-pulse"></div>
    );
  }

  return (
    <img
      src={thumb}
      alt={file.name}
      className="w-10 h-10 object-cover rounded-md border border-white/10"
    />
  );
};
