import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Save, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductPrice {
  name: string;
  price: number;
}

export default function ProductPricingAdmin() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductPrice[]>([
    { name: "Full Wrap", price: 3500 },
    { name: "Partial Wrap", price: 1800 },
    { name: "Chrome Delete", price: 800 },
    { name: "Color Change Film", price: 2800 },
    { name: "Printed Wrap Film", price: 3200 },
    { name: "PPF (Paint Protection Film)", price: 2500 },
    { name: "Window Tint", price: 600 },
    { name: "Window Perf", price: 1200 },
    { name: "Full Window Perf", price: 1200 },
    { name: "Rear Window Perf", price: 500 },
    { name: "Side Window Perf", price: 800 },
    { name: "Custom Window Perf", price: 1500 },
  ]);

  const [installRate, setInstallRate] = useState(75);
  const [taxRate, setTaxRate] = useState(8);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");

  // Load from localStorage
  useEffect(() => {
    const savedProducts = localStorage.getItem("productPrices");
    const savedInstallRate = localStorage.getItem("installRate");
    const savedTaxRate = localStorage.getItem("taxRate");
    
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedInstallRate) setInstallRate(parseFloat(savedInstallRate));
    if (savedTaxRate) setTaxRate(parseFloat(savedTaxRate));
  }, []);

  const saveSettings = () => {
    localStorage.setItem("productPrices", JSON.stringify(products));
    localStorage.setItem("installRate", installRate.toString());
    localStorage.setItem("taxRate", taxRate.toString());
    
    toast({
      title: "Settings Saved",
      description: "Product pricing has been updated successfully.",
    });
  };

  const updateProductPrice = (index: number, newPrice: number) => {
    const updated = [...products];
    updated[index].price = newPrice;
    setProducts(updated);
  };

  const deleteProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const addProduct = () => {
    if (!newProductName || !newProductPrice) {
      toast({
        title: "Error",
        description: "Please enter both product name and price.",
        variant: "destructive",
      });
      return;
    }

    setProducts([...products, { name: newProductName, price: parseFloat(newProductPrice) }]);
    setNewProductName("");
    setNewProductPrice("");
    
    toast({
      title: "Product Added",
      description: `${newProductName} has been added to the pricing list.`,
    });
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Product Pricing Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage product pricing, install rates, and tax settings
          </p>
        </div>
        <Button onClick={saveSettings} className="bg-gradient-primary text-white">
          <Save className="w-4 h-4 mr-2" />
          Save All Changes
        </Button>
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
          <div className="flex gap-2">
            <Input
              placeholder="Product Name"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Price"
              value={newProductPrice}
              onChange={(e) => setNewProductPrice(e.target.value)}
              className="w-32"
            />
            <Button onClick={addProduct} className="bg-gradient-primary text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Product List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Product Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {products.map((product, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-background/50 rounded-lg border border-border">
                <span className="flex-1 text-sm font-medium text-foreground">{product.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={product.price}
                    onChange={(e) => updateProductPrice(index, parseFloat(e.target.value) || 0)}
                    className="w-32"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteProduct(index)}
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
