import { createContext, useContext, useState, ReactNode } from "react";

export type EditorMode =
  | "basic"
  | "smart_assist"
  | "auto_create"
  | "hybrid"
  | "render";

interface EditorModeContextProps {
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;
}

const EditorModeContext = createContext<EditorModeContextProps | undefined>(
  undefined
);

export function EditorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<EditorMode>("basic");

  return (
    <EditorModeContext.Provider value={{ mode, setMode }}>
      {children}
    </EditorModeContext.Provider>
  );
}

export function useEditorMode() {
  const ctx = useContext(EditorModeContext);
  if (!ctx) throw new Error("useEditorMode must be inside EditorModeProvider");
  return ctx;
}
