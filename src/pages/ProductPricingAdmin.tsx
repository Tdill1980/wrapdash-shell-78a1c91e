import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Save, Plus, Trash2, Tag } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProductPricingAdmin() {
  const { products, settings, loading, updateProduct, addProduct, deleteProduct, updateSettings } = useProducts();
  const [installRate, setInstallRate] = useState(settings.install_rate_per_hour);
  const [taxRate, setTaxRate] = useState(settings.tax_rate_percentage);
  
  // New product form
  const [newProductName, setNewProductName] = useState("");
  const [newWooId, setNewWooId] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newPricingType, setNewPricingType] = useState<'per_sqft' | 'flat'>('per_sqft');
  const [newCategory, setNewCategory] = useState("wrap");
  const [newDescription, setNewDescription] = useState("");

  const saveSettings = async () => {
    await updateSettings({
      install_rate_per_hour: installRate,
      tax_rate_percentage: taxRate,
    });
  };

  const updateProductPrice = async (id: string, pricingType: string, newPrice: number) => {
    if (pricingType === 'per_sqft') {
      await updateProduct(id, { price_per_sqft: newPrice });
    } else {
      await updateProduct(id, { flat_price: newPrice });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteProduct(id);
    }
  };

  const handleAddProduct = async () => {
    if (!newProductName || !newWooId || !newPrice) {
      alert("Please fill in all required fields");
      return;
    }

    const productData: any = {
      woo_product_id: parseInt(newWooId),
      product_name: newProductName,
      pricing_type: newPricingType,
      category: newCategory,
      description: newDescription || null,
      is_active: true,
      display_order: products.length + 1,
    };

    if (newPricingType === 'per_sqft') {
      productData.price_per_sqft = parseFloat(newPrice);
      productData.flat_price = null;
    } else {
      productData.flat_price = parseFloat(newPrice);
      productData.price_per_sqft = null;
    }

    await addProduct(productData);
    
    // Reset form
    setNewProductName("");
    setNewWooId("");
    setNewPrice("");
    setNewDescription("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Product Pricing Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage WePrintWraps product catalog, install rates, and tax settings
          </p>
        </div>
      </div>

      {/* Global Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Install Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                type="number"
                value={installRate}
                onChange={(e) => setInstallRate(parseFloat(e.target.value) || 0)}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">/hour</span>
              <Button onClick={saveSettings} size="sm" className="bg-gradient-primary">
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Tax Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">%</span>
              <Button onClick={saveSettings} size="sm" className="bg-gradient-primary">
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Product */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Add New Product
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Product Name"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
            />
            <Input
              type="number"
              placeholder="WooCommerce Product ID"
              value={newWooId}
              onChange={(e) => setNewWooId(e.target.value)}
            />
            <Select value={newPricingType} onValueChange={(value: any) => setNewPricingType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="per_sqft">Per Square Foot</SelectItem>
                <SelectItem value="flat">Flat Rate</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder={newPricingType === 'per_sqft' ? "Price per sq ft" : "Flat price"}
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wrap">Wrap</SelectItem>
                <SelectItem value="window">Window</SelectItem>
                <SelectItem value="design">Design Service</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>
          <Button onClick={handleAddProduct} className="bg-gradient-primary mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </CardContent>
      </Card>

      {/* Product List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">WePrintWraps Product Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {products.map((product) => (
              <div key={product.id} className="flex items-center gap-2 p-3 bg-background/50 rounded-lg border border-border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{product.product_name}</span>
                    <Badge variant="outline" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      ID: {product.woo_product_id}
                    </Badge>
                  </div>
                  {product.description && (
                    <p className="text-xs text-muted-foreground mt-1">{product.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {product.pricing_type === 'per_sqft' ? 'per sq ft' : 'flat rate'}
                  </span>
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={product.pricing_type === 'per_sqft' ? product.price_per_sqft || 0 : product.flat_price || 0}
                    onChange={(e) => updateProductPrice(product.id, product.pricing_type, parseFloat(e.target.value) || 0)}
                    className="w-24"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteProduct(product.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
