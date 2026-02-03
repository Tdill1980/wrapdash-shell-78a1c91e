import { useOrganization } from "@/contexts/OrganizationContext";

/**
 * Tenant Capabilities Hook
 *
 * Gates features at the data layer based on tenant configuration.
 * WPW (weprintwraps.com) = print-only e-commerce, installs disabled.
 * SaaS customer tenants = installs enabled.
 *
 * IMPORTANT: This is a DATA LAYER gate, not a UI hide.
 * When installsEnabled = false:
 * - Install data must NOT be loaded
 * - Labor rates must NOT be queried
 * - Install margins must NOT be calculated
 * - Install UI must NOT be mounted
 */
export interface TenantCapabilities {
  /** Whether this tenant offers installation services */
  installsEnabled: boolean;
  /** Whether this tenant can use margin calculations */
  marginEnabled: boolean;
  /** Tenant subscription tier */
  tier: "free" | "pro" | "enterprise";
  /** Whether tenant data is still loading */
  loading: boolean;
}

export function useTenantCapabilities(): TenantCapabilities {
  const { organizationSettings, loading } = useOrganization();

  // installsEnabled is gated by offersInstallation from organization settings
  // Default to false (print-only) when loading or unknown
  const installsEnabled = loading ? false : organizationSettings.offersInstallation;

  // Margin is only relevant when installs are enabled
  // For print-only tenants (WPW), margin doesn't apply - they sell material at fixed prices
  const marginEnabled = installsEnabled;

  return {
    installsEnabled,
    marginEnabled,
    tier: organizationSettings.subscriptionTier,
    loading,
  };
}
