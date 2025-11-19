import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function CSVUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  async function uploadCSV() {
    if (!file) return;

    setUploading(true);

    try {
      const text = await file.text();
      const lines = text.split("\n");
      const headers = lines[0].split(",").map(h => h.trim());
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim());
        if (values.length < 2) continue;

        const row: any = {};
        headers.forEach((header, idx) => {
          row[header.toLowerCase()] = values[idx];
        });

        await supabase.from("email_retarget_customers").insert({
          name: row.name || "",
          email: row.email || "",
          phone: row.phone || null,
          last_quote_amount: row.last_quote ? parseFloat(row.last_quote) : null,
          last_quote_date: row.last_quote_date || null,
        });
      }

      toast({
        title: "CSV Uploaded",
        description: "Customer data imported successfully.",
      });
      
      setFile(null);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Error processing CSV file.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card className="bg-[#16161E] border-[rgba(255,255,255,0.06)]">
      <CardHeader>
        <CardTitle className="text-foreground">Upload Customer CSV</CardTitle>
        <CardDescription>
          Import customer data for retargeting campaigns. Expected columns: name, email, phone, last_quote, last_quote_date
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-[#00AFFF] file:to-[#4EEAFF] file:text-white hover:file:opacity-80"
        />

        <Button 
          onClick={uploadCSV} 
          disabled={!file || uploading}
          className="bg-gradient-to-r from-[#00AFFF] to-[#4EEAFF] text-white"
        >
          <Upload className="mr-2" size={16} />
          {uploading ? "Uploading..." : "Upload & Process"}
        </Button>
      </CardContent>
    </Card>
  );
}
