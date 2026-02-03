import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WPW_ALLOWED_PRODUCT_IDS } from "@/lib/wpwProducts";

export interface Product {
  id: string;
  woo_product_id: number | null;
  product_name: string;
  price_per_sqft: number | null;
  flat_price: number | null;
  pricing_type: 'per_sqft' | 'flat';
  category: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  product_type: 'wpw' | 'quote-only';
  is_locked: boolean;
}

// Static fallback products from wpwProducts.ts when database is empty
const STATIC_PRODUCTS: Product[] = [
  // Printed Wrap Films
  { id: 'static-79', woo_product_id: 79, product_name: 'Avery MPI 1105 with DOL 1460Z', price_per_sqft: 5.27, flat_price: null, pricing_type: 'per_sqft', category: 'full-wraps', description: 'Premium printed wrap film', is_active: true, display_order: 1, product_type: 'wpw', is_locked: true },
  { id: 'static-72', woo_product_id: 72, product_name: '3M IJ180Cv3 with 8518', price_per_sqft: 5.27, flat_price: null, pricing_type: 'per_sqft', category: 'full-wraps', description: 'Premium 3M printed wrap film', is_active: true, display_order: 2, product_type: 'wpw', is_locked: true },

  // Contour Cut (Install-Ready)
  { id: 'static-108', woo_product_id: 108, product_name: 'Avery Contour-Cut', price_per_sqft: 6.32, flat_price: null, pricing_type: 'per_sqft', category: 'full-wraps', description: 'Install-ready contour cut', is_active: true, display_order: 3, product_type: 'wpw', is_locked: true },
  { id: 'static-19420', woo_product_id: 19420, product_name: '3M Contour-Cut', price_per_sqft: 6.92, flat_price: null, pricing_type: 'per_sqft', category: 'full-wraps', description: '3M install-ready contour cut', is_active: true, display_order: 4, product_type: 'wpw', is_locked: true },

  // Specialty Products
  { id: 'static-80', woo_product_id: 80, product_name: 'Perforated Window Vinyl 50/50', price_per_sqft: 5.95, flat_price: null, pricing_type: 'per_sqft', category: 'partial-wraps', description: 'Window perf for see-through graphics', is_active: true, display_order: 5, product_type: 'wpw', is_locked: true },
  { id: 'static-58391', woo_product_id: 58391, product_name: 'FadeWraps Pre-Designed', price_per_sqft: null, flat_price: 600, pricing_type: 'flat', category: 'full-wraps', description: 'Pre-designed fade graphics ($600-$990)', is_active: true, display_order: 6, product_type: 'wpw', is_locked: true },
  { id: 'static-69439', woo_product_id: 69439, product_name: 'InkFusion Premium', price_per_sqft: null, flat_price: 2075, pricing_type: 'flat', category: 'full-wraps', description: 'Premium InkFusion roll (375 sqft)', is_active: true, display_order: 7, product_type: 'wpw', is_locked: true },
  { id: 'static-70093', woo_product_id: 70093, product_name: 'Wall Wrap Printed Vinyl', price_per_sqft: 3.25, flat_price: null, pricing_type: 'per_sqft', category: 'full-wraps', description: 'Avery HP MPI 2610 wall graphics', is_active: true, display_order: 8, product_type: 'wpw', is_locked: true },

  // Wrap By The Yard
  { id: 'static-1726', woo_product_id: 1726, product_name: 'Camo & Carbon', price_per_sqft: null, flat_price: 95.50, pricing_type: 'flat', category: 'partial-wraps', description: 'Pre-designed patterns by the yard', is_active: true, display_order: 9, product_type: 'wpw', is_locked: true },
  { id: 'static-39698', woo_product_id: 39698, product_name: 'Metal & Marble', price_per_sqft: null, flat_price: 95.50, pricing_type: 'flat', category: 'partial-wraps', description: 'Pre-designed patterns by the yard', is_active: true, display_order: 10, product_type: 'wpw', is_locked: true },
  { id: 'static-4181', woo_product_id: 4181, product_name: 'Wicked & Wild', price_per_sqft: null, flat_price: 95.50, pricing_type: 'flat', category: 'partial-wraps', description: 'Pre-designed patterns by the yard', is_active: true, display_order: 11, product_type: 'wpw', is_locked: true },
  { id: 'static-42809', woo_product_id: 42809, product_name: 'Bape Camo', price_per_sqft: null, flat_price: 95.50, pricing_type: 'flat', category: 'partial-wraps', description: 'Pre-designed patterns by the yard', is_active: true, display_order: 12, product_type: 'wpw', is_locked: true },
  { id: 'static-52489', woo_product_id: 52489, product_name: 'Modern & Trippy', price_per_sqft: null, flat_price: 95.50, pricing_type: 'flat', category: 'partial-wraps', description: 'Pre-designed patterns by the yard', is_active: true, display_order: 13, product_type: 'wpw', is_locked: true },

  // Design Services
  { id: 'static-234', woo_product_id: 234, product_name: 'Custom Vehicle Wrap Design', price_per_sqft: null, flat_price: 750, pricing_type: 'flat', category: 'full-wraps', description: 'Full custom design service', is_active: true, display_order: 14, product_type: 'wpw', is_locked: true },
  { id: 'static-58160', woo_product_id: 58160, product_name: 'Custom Design (Copy/Draft)', price_per_sqft: null, flat_price: 500, pricing_type: 'flat', category: 'full-wraps', description: 'Design copy/draft service', is_active: true, display_order: 15, product_type: 'wpw', is_locked: true },

  // Sample/Reference Products
  { id: 'static-15192', woo_product_id: 15192, product_name: 'Pantone Color Chart', price_per_sqft: null, flat_price: 42, pricing_type: 'flat', category: 'partial-wraps', description: 'Color matching reference', is_active: true, display_order: 16, product_type: 'wpw', is_locked: true },
  { id: 'static-475', woo_product_id: 475, product_name: 'Camo & Carbon Sample Book', price_per_sqft: null, flat_price: 26.50, pricing_type: 'flat', category: 'partial-wraps', description: 'Pattern sample book', is_active: true, display_order: 17, product_type: 'wpw', is_locked: true },
  { id: 'static-39628', woo_product_id: 39628, product_name: 'Marble & Metals Swatch Book', price_per_sqft: null, flat_price: 26.50, pricing_type: 'flat', category: 'partial-wraps', description: 'Pattern sample book', is_active: true, display_order: 18, product_type: 'wpw', is_locked: true },
  { id: 'static-4179', woo_product_id: 4179, product_name: 'Wicked & Wild Swatch Book', price_per_sqft: null, flat_price: 26.50, pricing_type: 'flat', category: 'partial-wraps', description: 'Pattern sample book', is_active: true, display_order: 19, product_type: 'wpw', is_locked: true },

  // DesignPanelPro (Print Production Packs)
  { id: 'static-69664', woo_product_id: 69664, product_name: 'Small Print Production Pack', price_per_sqft: null, flat_price: 299, pricing_type: 'flat', category: 'full-wraps', description: 'Small production pack', is_active: true, display_order: 20, product_type: 'wpw', is_locked: true },
  { id: 'static-69671', woo_product_id: 69671, product_name: 'Medium Print Production Pack', price_per_sqft: null, flat_price: 499, pricing_type: 'flat', category: 'full-wraps', description: 'Medium production pack', is_active: true, display_order: 21, product_type: 'wpw', is_locked: true },
  { id: 'static-69680', woo_product_id: 69680, product_name: 'Large Print Production Pack', price_per_sqft: null, flat_price: 699, pricing_type: 'flat', category: 'full-wraps', description: 'Large production pack', is_active: true, display_order: 22, product_type: 'wpw', is_locked: true },
  { id: 'static-69686', woo_product_id: 69686, product_name: 'XLarge Print Production Pack', price_per_sqft: null, flat_price: 899, pricing_type: 'flat', category: 'full-wraps', description: 'XLarge production pack', is_active: true, display_order: 23, product_type: 'wpw', is_locked: true },
];

