import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Mail, Palette, PenTool, Settings2, Upload } from "lucide-react";
import SequenceManager from "@/components/mightymail/SequenceManager";
import BrandingManager from "@/components/mightymail/BrandingManager";
import CSVUploader from "@/components/mightymail/CSVUploader";
import EmailStyles from "@/components/mightymail/EmailStyles";
import ToneStyles from "@/components/mightymail/ToneStyles";

export default function MightyMailAdmin() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#00AFFF] via-[#008CFF] to-[#4EEAFF] bg-clip-text text-transparent">
          MightyMail™ Admin
        </h2>
        <p className="text-muted-foreground">
          Manage email sequences, branding, retargeting lists, and customer campaigns.
        </p>
      </div>

      <Tabs defaultValue="sequences" className="w-full">
        <TabsList className="grid grid-cols-5 w-full bg-[#16161E]">
          <TabsTrigger value="sequences">
            <Mail size={16} className="mr-2" /> Sequences
          </TabsTrigger>

          <TabsTrigger value="design">
            <Palette size={16} className="mr-2" /> Design Styles
          </TabsTrigger>

          <TabsTrigger value="tones">
            <PenTool size={16} className="mr-2" /> Writing Styles
          </TabsTrigger>

          <TabsTrigger value="branding">
            <Settings2 size={16} className="mr-2" /> Branding
          </TabsTrigger>

          <TabsTrigger value="csv">
            <Upload size={16} className="mr-2" /> CSV Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sequences">
          <SequenceManager />
        </TabsContent>

        <TabsContent value="design">
          <EmailStyles />
        </TabsContent>

        <TabsContent value="tones">
          <ToneStyles />
        </TabsContent>

        <TabsContent value="branding">
          <BrandingManager />
        </TabsContent>

        <TabsContent value="csv">
          <CSVUploader />
        </TabsContent>
      </Tabs>
    </div>
  );
}
