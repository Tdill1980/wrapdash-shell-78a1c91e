import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

export interface QuoteSettings {
  install_rate_per_hour: number;
  tax_rate_percentage: number;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<QuoteSettings>({
    install_rate_per_hour: 75,
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
      setProducts((data || []) as Product[]);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
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
      await Promise.all([fetchProducts(), fetchSettings()]);
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

    const settingsChannel = supabase
      .channel("settings_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quote_settings" },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, []);

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