export interface QuoteSettings {
  install_rate_per_hour: number;
  tax_rate_percentage: number;
}

interface UseProductsOptions {
  /**
   * Whether to load install-related settings (labor rates).
   * When false (print-only tenants like WPW):
   * - Labor rates are NOT queried from the database
   * - install_rate_per_hour will remain at default (unused)
   *
   * Defaults to false to ensure print-only behavior by default.
   */
  loadInstallSettings?: boolean;
}

export function useProducts(options: UseProductsOptions = {}) {
  const { loadInstallSettings = false } = options;

  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<QuoteSettings>({
    install_rate_per_hour: 75, // Default, only used if loadInstallSettings is true
    tax_rate_percentage: 8,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;

      // Use database products if available, otherwise fall back to static products
      if (data && data.length > 0) {
        setProducts(data as Product[]);
      } else {
        console.log("No products in database, using static fallback products");
        setProducts(STATIC_PRODUCTS);
      }
    } catch (error) {
      console.error("Error fetching products, using static fallback:", error);
      // On any error, use static products as fallback
      setProducts(STATIC_PRODUCTS);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("quote_settings")
        .select("*");

      if (error) throw error;
      
      if (data) {
        const settingsObj: any = {};
        data.forEach((setting) => {
          settingsObj[setting.setting_key] = parseFloat(String(setting.setting_value));
        });
        setSettings(settingsObj);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const product = products.find(p => p.id === id);
      if (product?.is_locked) {
        toast({
          title: "Cannot Edit",
          description: "This product is locked and cannot be modified",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      
      await fetchProducts();
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    }
  };

  const addProduct = async (product: Omit<Product, "id">) => {
    try {
      const { error } = await supabase
        .from("products")
        .insert([product]);

      if (error) throw error;
      
      await fetchProducts();
      toast({
        title: "Success",
        description: "Product added successfully",
      });
    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      });
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const product = products.find(p => p.id === id);
      if (product?.is_locked) {
        toast({
          title: "Cannot Delete",
          description: "This product is locked and cannot be deleted",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("products")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
      
      await fetchProducts();
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const updateSettings = async (newSettings: Partial<QuoteSettings>) => {
    try {
      const updates = Object.entries(newSettings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("quote_settings")
          .update({ setting_value: update.setting_value })
          .eq("setting_key", update.setting_key);

        if (error) throw error;
      }
      
      await fetchSettings();
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Only load install settings (labor rates) when explicitly enabled
      // For print-only tenants (WPW), this query is skipped entirely
      if (loadInstallSettings) {
        await Promise.all([fetchProducts(), fetchSettings()]);
      } else {
        await fetchProducts();
        // Settings remain at defaults - install_rate_per_hour is unused
      }
      setLoading(false);
    };

    loadData();

    // Subscribe to real-time changes
    const productsChannel = supabase
      .channel("products_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    // Only subscribe to settings changes if install settings are loaded
    let settingsChannel: ReturnType<typeof supabase.channel> | null = null;
    if (loadInstallSettings) {
      settingsChannel = supabase
        .channel("settings_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "quote_settings" },
          () => {
            fetchSettings();
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(productsChannel);
      if (settingsChannel) {
        supabase.removeChannel(settingsChannel);
      }
    };
  }, [loadInstallSettings]);

  return {
    products,
    settings,
    loading,
    updateProduct,
    addProduct,
    deleteProduct,
    updateSettings,
  };
}
