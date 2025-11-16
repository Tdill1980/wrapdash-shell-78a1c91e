import { createContext, useContext, useState, ReactNode } from "react";

interface OrganizationSettings {
  name: string;
  logo?: string;
  theme?: string;
}

interface OrganizationContextType {
  organizationId: string | null;
  subscriptionTier: "free" | "pro" | "enterprise";
  organizationSettings: OrganizationSettings;
  updateOrganization: (settings: Partial<OrganizationSettings>) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const [organizationId] = useState<string | null>("org-placeholder");
  const [subscriptionTier] = useState<"free" | "pro" | "enterprise">("pro");
  const [organizationSettings, setOrganizationSettings] =
    useState<OrganizationSettings>({
      name: "WrapCommand",
      theme: "dark",
    });

  const updateOrganization = (settings: Partial<OrganizationSettings>) => {
    setOrganizationSettings((prev) => ({ ...prev, ...settings }));
  };

  return (
    <OrganizationContext.Provider
      value={{
        organizationId,
        subscriptionTier,
        organizationSettings,
        updateOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider"
    );
  }
  return context;
};
