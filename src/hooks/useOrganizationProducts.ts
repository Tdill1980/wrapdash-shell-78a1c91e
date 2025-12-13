import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/contexts/OrganizationContext";

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
  organization_id: string | null;
  visibility: 'all' | 'organization' | 'hidden';
}

export interface OrganizationProductSettings {
  show_wpw_wholesale: boolean;
  default_margin_percentage: number;
}

export function useOrganizationProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [wpwProducts, setWpwProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<OrganizationProductSettings>({
    show_wpw_wholesale: true,
    default_margin_percentage: 65,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { organizationId } = useOrganization();

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;

      const allProducts = (data || []) as Product[];
      
      // Separate org products from WPW global products
      const orgProducts = allProducts.filter(p => p.organization_id === organizationId);
      const globalProducts = allProducts.filter(p => p.organization_id === null);
      
      setMyProducts(orgProducts);
      setWpwProducts(globalProducts);
      
      // Combined list based on settings
      if (settings.show_wpw_wholesale) {
        setProducts([...orgProducts, ...globalProducts]);
      } else {
        setProducts(orgProducts);
      }
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
    if (!organizationId) return;
    
    try {
      const { data, error } = await supabase
        .from("organization_product_settings")
        .select("*")
        .eq("organization_id", organizationId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings({
          show_wpw_wholesale: data.show_wpw_wholesale ?? true,
          default_margin_percentage: data.default_margin_percentage ?? 65,
        });
      }
    } catch (error) {
      console.error("Error fetching org product settings:", error);
    }
  };

  const updateSettings = async (newSettings: Partial<OrganizationProductSettings>) => {
    if (!organizationId) return;
    
    try {
      const { error } = await supabase
        .from("organization_product_settings")
        .upsert({
          organization_id: organizationId,
          ...settings,
          ...newSettings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'organization_id' });

      if (error) throw error;
      
      setSettings(prev => ({ ...prev, ...newSettings }));
      await fetchProducts();
      
      toast({
        title: "Success",
        description: "Settings updated",
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

  const addProduct = async (product: Omit<Product, "id" | "organization_id" | "is_locked">) => {
    if (!organizationId) return;
    
    try {
      const { error } = await supabase
        .from("products")
        .insert([{
          ...product,
          organization_id: organizationId,
          is_locked: false,
          visibility: 'organization',
        }]);

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
        description: "Product updated",
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

  const deleteProduct = async (id: string) => {
    try {
      const product = products.find(p => p.id === id);
      if (product?.is_locked) {
        toast({
          title: "Cannot Delete",
          description: "This product is locked",
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
        description: "Product deleted",
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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchSettings();
      await fetchProducts();
      setLoading(false);
    };

    if (organizationId) {
      loadData();
    }
  }, [organizationId]);

  // Refetch products when settings change
  useEffect(() => {
    if (!loading) {
      fetchProducts();
    }
  }, [settings.show_wpw_wholesale]);

  return {
    products,
    myProducts,
    wpwProducts,
    settings,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    updateSettings,
    refetch: fetchProducts,
  };
}
