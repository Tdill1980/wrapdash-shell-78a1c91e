import { useEffect, useState } from "react";
import { getVehicleSQFTOptions, type VehicleSQFTOptions } from "@/lib/vehicleSqft";
import { type Product } from "@/hooks/useProducts";

interface Vehicle {
  year: string;
  make: string;
  model: string;
}

interface PanelCosts {
  sides: number;
  back: number;
  hood: number;
  roof: number;
}

interface SelectedPanels {
  sides: boolean;
  back: boolean;
  hood: boolean;
  roof: boolean;
}

export interface QuoteEngineOptions {
  /**
   * Whether installation services are enabled for this tenant.
   * When false (WPW/print-only tenants):
   * - Labor data is NOT loaded or calculated
   * - Install hours are NOT computed
   * - Margin is NOT applied
   * - Total = material cost only
   *
   * When true (SaaS customer tenants):
   * - Full quote with labor, hours, and margin
   */
  installsEnabled?: boolean;
  /** Install rate per hour - only used when installsEnabled is true */
  installRatePerHour?: number;
  /** Margin percentage - only used when installsEnabled is true */
  margin?: number;
  /** Whether to include roof in full wrap calculations */
  includeRoof?: boolean;
  /** Selected panels for partial wrap mode - null for full wrap */
  selectedPanels?: SelectedPanels | null;
}

/**
 * Quote Engine Hook
 *
 * Calculates material costs and optionally labor/margin based on tenant capabilities.
 * Install features are gated at the data layer - when disabled, install data is
 * never loaded, queried, or calculated.
 */
export function useQuoteEngine(
  product: Product | null,
  vehicle: Vehicle | null,
  quantity: number = 1,
  options: QuoteEngineOptions = {}
) {
  // Extract options with defaults
  // CRITICAL: installsEnabled defaults to false (print-only mode)
  // This ensures WPW and unknown tenants never load install data
  const {
    installsEnabled = false,
    installRatePerHour = 75,
    margin = 65,
    includeRoof = true,
    selectedPanels = null,
  } = options;

  const [sqft, setSqft] = useState<number>(0);
  const [sqftOptions, setSqftOptions] = useState<VehicleSQFTOptions | null>(null);
  const [panelCosts, setPanelCosts] = useState<PanelCosts>({ sides: 0, back: 0, hood: 0, roof: 0 });
  const [materialCost, setMaterialCost] = useState(0);
  // Install-related state - only used when installsEnabled is true
  const [laborCost, setLaborCost] = useState(0);
  const [installHours, setInstallHours] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [marginAmount, setMarginAmount] = useState(0);
  const [total, setTotal] = useState(0);

  // Auto-calculate SQFT when vehicle or roof option changes
  useEffect(() => {
    if (!vehicle || !vehicle.year || !vehicle.make || !vehicle.model) {
      setSqft(0);
      setSqftOptions(null);
      return;
    }

    const opts = getVehicleSQFTOptions(
      vehicle.year,
      vehicle.make,
      vehicle.model
    );

    if (opts) {
      setSqftOptions(opts);

      // Calculate based on selected panels if in partial wrap mode
      if (selectedPanels) {
        let totalSqft = 0;
        if (selectedPanels.sides) totalSqft += opts.panels.sides;
        if (selectedPanels.back) totalSqft += opts.panels.back;
        if (selectedPanels.hood) totalSqft += opts.panels.hood;
        if (selectedPanels.roof) totalSqft += opts.panels.roof;
        setSqft(totalSqft);
      } else {
        // Full wrap mode
        setSqft(includeRoof ? opts.withRoof : opts.withoutRoof);
      }
    } else {
      setSqftOptions(null);
      console.log("No SQFT match found for vehicle");
    }
  }, [vehicle, includeRoof, selectedPanels]);

  // Calculate panel costs when SQFT options and product change
  useEffect(() => {
    if (!product || !sqftOptions || product.pricing_type !== 'per_sqft' || !product.price_per_sqft) {
      setPanelCosts({ sides: 0, back: 0, hood: 0, roof: 0 });
      return;
    }

    const costs: PanelCosts = {
      sides: sqftOptions.panels.sides * product.price_per_sqft,
      back: sqftOptions.panels.back * product.price_per_sqft,
      hood: sqftOptions.panels.hood * product.price_per_sqft,
      roof: sqftOptions.panels.roof * product.price_per_sqft,
    };

    setPanelCosts(costs);
  }, [sqftOptions, product]);

  // Calculate costs when SQFT, product, or quantity changes
  useEffect(() => {
    if (!product || sqft === 0) {
      setMaterialCost(0);
      setLaborCost(0);
      setInstallHours(0);
      setSubtotal(0);
      setMarginAmount(0);
      setTotal(0);
      return;
    }

    // Calculate material cost based on pricing type
    let material = 0;
    if (product.pricing_type === 'per_sqft' && product.price_per_sqft) {
      material = sqft * product.price_per_sqft * quantity;
    } else if (product.pricing_type === 'flat' && product.flat_price) {
      material = product.flat_price * quantity;
    }
    setMaterialCost(material);

    // =================================================================
    // TENANT CAPABILITY GATE: Installation Features
    // =================================================================
    // When installsEnabled is false (WPW/print-only tenants):
    // - Skip ALL install calculations
    // - Do NOT load labor rates
    // - Do NOT compute install hours
    // - Do NOT apply margin
    // - Total = material cost only
    // =================================================================
    if (!installsEnabled) {
      setLaborCost(0);
      setInstallHours(0);
      setSubtotal(material);
      setMarginAmount(0);
      setTotal(material);
      return;
    }

    // =================================================================
    // INSTALL-ENABLED TENANT: Full quote calculation
    // =================================================================

    // Calculate install hours - panel-specific complexity
    let hours = 0;
    if (selectedPanels && sqftOptions) {
      // Panel-specific labor rates (different complexity)
      if (selectedPanels.sides) hours += Math.ceil(sqftOptions.panels.sides / 25); // Standard
      if (selectedPanels.back) hours += Math.ceil(sqftOptions.panels.back / 20); // More complex curves
      if (selectedPanels.hood) hours += Math.ceil(sqftOptions.panels.hood / 30); // Easier
      if (selectedPanels.roof) hours += Math.ceil(sqftOptions.panels.roof / 30); // Easier
    } else {
      // Default calculation for full wraps
      hours = Math.ceil(sqft / 25);
    }
    setInstallHours(hours);

    // Calculate labor cost
    const labor = hours * installRatePerHour;
    setLaborCost(labor);

    // Calculate subtotal
    const sub = material + labor;
    setSubtotal(sub);

    // Calculate margin amount
    const marginCalc = sub * (margin / 100);
    setMarginAmount(marginCalc);

    // Calculate total
    const totalCalc = sub + marginCalc;
    setTotal(totalCalc);

  }, [sqft, product, quantity, installsEnabled, installRatePerHour, margin, selectedPanels, sqftOptions]);

  return {
    sqft,
    setSqft, // Allow manual override
    sqftOptions,
    panelCosts,
    materialCost,
    // Install-related values - will be 0 when installsEnabled is false
    laborCost,
    installHours,
    subtotal,
    marginAmount,
    total,
    // Expose capability state for UI gating
    installsEnabled,
  };
}
