import { useState } from "react";
import { AgentMightyChatLayout } from "./AgentMightyChatLayout";
import { OpsDeskScreen } from "./OpsDeskScreen";

export type MightyMode = "chat" | "ops";

export function MightyChatShell() {
  const [mode, setMode] = useState<MightyMode>("chat");

  return (
    <div className="h-full w-full">
      {mode === "chat" ? (
        <AgentMightyChatLayout onOpenOpsDesk={() => setMode("ops")} />
      ) : (
        <OpsDeskScreen onClose={() => setMode("chat")} />
      )}
    </div>
  );
}
