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

export function useQuoteEngine(
  product: Product | null,
  vehicle: Vehicle | null,
  quantity: number = 1,
  installRatePerHour: number = 75,
  margin: number = 65,
  includeRoof: boolean = true,
  selectedPanels: { sides: boolean; back: boolean; hood: boolean; roof: boolean } | null = null,
  includeInstallation: boolean = false,
  installationDescription: string = "",
  installationHours: number = 0
) {
  const [sqft, setSqft] = useState<number>(0);
  const [sqftOptions, setSqftOptions] = useState<VehicleSQFTOptions | null>(null);
  const [panelCosts, setPanelCosts] = useState<PanelCosts>({ sides: 0, back: 0, hood: 0, roof: 0 });
  const [materialCost, setMaterialCost] = useState(0);
  const [installationCost, setInstallationCost] = useState(0);
  const [installHours, setInstallHours] = useState(0);
  const [wholesaleCost, setWholesaleCost] = useState(0);
  const [customerPrice, setCustomerPrice] = useState(0);
  const [resellerProfit, setResellerProfit] = useState(0);

  // Auto-calculate SQFT when vehicle or roof option changes
  useEffect(() => {
    if (!vehicle || !vehicle.year || !vehicle.make || !vehicle.model) {
      setSqft(0);
      setSqftOptions(null);
      return;
    }

    const options = getVehicleSQFTOptions(
      vehicle.year,
      vehicle.make,
      vehicle.model
    );

    if (options) {
      setSqftOptions(options);
      
      // Calculate based on selected panels if in partial wrap mode
      if (selectedPanels) {
        let totalSqft = 0;
        if (selectedPanels.sides) totalSqft += options.panels.sides;
        if (selectedPanels.back) totalSqft += options.panels.back;
        if (selectedPanels.hood) totalSqft += options.panels.hood;
        if (selectedPanels.roof) totalSqft += options.panels.roof;
        setSqft(totalSqft);
      } else {
        // Full wrap mode
        setSqft(includeRoof ? options.withRoof : options.withoutRoof);
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
      setInstallationCost(0);
      setInstallHours(0);
      setWholesaleCost(0);
      setCustomerPrice(0);
      setResellerProfit(0);
      return;
    }

    let material = 0;

    // Calculate material cost based on pricing type (this is wholesale cost)
    if (product.pricing_type === 'per_sqft' && product.price_per_sqft) {
      material = sqft * product.price_per_sqft * quantity;
    } else if (product.pricing_type === 'flat' && product.flat_price) {
      material = product.flat_price * quantity;
    }

    setMaterialCost(material);
    setWholesaleCost(material); // Wholesale is just material cost

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

    // Calculate installation cost (only if includeInstallation is true)
    const installation = includeInstallation 
      ? (installationHours || hours) * installRatePerHour 
      : 0;
    setInstallationCost(installation);

    // Calculate customer price with margin
    const materialWithMargin = material * (1 + margin / 100);
    const customerTotal = materialWithMargin + installation;
    setCustomerPrice(customerTotal);

    // Calculate reseller profit (margin on material only)
    const profit = materialWithMargin - material;
    setResellerProfit(profit);

  }, [sqft, product, quantity, installRatePerHour, margin, selectedPanels, sqftOptions, includeInstallation, installationHours, installationDescription]);

  return {
    sqft,
    setSqft, // Allow manual override
    sqftOptions,
    panelCosts,
    materialCost,
    installationCost,
    installHours,
    wholesaleCost,
    customerPrice,
    resellerProfit,
  };
}
