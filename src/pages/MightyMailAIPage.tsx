import React, { useState } from "react";
import { useEmailFlows } from "@/hooks/useEmailFlows";
import { MainLayout } from "@/layouts/MainLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Mail,
  BarChart,
  Settings,
  Loader2,
  Trash,
  Sparkles,
  Send,
} from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (params: any) => void;
  generating: boolean;
}

const FLOW_TYPES = [
  { value: "nurture", label: "Nurture Sequence" },
  { value: "winback", label: "Winback Sequence" },
  { value: "quote", label: "Quote Follow-Up" },
];

const BRANDS = [
  { value: "wpw", label: "WePrintWraps.com" },
  { value: "wraptv", label: "WrapTV World" },
  { value: "inkandedge", label: "Ink & Edge Magazine" },
];

// =========================
// GENERATOR MODAL
// =========================
function AIGeneratorModal({ open, onClose, onGenerate, generating }: ModalProps) {
  const [flowType, setFlowType] = useState("quote");
  const [brand, setBrand] = useState("wpw");
  const [persona, setPersona] = useState("");
  const [productFocus, setProductFocus] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-neutral-900 border border-white/10 text-white animate-fade-in">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Generate AI Email Flow
          </CardTitle>
          <CardDescription className="text-white/60">
            Create a high-performing automated email sequence using MightyMail AI.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* FLOW TYPE */}
          <div>
            <label className="text-sm font-medium">Flow Type</label>
            <select
              className="w-full mt-1 bg-neutral-800 text-white p-2 rounded-md border border-white/10"
              value={flowType}
              onChange={(e) => setFlowType(e.target.value)}
            >
              {FLOW_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* BRAND */}
          <div>
            <label className="text-sm font-medium">Brand</label>
            <select
              className="w-full mt-1 bg-neutral-800 text-white p-2 rounded-md border border-white/10"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            >
              {BRANDS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          {/* PERSONA */}
          <div>
            <label className="text-sm font-medium">Target Persona (optional)</label>
            <input
              className="w-full mt-1 bg-neutral-800 text-white p-2 rounded-md border border-white/10"
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              placeholder="Shop owner, reseller, DIY enthusiast…"
            />
          </div>

          {/* PRODUCT FOCUS */}
          <div>
            <label className="text-sm font-medium">Product Focus (optional)</label>
            <input
              className="w-full mt-1 bg-neutral-800 text-white p-2 rounded-md border border-white/10"
              value={productFocus}
              onChange={(e) => setProductFocus(e.target.value)}
              placeholder="FadeWraps, Printed PPF, etc."
            />
          </div>

          {/* FOOTER BUTTONS */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <Button
              onClick={() =>
                onGenerate({ flowType, brand, persona, productFocus })
              }
              className="bg-gradient-to-r from-[#405DE6] to-[#E1306C]"
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating…
                </>
              ) : (
                "Generate Flow"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =========================
// MAIN PAGE
// =========================
export default function MightyMailAIPage() {
  const {
    flows,
    isLoading,
    generating,
    useFlowSteps,
    generateAIFlow,
    sendTestEmail,
    deleteFlow,
  } = useEmailFlows();

  const [selectedFlow, setSelectedFlow] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: steps } = selectedFlow 
    ? useFlowSteps(selectedFlow.id) 
    : { data: [] };

  return (
    <MainLayout>
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Mail className="w-8 h-8 text-primary" /> MightyMail AI
          </h1>
          <p className="text-white/60">
            AI-powered email automation that beats Klaviyo.
          </p>
        </div>

        <Button
          className="bg-gradient-to-r from-[#405DE6] to-[#E1306C]"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Generate AI Flow
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT SIDEBAR */}
        <div className="col-span-3 space-y-4">
          <Card className="bg-neutral-900 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Email Flows
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
              {isLoading && (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              )}

              {!isLoading && flows?.length === 0 && (
                <div className="text-white/60 text-sm py-6">No flows yet.</div>
              )}

              {flows?.map((flow: any) => (
                <div
                  key={flow.id}
                  onClick={() => setSelectedFlow(flow)}
                  className={`p-3 rounded-lg cursor-pointer transition 
                    ${selectedFlow?.id === flow.id ? "bg-white/10" : "hover:bg-white/5"}`}
                >
                  <div className="font-semibold text-white">{flow.name}</div>
                  <div className="text-xs text-white/60">{flow.description}</div>

                  <div className="flex gap-2 mt-2">
                    <Badge>{flow.flow_type}</Badge>
                    <Badge>{flow.brand}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL */}
        <div className="col-span-9">
          {!selectedFlow && (
            <Card className="bg-neutral-900 border-white/10 p-10 text-center">
              <div className="text-white/60">Select a flow to view details.</div>
            </Card>
          )}

          {selectedFlow && (
            <Card className="bg-neutral-900 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  {selectedFlow.name}

                  <Button
                    variant="destructive"
                    onClick={() => deleteFlow.mutate(selectedFlow.id)}
                  >
                    <Trash className="w-4 h-4 mr-2" /> Delete Flow
                  </Button>
                </CardTitle>

                <CardDescription className="text-white/60">
                  {selectedFlow.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="timeline">
                  <TabsList className="bg-neutral-800 text-white">
                    <TabsTrigger value="timeline">
                      <Mail className="w-4 h-4 mr-1" /> Timeline
                    </TabsTrigger>
                    <TabsTrigger value="stats">
                      <BarChart className="w-4 h-4 mr-1" /> Stats
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                      <Settings className="w-4 h-4 mr-1" /> Settings
                    </TabsTrigger>
                  </TabsList>

                  {/* TIMELINE TAB */}
                  <TabsContent value="timeline" className="pt-6 space-y-6">
                    {!steps?.length && (
                      <div className="text-white/60">No steps in this flow.</div>
                    )}

                    {steps?.map((step: any) => (
                      <Card
                        key={step.id}
                        className="bg-neutral-800 border-white/10 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-white text-lg">
                            Step {step.step_number}
                          </div>
                          <Badge>+{step.delay_hours}h</Badge>
                        </div>

                        <div className="text-white mt-2">{step.subject}</div>
                        {step.preview_text && (
                          <div className="text-white/60 text-sm mt-1">
                            {step.preview_text}
                          </div>
                        )}

                        <div className="flex justify-end mt-4">
                          <Button
                            variant="outline"
                            onClick={() => sendTestEmail(step.id)}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Send Test Email
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </TabsContent>

                  {/* STATS TAB */}
                  <TabsContent value="stats" className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-neutral-800 border-white/10 p-6 text-center text-white">
                        <div className="text-3xl font-bold">
                          {selectedFlow.stats?.sent || 0}
                        </div>
                        <div className="text-white/60 text-sm">Sent</div>
                      </Card>

                      <Card className="bg-neutral-800 border-white/10 p-6 text-center text-white">
                        <div className="text-3xl font-bold">
                          {selectedFlow.stats?.opened || 0}%
                        </div>
                        <div className="text-white/60 text-sm">Opened</div>
                      </Card>

                      <Card className="bg-neutral-800 border-white/10 p-6 text-center text-white">
                        <div className="text-3xl font-bold">
                          {selectedFlow.stats?.clicked || 0}%
                        </div>
                        <div className="text-white/60 text-sm">Clicked</div>
                      </Card>

                      <Card className="bg-neutral-800 border-white/10 p-6 text-center text-white">
                        <div className="text-3xl font-bold">
                          {selectedFlow.stats?.converted || 0}%
                        </div>
                        <div className="text-white/60 text-sm">Converted</div>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* SETTINGS TAB */}
                  <TabsContent value="settings" className="pt-6 space-y-4">
                    <div className="text-white/60 text-sm">
                      Flow settings coming soon.
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* GENERATOR MODAL */}
      <AIGeneratorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onGenerate={async (params) => {
          const flow = await generateAIFlow(params);
          setModalOpen(false);
          setSelectedFlow(flow);
        }}
        generating={generating}
      />
    </MainLayout>
  );
}
