import { useEffect, useState } from "react";
import { getVehicleSQFTOptions, type VehicleSQFTOptions } from "@/lib/vehicleSqft";
import { type Product } from "@/hooks/useProducts";

interface Vehicle {
  year: string;
  make: string;
  model: string;
}

export function useQuoteEngine(
  product: Product | null,
  vehicle: Vehicle | null,
  quantity: number = 1,
  installRatePerHour: number = 75,
  margin: number = 65,
  includeRoof: boolean = true
) {
  const [sqft, setSqft] = useState<number>(0);
  const [sqftOptions, setSqftOptions] = useState<VehicleSQFTOptions | null>(null);
  const [materialCost, setMaterialCost] = useState(0);
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

    const options = getVehicleSQFTOptions(
      vehicle.year,
      vehicle.make,
      vehicle.model
    );

    if (options) {
      setSqftOptions(options);
      setSqft(includeRoof ? options.withRoof : options.withoutRoof);
    } else {
      setSqftOptions(null);
      console.log("No SQFT match found for vehicle");
    }
  }, [vehicle, includeRoof]);

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

    let material = 0;

    // Calculate material cost based on pricing type
    if (product.pricing_type === 'per_sqft' && product.price_per_sqft) {
      material = sqft * product.price_per_sqft * quantity;
    } else if (product.pricing_type === 'flat' && product.flat_price) {
      material = product.flat_price * quantity;
    }

    setMaterialCost(material);

    // Calculate install hours (1 hour per 25 sqft)
    const hours = Math.ceil(sqft / 25);
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

  }, [sqft, product, quantity, installRatePerHour, margin]);

  return {
    sqft,
    setSqft, // Allow manual override
    sqftOptions,
    materialCost,
    laborCost,
    installHours,
    subtotal,
    marginAmount,
    total,
  };
}
